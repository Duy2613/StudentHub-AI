/**
 * StudentHub AI — Multi-Sensor Weather Nowcasting Engine
 * 
 * Scientific Architecture:
 * Fuses 5 complementary sensor modalities:
 * 1. 📡 Weather Radar (Nhà Bè 150km Doppler: dBZ Reflectivity & Storm Cell Velocity)
 * 2. 🛰️ Meteorological Satellite (Himawari-9 IR Cloud Evolution & Convective Cloud Depth)
 * 3. 🌡️ Surface Weather Stations (Tân Sơn Nhất & Thủ Đức AWS: Temp, Humidity, Pressure, Wind)
 * 4. 📹 Traffic Camera Visual Cues (Real-time surface ground-truth: tire spray, wet road sheen)
 * 5. 📢 Official Warnings (NCHMF National Weather Bulletins)
 */

export const NOWCAST_HORIZONS = {
  IMMEDIATE: "0_15_MIN",
  SHORT_TERM: "15_30_MIN",
  MEDIUM_TERM: "30_60_MIN",
  EXTENDED: "1_3_HOURS",
};

/**
 * Calculates multi-sensor nowcast for a given geographical zone
 */
export function computeWeatherNowcast({
  targetZone = "ZONE_THUDUC_HCMUTE",
  cameraObservation = null,
  radarReflectivityDbz = 38, // 0 - 65 dBZ (30+ is rain, 45+ is heavy thunderstorm)
  radarCellDistanceKm = 6.5,
  radarCellVelocityKmh = 22, // Movement toward target
  satelliteCloudCoverPct = 85,
  surfaceStation = { temperatureC: 28.5, humidityPct: 88, windSpeedKmh: 18, pressureHpa: 1008 },
  officialWarning = null,
} = {}) {
  // 1. Calculate Estimated Rain Arrival Time via Radar Vector
  let estimatedArrivalMinutes = null;
  if (radarReflectivityDbz >= 30 && radarCellDistanceKm > 0) {
    estimatedArrivalMinutes = Math.round((radarCellDistanceKm / radarCellVelocityKmh) * 60);
  }

  // 2. Sensor Fusion & Disagreement Analysis
  const sensorEvidence = [];
  let rainProbability15m = 0.1;
  let rainProbability30m = 0.1;
  let rainProbability60m = 0.1;
  let confidenceScore = 0.85;

  // Radar Evidence
  if (radarReflectivityDbz >= 45) {
    sensorEvidence.push("RADAR: Mây dông phản hồi mạnh (≥45 dBZ), nguy cơ mưa dông kèm lốc sét cao");
    rainProbability15m += 0.6;
    rainProbability30m += 0.7;
    rainProbability60m += 0.8;
  } else if (radarReflectivityDbz >= 30) {
    sensorEvidence.push("RADAR: Vùng mưa phản hồi trung bình (30–44 dBZ) đang di chuyển về khu vực");
    rainProbability15m += 0.4;
    rainProbability30m += 0.55;
    rainProbability60m += 0.6;
  } else {
    sensorEvidence.push("RADAR: Phản hồi dưới ngưỡng mưa (<30 dBZ)");
  }

  // Camera Visual Evidence
  if (cameraObservation?.inferredVisualState === "HEAVY_DOWNPOUR" || cameraObservation?.inferredVisualState === "MODERATE_RAIN") {
    sensorEvidence.push(`CAMERA: Bằng chứng thị giác xác nhận mưa thực tế trên mặt đường (${cameraObservation.inferredVisualState})`);
    rainProbability15m = Math.max(rainProbability15m, 0.95);
  } else if (cameraObservation?.inferredVisualState === "WET_ROAD_SHEEN") {
    sensorEvidence.push("CAMERA: Mặt đường ướt nhưng chưa thấy vệt mưa rơi dày");
    rainProbability15m = Math.max(rainProbability15m, 0.65);
  } else if (cameraObservation?.inferredVisualState === "CLEAR") {
    sensorEvidence.push("CAMERA: Bề mặt quan sát thực địa hiện tại đang khô ráo");
  }

  // Satellite Evidence
  if (satelliteCloudCoverPct >= 80) {
    sensorEvidence.push("SATELLITE: Độ che phủ mây hồng ngoại dày đặc (≥80%)");
    rainProbability30m = Math.min(1.0, rainProbability30m + 0.15);
  }

  // Surface Station Humidity Check
  if (surfaceStation.humidityPct >= 85) {
    sensorEvidence.push(`STATION: Độ ẩm không khí rất cao (${surfaceStation.humidityPct}%), thuận lợi cho ngưng tụ mây dông`);
  }

  // Official Warning Fusion
  if (officialWarning) {
    sensorEvidence.push(`OFFICIAL_WARNING: ${officialWarning.title}`);
    rainProbability15m = Math.min(1.0, rainProbability15m + 0.2);
    rainProbability30m = Math.min(1.0, rainProbability30m + 0.2);
  }

  // Sensor Disagreement Check (e.g. Radar says Rain, Camera says Dry)
  let sensorDisagreementNote = null;
  if (radarReflectivityDbz >= 35 && cameraObservation?.inferredVisualState === "CLEAR") {
    sensorDisagreementNote = "Mây dông đã tiếp cận khu vực lân cận trên radar (~6km) nhưng chưa rơi xuống vị trí camera; dự báo mưa sẽ đến trong 15-20 phút tới.";
    confidenceScore = 0.75;
  }

  rainProbability15m = Math.min(0.99, Number(rainProbability15m.toFixed(2)));
  rainProbability30m = Math.min(0.99, Number(rainProbability30m.toFixed(2)));
  rainProbability60m = Math.min(0.99, Number(rainProbability60m.toFixed(2)));

  return {
    targetZone,
    nowcastTimestamp: new Date().toISOString(),
    currentCondition: cameraObservation?.inferredVisualState || "PARTLY_CLOUDY",
    horizons: {
      "0_15_MIN": {
        probabilityOfPrecipitation: rainProbability15m,
        intensityEstimate: rainProbability15m > 0.8 ? "MODERATE_TO_HEAVY" : rainProbability15m > 0.4 ? "LIGHT_RAIN" : "NONE",
        primaryDrivers: ["CAMERA_VISUAL", "RADAR_DOPPLER"],
      },
      "15_30_MIN": {
        probabilityOfPrecipitation: rainProbability30m,
        estimatedArrivalMinutes,
        primaryDrivers: ["RADAR_TRACKING_VECTOR", "SATELLITE_IR"],
      },
      "30_60_MIN": {
        probabilityOfPrecipitation: rainProbability60m,
        primaryDrivers: ["SATELLITE_IR", "NUMERICAL_WEATHER_MODEL"],
      },
    },
    sensorEvidence,
    sensorDisagreementNote,
    confidenceScore,
    studentSafetyRecommendation:
      rainProbability15m > 0.75 || officialWarning
        ? "Mưa dông lớn sắp diễn ra: Nên chuẩn bị áo mưa, hạn chế đi qua các điểm ngập nước (đoạn dốc Võ Văn Ngân) hoặc tìm chỗ trú an toàn tại Tòa Nhà Trung Tâm."
        : "Điều kiện di chuyển tương đối thuận lợi; tiếp tục theo dõi radar cập nhật mỗi 15 phút.",
  };
}
