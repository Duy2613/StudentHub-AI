import { PUBLIC_API_ID } from "./PublicApiRegistry.js";
import { PublicApiClient } from "./PublicApiClient.js";

function boundedText(value, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function boundedCount(value, fallback = 5) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(10, Math.max(1, parsed)) : fallback;
}

function safeNumber(value, { min = -Infinity, max = Infinity } = {}) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function safeInteger(value, { min, max } = {}) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function normalizeLocation(location, index) {
  const latitude = safeNumber(location?.latitude, { min: -90, max: 90 });
  const longitude = safeNumber(location?.longitude, { min: -180, max: 180 });
  if (latitude === null || longitude === null) return null;

  const name = boundedText(location?.name, 160) || "Unknown place";
  const region = boundedText(location?.admin1, 160);
  const country = boundedText(location?.country, 160);
  const title = [name, region, country].filter(Boolean).join(", ");
  const id = boundedText(location?.id, 80) || `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

  return {
    recordType: "PLACE_CONTEXT",
    sourceId: `open-meteo:place:${id}`,
    title,
    url: "https://open-meteo.com/en/docs/geocoding-api",
    domain: "open-meteo.com",
    publisher: "Open-Meteo Geocoding",
    publishedAt: null,
    sourceType: "ENVIRONMENTAL_CONTEXT",
    authorityTier: "GEOCODING_CONTEXT",
    isPrimary: false,
    isAuthoritative: false,
    content: title,
    metadata: {
      geocodingId: id,
      latitude,
      longitude,
      countryCode: boundedText(location?.country_code, 8) || null,
      timezone: boundedText(location?.timezone, 80) || null,
      population: safeNumber(location?.population, { min: 0 }) || null,
    },
    index,
  };
}

function normalizeWeatherPoint(point, units = {}) {
  if (!point || typeof point !== "object") return null;
  return {
    time: boundedText(point.time, 40) || null,
    temperatureC: safeNumber(point.temperature_2m),
    apparentTemperatureC: safeNumber(point.apparent_temperature),
    relativeHumidityPercent: safeNumber(point.relative_humidity_2m, { min: 0, max: 100 }),
    precipitationMm: safeNumber(point.precipitation, { min: 0 }),
    windSpeedKmh: safeNumber(point.wind_speed_10m, { min: 0 }),
    weatherCode: safeInteger(point.weather_code, { min: 0, max: 99 }),
    units: {
      temperature: boundedText(units.temperature_2m, 30) || null,
      apparentTemperature: boundedText(units.apparent_temperature, 30) || null,
      humidity: boundedText(units.relative_humidity_2m, 30) || null,
      precipitation: boundedText(units.precipitation, 30) || null,
      windSpeed: boundedText(units.wind_speed_10m, 30) || null,
    },
  };
}

function normalizeDaily(data) {
  const daily = data?.daily;
  if (!daily || typeof daily !== "object" || !Array.isArray(daily.time)) return [];
  const days = daily.time.slice(0, 16);
  return days.map((time, index) => ({
    date: boundedText(time, 20) || null,
    temperatureMaxC: safeNumber(daily.temperature_2m_max?.[index]),
    temperatureMinC: safeNumber(daily.temperature_2m_min?.[index]),
    precipitationProbabilityPercent: safeNumber(daily.precipitation_probability_max?.[index], { min: 0, max: 100 }),
    precipitationSumMm: safeNumber(daily.precipitation_sum?.[index], { min: 0 }),
    weatherCode: safeInteger(daily.weather_code?.[index], { min: 0, max: 99 }),
    sunrise: boundedText(daily.sunrise?.[index], 40) || null,
    sunset: boundedText(daily.sunset?.[index], 40) || null,
  }));
}

export class OpenMeteoAdapter {
  constructor({ client = new PublicApiClient() } = {}) {
    this.client = client;
    this.geocodingApiId = PUBLIC_API_ID.OPEN_METEO_GEOCODING;
    this.forecastApiId = PUBLIC_API_ID.OPEN_METEO_FORECAST;
  }

  async geocode({ name = "", countryCode = "", language = "vi", count = 5, signal } = {}) {
    const query = boundedText(name, 160);
    if (query.length < 2) return this._invalid(this.geocodingApiId, "PLACE_QUERY_REQUIRED");

    const safeLanguage = /^[a-z]{2}(?:-[A-Z]{2})?$/.test(String(language || "")) ? String(language) : "vi";
    const response = await this.client.get(this.geocodingApiId, "/v1/search", {
      name: query,
      count: boundedCount(count),
      language: safeLanguage,
      ...(String(countryCode || "").match(/^[A-Za-z]{2}$/) ? { countryCode: String(countryCode).toUpperCase() } : {}),
    }, { signal });

    if (!response.ok) return this._failure(response, { query, locations: [] });
    const locations = (Array.isArray(response.data?.results) ? response.data.results : [])
      .map(normalizeLocation)
      .filter(Boolean);
    return {
      ok: true,
      provider: this.geocodingApiId,
      providerStatus: "AVAILABLE",
      code: response.code,
      query,
      locations,
      total: locations.length,
      provenance: this._provenance(response, "Open-Meteo geocoding là context địa điểm; không phải xác nhận địa chỉ hay danh tính.")
    };
  }

  async forecast({ latitude, longitude, forecastDays = 3, timezone = "auto", signal } = {}) {
    const lat = safeNumber(latitude, { min: -90, max: 90 });
    const lon = safeNumber(longitude, { min: -180, max: 180 });
    const days = safeInteger(forecastDays, { min: 1, max: 16 });
    if (lat === null || lon === null || days === null) return this._invalid(this.forecastApiId, "COORDINATES_INVALID");

    const safeTimezone = boundedText(timezone, 80) || "auto";
    const response = await this.client.get(this.forecastApiId, "/v1/forecast", {
      latitude: lat,
      longitude: lon,
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation",
      daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code,sunrise,sunset",
      forecast_days: days,
      timezone: safeTimezone,
    }, { signal });

    if (!response.ok) return this._failure(response, { latitude: lat, longitude: lon, forecast: null });
    const data = response.data || {};
    const forecast = {
      latitude: safeNumber(data.latitude, { min: -90, max: 90 }) ?? lat,
      longitude: safeNumber(data.longitude, { min: -180, max: 180 }) ?? lon,
      timezone: boundedText(data.timezone, 80) || safeTimezone,
      elevationMeters: safeNumber(data.elevation, { min: -500, max: 10000 }),
      current: normalizeWeatherPoint(data.current, data.current_units),
      daily: normalizeDaily(data),
      units: {
        daily: data.daily_units && typeof data.daily_units === "object" ? {
          temperatureMax: boundedText(data.daily_units.temperature_2m_max, 30) || null,
          temperatureMin: boundedText(data.daily_units.temperature_2m_min, 30) || null,
          precipitationProbability: boundedText(data.daily_units.precipitation_probability_max, 30) || null,
          precipitationSum: boundedText(data.daily_units.precipitation_sum, 30) || null,
        } : {},
      },
    };
    return {
      ok: true,
      provider: this.forecastApiId,
      providerStatus: "AVAILABLE",
      code: response.code,
      location: { latitude: lat, longitude: lon, timezone: forecast.timezone },
      forecast,
      provenance: this._provenance(response, "Open-Meteo là dự báo mô hình; không thay thế cảnh báo khẩn cấp hoặc quan sát hiện trường."),
    };
  }

  async forecastForPlace({ place = "", countryCode = "", language = "vi", forecastDays = 3, timezone = "auto", signal } = {}) {
    const geocoding = await this.geocode({ name: place, countryCode, language, count: 1, signal });
    if (!geocoding.ok) return { ...geocoding, forecast: null, location: null };
    const selected = geocoding.locations[0];
    if (!selected) return {
      ok: false,
      provider: this.forecastApiId,
      providerStatus: "ERROR",
      code: "PLACE_NOT_FOUND",
      location: null,
      forecast: null,
      provenance: { ...geocoding.provenance, sourceState: "PLACE_NOT_FOUND", providerId: this.geocodingApiId },
    };
    const forecast = await this.forecast({
      latitude: selected.metadata.latitude,
      longitude: selected.metadata.longitude,
      forecastDays,
      timezone: timezone === "auto" ? selected.metadata.timezone || "auto" : timezone,
      signal,
    });
    return {
      ...forecast,
      requestedPlace: boundedText(place, 160),
      geocodedPlace: selected,
      provenance: {
        ...forecast.provenance,
        upstreamProviders: [this.geocodingApiId, this.forecastApiId],
        dataNotice: "Kết hợp geocoding và dự báo Open-Meteo; đây chỉ là context môi trường, không phải bằng chứng Trust.",
      },
    };
  }

  _failure(response, data) {
    return {
      ok: false,
      provider: response.apiId,
      providerStatus: response.status,
      code: response.code,
      ...data,
      provenance: this._provenance(response, "Public weather API không xác lập nguồn chính thức cho claim."),
    };
  }

  _invalid(provider, code) {
    return { ok: false, provider, providerStatus: "ERROR", code, locations: [], forecast: null, provenance: { sourceState: "NOT_CALLED", providerId: provider, isAuthoritative: false } };
  }

  _provenance(response, dataNotice) {
    return {
      sourceState: response.ok ? "PUBLIC_API_CONTEXT" : response.status,
      providerId: response.apiId,
      requestedUrl: response.requestedUrl || null,
      fetchedAt: response.fetchedAt || null,
      fromCache: response.fromCache === true,
      isAuthoritative: false,
      dataNotice,
    };
  }
}
