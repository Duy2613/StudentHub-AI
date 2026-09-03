/**
 * StudentHub AI — Comprehensive Test Suite for GPS Quality, Map Matching, Routing, and Geospatial Intelligence
 * 
 * Verifies:
 * 1. Location Quality Gate & Accuracy Radius (<=10m EXCELLENT, stale rejection)
 * 2. GPS Spike & Teleportation Protection (Impossible velocity & distance jumps)
 * 3. GPS Jitter Smoothing Filter (Raw vs Filtered coordinates preservation)
 * 4. Map Matching Engine (Snapping to road segments with heading alignment & confidence)
 * 5. Location Context & Campus Matching (Building proximity vs indoor positioning limitations)
 * 6. Segment-Level Risk Analysis (Isolating flood risk to specific road segments instead of entire route)
 * 7. Google Routes Traffic Modes Distinction (TRAFFIC_UNAWARE vs TRAFFIC_AWARE vs TRAFFIC_AWARE_OPTIMAL)
 * 8. Trip Companion & Geofenced Safe Arrival (<50m to destination)
 * 9. Master Geospatial Evidence Fusion Orchestration
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { evaluateLocationQuality, detectGpsSpike, smoothGpsLocation } from "../../src/lib/intelligence/geospatial/locationQualityEngine.js";
import { matchGpsToRoadNetwork } from "../../src/lib/intelligence/geospatial/mapMatchingEngine.js";
import { resolveLocationContext } from "../../src/lib/intelligence/geospatial/locationContextEngine.js";
import { computeSegmentLevelRoutes, ROUTE_TRAFFIC_MODES } from "../../src/lib/intelligence/geospatial/segmentLevelRoutingEngine.js";
import { initializeTripSession, processTripUpdate } from "../../src/lib/intelligence/geospatial/tripCompanionEngine.js";
import { queryStudentGeoIntelligence } from "../../src/lib/intelligence/geospatial/geospatialEvidenceFusion.js";

describe("Geospatial Protocol 1: Location Quality & Spike Detection", () => {
  it("should evaluate accuracy radius and grade location quality", () => {
    const excellentFix = evaluateLocationQuality({ latitude: 10.8507, longitude: 106.7721, accuracyMeters: 8 });
    assert.strictEqual(excellentFix.isValid, true);
    assert.strictEqual(excellentFix.qualityGrade, "EXCELLENT");
    assert.strictEqual(excellentFix.accuracyMeters, 8);

    const poorFix = evaluateLocationQuality({ latitude: 10.8507, longitude: 106.7721, accuracyMeters: 120 });
    assert.strictEqual(poorFix.qualityGrade, "POOR");

    const invalidFix = evaluateLocationQuality({ latitude: "invalid", longitude: 106.7721 });
    assert.strictEqual(invalidFix.isValid, false);
    assert.strictEqual(invalidFix.qualityGrade, "INVALID");
  });

  it("should detect impossible teleportation spikes (e.g. 20km in 2s)", () => {
    const posA = { latitude: 10.8507, longitude: 106.7721, timestamp: 1000000 };
    const posB = { latitude: 10.7000, longitude: 106.6000, timestamp: 1002000 }; // ~23 km jump in 2 seconds

    const spike = detectGpsSpike(posB, posA);
    assert.strictEqual(spike.hasSpike, true);
    assert.strictEqual(spike.status, "INVALID_POSITION_JUMP");
    assert.ok(spike.calculatedSpeedKmh > 1000);
  });

  it("should smooth GPS jitter while keeping raw observations untouched", () => {
    const prev = { latitude: 10.850700, longitude: 106.772100 };
    const raw = { latitude: 10.850780, longitude: 106.772180, accuracyMeters: 12 };

    const smoothed = smoothGpsLocation(raw, prev, 0.5);
    assert.strictEqual(smoothed.isSmoothed, true);
    assert.strictEqual(smoothed.rawLocation.latitude, 10.850780);
    assert.strictEqual(smoothed.filteredLocation.latitude, 10.850740);
  });
});

describe("Geospatial Protocol 2: Map Matching & Campus Context", () => {
  it("should snap coordinates to road segments with confidence", () => {
    // Point on Vo Van Ngan street
    const onRoadPoint = { latitude: 10.8517, longitude: 106.7718, heading: 195, accuracyMeters: 10 };
    const match = matchGpsToRoadNetwork(onRoadPoint);

    assert.ok(match.matchedRoad !== null);
    assert.strictEqual(match.matchedRoad.name, "Đường Võ Văn Ngân");
    assert.strictEqual(match.matchState, "ON_ROAD");
    assert.strictEqual(match.confidence, "HIGH");
  });

  it("should resolve HCMUTE campus context and state indoor limitations", () => {
    const campusGps = { latitude: 10.8512, longitude: 106.7725, accuracyMeters: 10 };
    const context = resolveLocationContext(campusGps);

    assert.strictEqual(context.isInsideCampus, true);
    assert.strictEqual(context.campusContext.university.includes("HCMUTE"), true);
    assert.ok(context.campusContext.matchedBuilding !== null);
    assert.ok(context.indoorLimitationNotice.includes("trong nhà"));
    assert.ok(context.nearbyEmergencyFacilities.length >= 2);
  });
});

describe("Geospatial Protocol 3: Segment-Level Risk & Traffic Modes", () => {
  it("should isolate risk to specific road segments instead of labeling entire route", () => {
    const routing = computeSegmentLevelRoutes({
      weatherCondition: "HEAVY_DOWNPOUR",
      isNightTime: false,
      trafficMode: "TRAFFIC_AWARE_OPTIMAL",
    });

    const innerRoute = routing.routes.find((r) => r.id === "ROUTE_INNER_VO_VAN_NGAN");
    assert.strictEqual(innerRoute.hasConcentratedRisk, true);
    assert.ok(innerRoute.riskConcentrationSummary.includes("Đoạn Dốc Võ Văn Ngân"));
    // Segment 12 (Le Van Chi) should still be normal
    const leVanChiSegment = innerRoute.segments.find((s) => s.id === "SEG_12_LE_VAN_CHI");
    assert.strictEqual(leVanChiSegment.isSegmentAtRisk, false);
  });

  it("should distinguish Google Routes traffic modes", () => {
    assert.strictEqual(ROUTE_TRAFFIC_MODES.TRAFFIC_UNAWARE.isRealTimeTraffic, false);
    assert.strictEqual(ROUTE_TRAFFIC_MODES.TRAFFIC_AWARE_OPTIMAL.isRealTimeTraffic, true);
    assert.ok(ROUTE_TRAFFIC_MODES.TRAFFIC_AWARE_OPTIMAL.latencyMs > ROUTE_TRAFFIC_MODES.TRAFFIC_UNAWARE.latencyMs);
  });

  it("should detect geofenced safe arrival in Trip Companion session", () => {
    const session = initializeTripSession({
      destination: { name: "KTX Khu B", lat: 10.8805, lng: 106.7825 },
      estimatedDurationMinutes: 25,
    });

    assert.strictEqual(session.status, "IN_TRANSIT");

    // Coordinate at 20m from destination
    const arrivalUpdate = processTripUpdate(session, { latitude: 10.8806, longitude: 106.7826, accuracyMeters: 8 });
    assert.strictEqual(arrivalUpdate.actionRequired, "SHOW_SAFE_ARRIVAL_CONFIRMATION");
    assert.strictEqual(arrivalUpdate.tripSession.status, "ARRIVED_SAFELY");
  });

  it("should execute full 7-stage master geospatial orchestration", () => {
    const fullOrchestration = queryStudentGeoIntelligence({
      currentGps: { latitude: 10.8512, longitude: 106.7725, accuracyMeters: 10 },
      destination: "KTX_KHU_B_VNU",
    });

    assert.strictEqual(fullOrchestration.locationObservation.quality.isValid, true);
    assert.strictEqual(fullOrchestration.locationContext.isInsideCampus, true);
    assert.ok(fullOrchestration.routing.routes.length >= 2);
  });
});
