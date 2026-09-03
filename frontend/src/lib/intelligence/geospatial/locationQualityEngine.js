/**
 * StudentHub AI — Location Quality & GPS Anomaly Detection Engine
 * 
 * Production-grade Location Integrity & Spike Protection:
 * 1. Location Source Hierarchy (DEVICE_GPS, BROWSER_GEOLOCATION, GOOGLE_GEOLOCATION_API, USER_SELECTED, etc.)
 * 2. Quality Gate (EXCELLENT, GOOD, ACCEPTABLE, POOR, INVALID) based on accuracy radius & age
 * 3. Spike & Teleportation Detection (Detects impossible velocity > 120km/h or jumps > 500m in < 2s)
 * 4. GPS Noise Smoothing Filter (Preserves both RAW_LOCATION and FILTERED_LOCATION)
 */

export const LOCATION_SOURCES = {
  DEVICE_GPS: "DEVICE_GPS",
  DEVICE_NETWORK: "DEVICE_NETWORK_LOCATION",
  BROWSER_GEOLOCATION: "BROWSER_GEOLOCATION",
  GOOGLE_GEOLOCATION_API: "GOOGLE_GEOLOCATION_API",
  MAP_GEOCODING: "MAP_GEOCODING",
  USER_SELECTED: "USER_SELECTED_LOCATION",
  SAVED_LOCATION: "SAVED_LOCATION",
  ROUTE_LOCATION: "ROUTE_LOCATION",
  CAMERA_LOCATION: "CAMERA_LOCATION",
  FACILITY_LOCATION: "FACILITY_LOCATION",
  INCIDENT_LOCATION: "INCIDENT_LOCATION",
};

export const ACCURACY_THRESHOLDS = {
  EXCELLENT: 10, // <= 10m
  GOOD: 25, // <= 25m
  ACCEPTABLE: 60, // <= 60m
  POOR: 150, // <= 150m
  MAX_STALE_AGE_MS: 30000, // 30s
  MAX_VALID_SPEED_KMH: 120, // Max urban/commute speed threshold
};

/**
 * Calculates Haversine distance in meters between two lat/lng pairs
 */
export function calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Evaluates the quality and validity of a single location observation
 */
export function evaluateLocationQuality(observation = {}) {
  const {
    latitude,
    longitude,
    accuracyMeters = 15,
    timestamp = Date.now(),
    source = LOCATION_SOURCES.BROWSER_GEOLOCATION,
    speedMps = null,
    heading = null,
  } = observation;

  if (typeof latitude !== "number" || typeof longitude !== "number" || isNaN(latitude) || isNaN(longitude)) {
    return {
      isValid: false,
      qualityGrade: "INVALID",
      accuracyMeters: null,
      reason: "COORDINATES_MISSING_OR_NAN",
    };
  }

  // Range validation for Vietnam territory (~8.5 to ~23.5 Lat, ~102.0 to ~110.0 Lng)
  const isWithinVietnam = latitude >= 8.0 && latitude <= 24.0 && longitude >= 102.0 && longitude <= 110.0;

  const ageMs = Date.now() - (typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime());
  const isStale = ageMs > ACCURACY_THRESHOLDS.MAX_STALE_AGE_MS;

  let qualityGrade = "ACCEPTABLE";
  if (accuracyMeters <= ACCURACY_THRESHOLDS.EXCELLENT) qualityGrade = "EXCELLENT";
  else if (accuracyMeters <= ACCURACY_THRESHOLDS.GOOD) qualityGrade = "GOOD";
  else if (accuracyMeters <= ACCURACY_THRESHOLDS.ACCEPTABLE) qualityGrade = "ACCEPTABLE";
  else qualityGrade = "POOR";

  if (isStale) qualityGrade = "POOR";

  return {
    isValid: isWithinVietnam && !isNaN(accuracyMeters),
    qualityGrade,
    accuracyMeters,
    observationAgeSeconds: Math.max(0, Math.round(ageMs / 1000)),
    isStale,
    isWithinVietnam,
    source,
    heading,
    speedKmh: speedMps !== null ? Number((speedMps * 3.6).toFixed(1)) : null,
    confidenceScore: qualityGrade === "EXCELLENT" ? 0.98 : qualityGrade === "GOOD" ? 0.85 : qualityGrade === "ACCEPTABLE" ? 0.65 : 0.4,
  };
}

/**
 * Detects GPS spikes, impossible teleportation jumps, or urban canyon multipath errors
 */
export function detectGpsSpike(currentPos, previousPos) {
  if (!previousPos || !previousPos.latitude || !previousPos.longitude) {
    return { hasSpike: false, status: "INITIAL_POSITION" };
  }

  const distMeters = calculateHaversineDistanceMeters(
    previousPos.latitude,
    previousPos.longitude,
    currentPos.latitude,
    currentPos.longitude
  );

  const prevTime = typeof previousPos.timestamp === "number" ? previousPos.timestamp : new Date(previousPos.timestamp).getTime();
  const currTime = typeof currentPos.timestamp === "number" ? currentPos.timestamp : new Date(currentPos.timestamp).getTime();
  const timeDeltaSeconds = Math.max(0.1, (currTime - prevTime) / 1000);

  const calculatedSpeedKmh = (distMeters / timeDeltaSeconds) * 3.6;

  // Jump > 500m in <= 5 seconds or speed > 120km/h in urban commute
  if (distMeters > 500 && timeDeltaSeconds <= 5) {
    return {
      hasSpike: true,
      status: "INVALID_POSITION_JUMP",
      distMeters: Math.round(distMeters),
      timeDeltaSeconds: Number(timeDeltaSeconds.toFixed(1)),
      calculatedSpeedKmh: Math.round(calculatedSpeedKmh),
      reason: `Vị trí thay đổi đột ngột ${Math.round(distMeters)}m trong ${timeDeltaSeconds.toFixed(1)}s (Vận tốc phi lý ${Math.round(calculatedSpeedKmh)} km/h).`,
    };
  }

  if (calculatedSpeedKmh > ACCURACY_THRESHOLDS.MAX_VALID_SPEED_KMH) {
    return {
      hasSpike: true,
      status: "EXCESSIVE_VELOCITY_ANOMALY",
      calculatedSpeedKmh: Math.round(calculatedSpeedKmh),
      reason: `Vận tốc tính toán (${Math.round(calculatedSpeedKmh)} km/h) vượt quá ngưỡng lưu thông đô thị cho phép.`,
    };
  }

  return {
    hasSpike: false,
    status: "POSITION_TRACK_NORMAL",
    distMeters: Math.round(distMeters),
    timeDeltaSeconds: Number(timeDeltaSeconds.toFixed(1)),
    calculatedSpeedKmh: Math.round(calculatedSpeedKmh),
  };
}

/**
 * Smooths noisy GPS jitter using Exponential Moving Average while preserving raw coordinates
 */
export function smoothGpsLocation(rawPosition, previousFilteredPosition, smoothingFactor = 0.65) {
  if (!previousFilteredPosition || !previousFilteredPosition.latitude) {
    return {
      rawLocation: { ...rawPosition },
      filteredLocation: { ...rawPosition },
      isSmoothed: false,
    };
  }

  // Alpha = 1 means use raw, lower alpha means heavier smoothing
  const alpha = Math.min(1.0, Math.max(0.1, smoothingFactor));
  const filteredLat = previousFilteredPosition.latitude + alpha * (rawPosition.latitude - previousFilteredPosition.latitude);
  const filteredLng = previousFilteredPosition.longitude + alpha * (rawPosition.longitude - previousFilteredPosition.longitude);

  return {
    rawLocation: { ...rawPosition },
    filteredLocation: {
      latitude: Number(filteredLat.toFixed(7)),
      longitude: Number(filteredLng.toFixed(7)),
      accuracyMeters: rawPosition.accuracyMeters,
      timestamp: rawPosition.timestamp,
    },
    isSmoothed: true,
    smoothingAlpha: alpha,
  };
}
