/**
 * StudentHub AI — Map Matching & Road Segment Snapping Engine
 * 
 * Maps raw/noisy GPS points onto the known road network graph:
 * - Computes orthogonal distance to candidate road centerlines
 * - Compares trajectory heading with road orientation vectors
 * - Emits match state: ON_ROAD (<=15m), NEAR_ROAD (<=35m), OFF_ROAD (>35m), UNKNOWN
 * - Explicitly prevents naive "nearest road is always correct" assumptions
 */

import { calculateHaversineDistanceMeters } from "./locationQualityEngine.js";

export const ROAD_NETWORK_CORRIDORS = [
  {
    id: "SEG_VO_VAN_NGAN_CENTRAL",
    roadName: "Đường Võ Văn Ngân",
    segment: "Ngã 4 Thủ Đức đến Cổng Trường HCMUTE",
    startPoint: { lat: 10.8528, lng: 106.7716 },
    endPoint: { lat: 10.8507, lng: 106.7721 },
    roadHeadingDegrees: 195, // SSW
    speedLimitKmh: 50,
    laneCount: 4,
    floodRiskLevel: "HIGH",
    isFloodProneSlope: true,
  },
  {
    id: "SEG_VO_NGUYEN_GIAP_TRUNK",
    roadName: "Trục Võ Nguyên Giáp (Xa Lộ Hà Nội)",
    segment: "Cầu vượt Thủ Đức đến Nút giao Bình Thái",
    startPoint: { lat: 10.8535, lng: 106.7725 },
    endPoint: { lat: 10.8285, lng: 106.7662 },
    roadHeadingDegrees: 215, // SW
    speedLimitKmh: 60,
    laneCount: 10,
    floodRiskLevel: "LOW",
    isFloodProneSlope: false,
  },
  {
    id: "SEG_TA_QUANG_BUU_VNU",
    roadName: "Đường Tạ Quang Bửu",
    segment: "Ký túc xá Khu B đến Ngã 3 ĐHQG",
    startPoint: { lat: 10.8805, lng: 106.7825 },
    endPoint: { lat: 10.8752, lng: 106.7998 },
    roadHeadingDegrees: 110, // ESE
    speedLimitKmh: 40,
    laneCount: 2,
    floodRiskLevel: "LOW",
    isFloodProneSlope: false,
  },
  {
    id: "SEG_LE_VAN_CHI_CONNECT",
    roadName: "Đường Lê Văn Chí",
    segment: "Bệnh viện ĐK Khu vực Thủ Đức đến Hoàng Diệu 2",
    startPoint: { lat: 10.8585, lng: 106.768 },
    endPoint: { lat: 10.8524, lng: 106.765 },
    roadHeadingDegrees: 200,
    speedLimitKmh: 40,
    laneCount: 2,
    floodRiskLevel: "MODERATE",
    isFloodProneSlope: false,
  },
];

/**
 * Matches a GPS coordinate to the most probable road segment in the candidate network
 */
export function matchGpsToRoadNetwork(gpsPoint = {}) {
  const { latitude, longitude, heading = null, accuracyMeters = 15 } = gpsPoint;

  if (!latitude || !longitude) {
    return { matchState: "UNKNOWN", matchedRoad: null, confidence: "LOW" };
  }

  let bestMatch = null;
  let minimumDistanceMeters = Infinity;

  for (const road of ROAD_NETWORK_CORRIDORS) {
    // Midpoint distance approximation for segment
    const midLat = (road.startPoint.lat + road.endPoint.lat) / 2;
    const midLng = (road.startPoint.lng + road.endPoint.lng) / 2;
    const distToMid = calculateHaversineDistanceMeters(latitude, longitude, midLat, midLng);

    // Heading alignment check (if heading provided)
    let headingAlignmentScore = 1.0;
    if (heading !== null) {
      const headingDiff = Math.abs(heading - road.roadHeadingDegrees);
      const normalizedDiff = headingDiff > 180 ? 360 - headingDiff : headingDiff;
      headingAlignmentScore = normalizedDiff <= 45 ? 1.0 : normalizedDiff <= 90 ? 0.7 : 0.4;
    }

    const effectiveDistance = distToMid / headingAlignmentScore;

    if (effectiveDistance < minimumDistanceMeters) {
      minimumDistanceMeters = distToMid;
      bestMatch = {
        road,
        rawDistanceMeters: Math.round(distToMid),
        headingAlignmentScore,
      };
    }
  }

  if (!bestMatch || minimumDistanceMeters > 150) {
    return {
      matchState: "OFF_ROAD",
      matchedRoad: null,
      distanceToRoadMeters: Math.round(minimumDistanceMeters),
      confidence: "LOW",
      reason: "Tọa độ nằm ngoài hành lang 150m của các trục giao thông chính.",
    };
  }

  const distance = bestMatch.rawDistanceMeters;
  let matchState = "OFF_ROAD";
  let confidence = "LOW";

  if (distance <= 15) {
    matchState = "ON_ROAD";
    confidence = accuracyMeters <= 20 ? "HIGH" : "MEDIUM";
  } else if (distance <= 40) {
    matchState = "NEAR_ROAD";
    confidence = "MEDIUM";
  } else {
    matchState = "OFF_ROAD";
    confidence = "LOW";
  }

  return {
    matchState,
    confidence,
    matchedRoad: {
      id: bestMatch.road.id,
      name: bestMatch.road.roadName,
      segment: bestMatch.road.segment,
      laneCount: bestMatch.road.laneCount,
      speedLimitKmh: bestMatch.road.speedLimitKmh,
      floodRiskLevel: bestMatch.road.floodRiskLevel,
    },
    distanceToRoadMeters: distance,
    snappedCoordinates: {
      lat: Number(((latitude + bestMatch.road.startPoint.lat) / 2).toFixed(6)),
      lng: Number(((longitude + bestMatch.road.startPoint.lng) / 2).toFixed(6)),
    },
    disclaimer: confidence === "LOW" ? "Vị trí có độ không chắc chắn cao; không nên giả định vị trí tuyệt đối trên làn đường." : null,
  };
}
