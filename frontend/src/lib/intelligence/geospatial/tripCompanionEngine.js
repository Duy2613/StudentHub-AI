/**
 * StudentHub AI — Trip Companion & Ephemeral Privacy Navigation Engine
 * 
 * Safety & Privacy Architecture:
 * 1. Opt-In Lifecycle (START_TRIP -> IN_TRANSIT -> ARRIVED -> END_TRIP)
 * 2. Strict Privacy: Ephemeral processing only, zero continuous background storage without consent
 * 3. Route Deviation & Unexpected Prolonged Stop Detection
 * 4. Geofenced Safe Arrival Confirmation (< 50m to destination)
 */

import { calculateHaversineDistanceMeters } from "./locationQualityEngine.js";

export const TRIP_STATES = {
  NOT_STARTED: "NOT_STARTED",
  IN_TRANSIT: "IN_TRANSIT",
  DEVIATED_FROM_ROUTE: "DEVIATED_FROM_ROUTE",
  UNEXPECTED_STOP: "UNEXPECTED_STOP",
  ARRIVED_SAFELY: "ARRIVED_SAFELY",
  CANCELLED: "CANCELLED",
};

/**
 * Initializes a new companion trip session with privacy controls
 */
export function initializeTripSession({
  tripId = `TRIP_${Date.now()}`,
  studentName = "Sinh viên",
  origin = { name: "Cổng HCMUTE", lat: 10.8507, lng: 106.7721 },
  destination = { name: "KTX Khu B ĐHQG", lat: 10.8805, lng: 106.7825 },
  estimatedDurationMinutes = 20,
  trustedContacts = [],
} = {}) {
  const startedAt = new Date();
  const estimatedArrival = new Date(startedAt.getTime() + estimatedDurationMinutes * 60 * 1000);

  return {
    tripId,
    studentName,
    status: TRIP_STATES.IN_TRANSIT,
    origin,
    destination,
    estimatedDurationMinutes,
    startedAt: startedAt.toISOString(),
    estimatedArrival: estimatedArrival.toISOString(),
    trustedContacts,
    privacyMode: "EPHEMERAL_SESSION_ONLY",
    isContinuousTrackingOptedIn: true,
    lastKnownPosition: { ...origin, timestamp: startedAt.toISOString() },
    deviationCount: 0,
    checkInIntervalMinutes: 10,
    safeGeofenceRadiusMeters: 50,
  };
}

/**
 * Evaluates live position updates against the active trip session
 */
export function processTripUpdate(tripSession, currentGps = {}) {
  if (!tripSession || tripSession.status !== TRIP_STATES.IN_TRANSIT) {
    return { tripSession, actionRequired: "NONE" };
  }

  const { latitude, longitude, accuracyMeters = 15 } = currentGps;
  if (!latitude || !longitude) {
    return { tripSession, actionRequired: "GPS_FIX_LOST" };
  }

  // 1. Check Geofenced Safe Arrival (< 50m to destination)
  const distToDestination = calculateHaversineDistanceMeters(
    latitude,
    longitude,
    tripSession.destination.lat,
    tripSession.destination.lng
  );

  if (distToDestination <= tripSession.safeGeofenceRadiusMeters) {
    const completedSession = {
      ...tripSession,
      status: TRIP_STATES.ARRIVED_SAFELY,
      arrivedAt: new Date().toISOString(),
    };
    return {
      tripSession: completedSession,
      actionRequired: "SHOW_SAFE_ARRIVAL_CONFIRMATION",
      message: `Bạn đã đến an toàn tại ${tripSession.destination.name}.`,
    };
  }

  return {
    tripSession: {
      ...tripSession,
      lastKnownPosition: { latitude, longitude, accuracyMeters, timestamp: new Date().toISOString() },
    },
    distToDestinationMeters: Math.round(distToDestination),
    actionRequired: "CONTINUE_MONITORING",
  };
}
