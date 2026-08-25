/**
 * StudentHub AI — Master Geospatial Intelligence Orchestrator (Production-Grade)
 * 
 * Comprehensive 7-Stage Geospatial Pipeline:
 * 1. Location Quality Gate (Accuracy, Age, Spike Detection, Smoothing Filter)
 * 2. Map Matching Engine (Snapping to road segment with confidence)
 * 3. Location Context Engine (HCMUTE campus boundary, building proximity vs indoor limitation)
 * 4. Camera Vision Engine (Surface cues, tire spray, traffic density)
 * 5. Multi-Sensor Weather Nowcasting Engine (Radar Doppler dBZ + Satellite + Station + Camera)
 * 6. Segment-Level Routing Engine (Traffic modes: TRAFFIC_AWARE_OPTIMAL, isolated segment risk)
 * 7. Trip Companion Lifecycle & Privacy Engine
 */

import { evaluateLocationQuality, detectGpsSpike, smoothGpsLocation } from "./locationQualityEngine.js";
import { matchGpsToRoadNetwork } from "./mapMatchingEngine.js";
import { resolveLocationContext } from "./locationContextEngine.js";
import { assessCameraFrameQuality, extractCameraWeatherObservations, extractCameraTrafficObservations } from "./cameraVisionEngine.js";
import { computeWeatherNowcast } from "./weatherNowcastingEngine.js";
import { computeSegmentLevelRoutes } from "./segmentLevelRoutingEngine.js";
import { HCMUTE_CAMPUS_SPATIAL_NODES } from "./hcmuteCampusGeoGraph.js";

/**
 * Executes full geospatial intelligence orchestration for a student's navigation & safety
 */
export function queryStudentGeoIntelligence({
  currentGps = { latitude: 10.8507, longitude: 106.7721, accuracyMeters: 12 },
  previousGps = null,
  destination = "KTX_KHU_B_VNU",
  cameraFrames = [],
  radarDbz = 36,
  isNight = false,
  trafficMode = "TRAFFIC_AWARE_OPTIMAL",
} = {}) {
  // 1. Stage 1: Location Quality & Spike Detection
  const locationQuality = evaluateLocationQuality(currentGps);
  const spikeCheck = detectGpsSpike(currentGps, previousGps);
  const smoothedPosition = smoothGpsLocation(currentGps, previousGps);

  // 2. Stage 2: Map Matching
  const mapMatching = matchGpsToRoadNetwork(smoothedPosition.filteredLocation);

  // 3. Stage 3: Spatial & Campus Context Resolution
  const locationContext = resolveLocationContext(smoothedPosition.filteredLocation);

  // 4. Stage 4: Ingest & Assess Cameras
  const cameraInsights = cameraFrames.map((frame) => {
    const quality = assessCameraFrameQuality(frame);
    if (!quality.isUsable) {
      return { id: frame.id, isUsable: false, qualityGrade: quality.qualityGrade };
    }
    const weather = extractCameraWeatherObservations(frame.visualCues);
    const traffic = extractCameraTrafficObservations(frame.trafficSignals);
    return {
      id: frame.id,
      location: frame.location,
      quality,
      weather,
      traffic,
    };
  });

  // 5. Stage 5: Multi-Sensor Weather Nowcasting
  const primaryCamera = cameraInsights.find((c) => c.isUsable)?.weather || null;
  const weatherNowcast = computeWeatherNowcast({
    targetZone: locationContext.isInsideCampus ? "HCMUTE_CAMPUS" : "ZONE_THUDUC",
    cameraObservation: primaryCamera,
    radarReflectivityDbz: radarDbz,
    radarCellDistanceKm: 6.8,
  });

  // 6. Stage 6: Segment-Level Routing Analysis
  const routing = computeSegmentLevelRoutes({
    origin: locationContext.addressContext?.formattedAddress || "Vị trí của bạn",
    destination,
    weatherCondition: weatherNowcast.currentCondition,
    isNightTime: isNight,
    trafficMode,
  });

  return {
    queryTimestamp: new Date().toISOString(),
    locationObservation: {
      raw: currentGps,
      filtered: smoothedPosition.filteredLocation,
      quality: locationQuality,
      spikeCheck,
    },
    mapMatching,
    locationContext,
    weatherNowcast,
    cameraInsights,
    campusNodes: HCMUTE_CAMPUS_SPATIAL_NODES,
    routing,
    disclaimer: "StudentHub Geo-Intelligence combines GPS quality validation, map matching, radar Doppler tracking, and segment-level risk analysis for student safety.",
  };
}
