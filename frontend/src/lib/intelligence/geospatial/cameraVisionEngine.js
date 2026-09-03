/**
 * StudentHub AI — Camera Computer Vision & Quality Analysis Engine
 * 
 * Analyzes traffic camera frames for:
 * 1. Frame Quality & Usability (Blur, Darkness, Glare, Lens Droplets, Stale Frame)
 * 2. Visual Weather Cues (Rain Streaks, Tire Spray, Wet Road Sheen, Standing Water, Visibility Proxy)
 * 3. Traffic Density & Flow (Motorcycles, Cars, Buses, Queueing, Congestion)
 * 4. Road Incident Candidate Detection (Stopped Vehicles, Road Hazard, Flood Warning)
 * 
 * Strict Scientific Rule: Camera visual evidence is NOT a complete weather forecast sensor.
 * It provides local observational ground-truth to be fused with Radar, Satellite, and Weather Stations.
 */

export const CAMERA_FRAME_QUALITY_THRESHOLDS = {
  MIN_BRIGHTNESS: 25, // 0 - 255
  MAX_BRIGHTNESS: 240,
  MIN_LAPLACIAN_VARIANCE: 80, // Sharpness metric
  MAX_STALE_FRAME_SECONDS: 120,
};

export const VISUAL_WEATHER_STATES = {
  CLEAR: "CLEAR",
  PARTLY_CLOUDY: "PARTLY_CLOUDY",
  OVERCAST: "OVERCAST",
  LIGHT_RAIN: "LIGHT_RAIN",
  MODERATE_RAIN: "MODERATE_RAIN",
  HEAVY_DOWNPOUR: "HEAVY_DOWNPOUR",
  LOW_VISIBILITY_FOG: "LOW_VISIBILITY_FOG",
  WET_ROAD_SHEEN: "WET_ROAD_SHEEN",
  STANDING_WATER: "STANDING_WATER",
  NIGHT_CONDITIONS: "NIGHT_CONDITIONS",
  UNKNOWN: "UNKNOWN",
};

/**
 * Assesses camera frame quality before applying high-level vision models
 */
export function assessCameraFrameQuality(frameMetadata = {}) {
  const {
    frameAgeSeconds = 15,
    brightness = 135,
    laplacianVariance = 145,
    hasLensDroplets = false,
    resolution = "1920x1080",
  } = frameMetadata;

  const isStale = frameAgeSeconds > CAMERA_FRAME_QUALITY_THRESHOLDS.MAX_STALE_FRAME_SECONDS;
  const isTooDark = brightness < CAMERA_FRAME_QUALITY_THRESHOLDS.MIN_BRIGHTNESS;
  const isOverexposed = brightness > CAMERA_FRAME_QUALITY_THRESHOLDS.MAX_BRIGHTNESS;
  const isBlurry = laplacianVariance < CAMERA_FRAME_QUALITY_THRESHOLDS.MIN_LAPLACIAN_VARIANCE;

  let qualityScore = 1.0;
  const qualityIssues = [];

  if (isStale) {
    qualityScore -= 0.6;
    qualityIssues.push("FRAME_STALE_OVERDUE");
  }
  if (isTooDark) {
    qualityScore -= 0.3;
    qualityIssues.push("LOW_LIGHT_NIGHT");
  }
  if (isOverexposed) {
    qualityScore -= 0.3;
    qualityIssues.push("OVEREXPOSURE_GLARE");
  }
  if (isBlurry) {
    qualityScore -= 0.4;
    qualityIssues.push("IMAGE_BLUR_OUT_OF_FOCUS");
  }
  if (hasLensDroplets) {
    qualityScore -= 0.15;
    qualityIssues.push("LENS_WATER_DROPLETS_DETECTED");
  }

  qualityScore = Math.max(0.1, Number(qualityScore.toFixed(2)));

  return {
    isUsable: qualityScore >= 0.4,
    qualityScore,
    qualityGrade: qualityScore >= 0.8 ? "EXCELLENT" : qualityScore >= 0.5 ? "ACCEPTABLE" : "DEGRADED",
    qualityIssues,
    frameAgeSeconds,
    resolution,
  };
}

/**
 * Extracts visual weather cues and road conditions from camera observations
 */
export function extractCameraWeatherObservations(visualCues = {}) {
  const {
    rainStreaksDetected = false,
    tireSprayDetected = false,
    roadReflectivitySheen = 0.8, // 0 to 1
    standingWaterPatches = false,
    pedestriansWithUmbrellas = false,
    contrastRatio = 0.75, // Lower contrast proxy for fog/rain haze
    treeMovementIntensity = "LOW", // LOW | MODERATE | HIGH
  } = visualCues;

  const detectedCues = [];
  let inferredVisualState = VISUAL_WEATHER_STATES.CLEAR;
  let rainConfidence = 0.5;

  if (rainStreaksDetected) {
    detectedCues.push("RAIN_STREAKS");
    rainConfidence += 0.25;
  }
  if (tireSprayDetected) {
    detectedCues.push("VEHICLE_TIRE_SPRAY");
    rainConfidence += 0.2;
  }
  if (roadReflectivitySheen > 0.6) {
    detectedCues.push("WET_ROAD_SURFACE_SHEEN");
    rainConfidence += 0.15;
  }
  if (standingWaterPatches) {
    detectedCues.push("STANDING_WATER_ACCUMULATION");
    rainConfidence += 0.2;
  }
  if (pedestriansWithUmbrellas) {
    detectedCues.push("PEDESTRIANS_WITH_RAINCOATS_OR_UMBRELLAS");
    rainConfidence += 0.2;
  }

  // Determine state
  if (standingWaterPatches && (rainStreaksDetected || tireSprayDetected)) {
    inferredVisualState = VISUAL_WEATHER_STATES.HEAVY_DOWNPOUR;
  } else if (rainStreaksDetected || tireSprayDetected || pedestriansWithUmbrellas) {
    inferredVisualState = VISUAL_WEATHER_STATES.MODERATE_RAIN;
  } else if (roadReflectivitySheen > 0.6) {
    inferredVisualState = VISUAL_WEATHER_STATES.WET_ROAD_SHEEN;
  } else if (contrastRatio < 0.4) {
    inferredVisualState = VISUAL_WEATHER_STATES.LOW_VISIBILITY_FOG;
  } else {
    inferredVisualState = VISUAL_WEATHER_STATES.CLEAR;
  }

  return {
    inferredVisualState,
    observationType: "CAMERA_VISUAL_SURFACE",
    roadCondition: standingWaterPatches ? "STANDING_WATER" : roadReflectivitySheen > 0.5 ? "WET" : "DRY",
    visibilityProxy: contrastRatio >= 0.7 ? "GOOD" : contrastRatio >= 0.45 ? "MODERATE" : "POOR",
    windEffect: treeMovementIntensity === "HIGH" ? "STRONG_WIND_EFFECT" : "NORMAL",
    detectedCues,
    observationConfidence: Math.min(0.95, Number(rainConfidence.toFixed(2))),
    disclaimer: "Camera observations reflect surface ground-truth and must be fused with radar for predictive forecasting.",
  };
}

/**
 * Evaluates traffic density and detects candidate road incidents
 */
export function extractCameraTrafficObservations(trafficSignals = {}) {
  const {
    motorcycleCount = 45,
    carCount = 12,
    busCount = 2,
    averageSpeedKmh = 28,
    isVehicleStoppedAbnormally = false,
    isLaneBlocked = false,
    intersectionId = "INT_THUDUC_01",
  } = trafficSignals;

  const totalVehicles = motorcycleCount + carCount + busCount;
  let trafficDensity = "FREE_FLOW"; // FREE_FLOW | MODERATE | HEAVY | CONGESTED

  if (totalVehicles > 80 || averageSpeedKmh < 12) {
    trafficDensity = "CONGESTED";
  } else if (totalVehicles > 45 || averageSpeedKmh < 22) {
    trafficDensity = "HEAVY";
  } else if (totalVehicles > 20) {
    trafficDensity = "MODERATE";
  }

  // Incident detection (Marked strictly as POSSIBLE_INCIDENT unless independently confirmed)
  const candidateIncidents = [];
  if (isVehicleStoppedAbnormally) {
    candidateIncidents.push({
      type: "POSSIBLE_INCIDENT",
      subtype: "STOPPED_VEHICLE_OBSTRUCTION",
      severity: "MODERATE",
      verificationStatus: "UNCONFIRMED_CANDIDATE",
      recommendation: "Giảm tốc độ và chú ý quan sát khi qua nút giao.",
    });
  }
  if (isLaneBlocked) {
    candidateIncidents.push({
      type: "POSSIBLE_INCIDENT",
      subtype: "BLOCKED_LANE_BOTTLENECK",
      severity: "HIGH",
      verificationStatus: "UNCONFIRMED_CANDIDATE",
      recommendation: "Nên chuyển sang tuyến đường tránh song hành.",
    });
  }

  return {
    intersectionId,
    totalVehicles,
    breakdown: { motorcycles: motorcycleCount, cars: carCount, buses: busCount },
    averageSpeedKmh,
    trafficDensity,
    hasCandidateIncidents: candidateIncidents.length > 0,
    candidateIncidents,
  };
}
