/**
 * StudentHub AI — Public API and topic registry.
 *
 * This is a capability catalog, not an authority catalog. Public APIs can
 * provide discovery or context, but they never become a Trust verdict by
 * themselves. The registry deliberately contains no credentials.
 */

export const PUBLIC_API_ID = Object.freeze({
  OPENALEX: "OPENALEX",
  CROSSREF: "CROSSREF",
  OPEN_METEO_GEOCODING: "OPEN_METEO_GEOCODING",
  OPEN_METEO_FORECAST: "OPEN_METEO_FORECAST",
  GDELT_DOC: "GDELT_DOC",
});

export const PUBLIC_API_REGISTRY = Object.freeze([
  Object.freeze({
    id: PUBLIC_API_ID.OPENALEX,
    name: "OpenAlex",
    category: "ACADEMIC_RESEARCH",
    baseUrl: "https://api.openalex.org",
    auth: "NONE",
    role: "RESEARCH_WORK_INSTITUTION_TOPIC_DISCOVERY",
    evidenceClass: "ACADEMIC_METADATA",
    defaultCacheTtlMs: 6 * 60 * 60 * 1000,
    documentationUrl: "https://help.openalex.org/api/",
    disclosure: "Chỉ mục metadata học thuật công khai; không phải bằng chứng chính sách của trường.",
  }),
  Object.freeze({
    id: PUBLIC_API_ID.CROSSREF,
    name: "Crossref REST",
    category: "ACADEMIC_RESEARCH",
    baseUrl: "https://api.crossref.org",
    auth: "NONE_OPTIONAL_MAILTO",
    role: "DOI_PUBLICATION_METADATA_AND_UPDATE_DISCOVERY",
    evidenceClass: "ACADEMIC_METADATA",
    defaultCacheTtlMs: 6 * 60 * 60 * 1000,
    documentationUrl: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/",
    disclosure: "Metadata DOI công khai; abstract/license phải tôn trọng quyền của chủ thể phát hành.",
  }),
  Object.freeze({
    id: PUBLIC_API_ID.OPEN_METEO_GEOCODING,
    name: "Open-Meteo Geocoding",
    category: "LOCATION_CONTEXT",
    baseUrl: "https://geocoding-api.open-meteo.com",
    auth: "NONE",
    role: "PLACE_TO_COORDINATE_CONTEXT",
    evidenceClass: "ENVIRONMENTAL_CONTEXT",
    defaultCacheTtlMs: 24 * 60 * 60 * 1000,
    documentationUrl: "https://open-meteo.com/en/docs/geocoding-api",
    disclosure: "Geocoding context; không phải định vị chính xác hay xác nhận địa chỉ sở hữu.",
  }),
  Object.freeze({
    id: PUBLIC_API_ID.OPEN_METEO_FORECAST,
    name: "Open-Meteo Forecast",
    category: "WEATHER_TRAVEL",
    baseUrl: "https://api.open-meteo.com",
    auth: "NONE_OPTIONAL_COMMERCIAL_KEY",
    role: "CURRENT_AND_SHORT_RANGE_WEATHER_CONTEXT",
    evidenceClass: "ENVIRONMENTAL_CONTEXT",
    defaultCacheTtlMs: 10 * 60 * 1000,
    documentationUrl: "https://open-meteo.com/en/docs",
    disclosure: "Dự báo mô hình thời tiết; không thay thế cảnh báo khẩn cấp hoặc cảm biến hiện trường.",
  }),
  Object.freeze({
    id: PUBLIC_API_ID.GDELT_DOC,
    name: "GDELT DOC 2.0",
    category: "NEWS_DISCOVERY",
    baseUrl: "https://api.gdeltproject.org",
    auth: "NONE",
    role: "SECONDARY_NEWS_AND_SCAM_DISCOVERY",
    evidenceClass: "SECONDARY_DISCOVERY",
    defaultCacheTtlMs: 15 * 60 * 1000,
    documentationUrl: "https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/",
    disclosure: "Discovery tin thứ cấp; không được tự nâng thành nguồn chính thức hoặc đồng thuận độc lập.",
  }),
]);

export const STUDENTHUB_TOPIC_TAXONOMY = Object.freeze([
  Object.freeze({ id: "ADMISSIONS", label: "Tuyển sinh", apiIds: ["OPENALEX", "CROSSREF", "GDELT_DOC"], officialSeed: true }),
  Object.freeze({ id: "SCHOLARSHIPS", label: "Học bổng", apiIds: ["GDELT_DOC"], officialSeed: true }),
  Object.freeze({ id: "TUITION_FINANCIAL_AID", label: "Học phí và hỗ trợ tài chính", apiIds: ["GDELT_DOC"], officialSeed: true }),
  Object.freeze({ id: "ACADEMIC_CALENDAR", label: "Lịch học và thông báo học vụ", apiIds: ["GDELT_DOC"], officialSeed: true }),
  Object.freeze({ id: "COURSES_PREREQUISITES", label: "Môn học và điều kiện tiên quyết", apiIds: ["OPENALEX", "CROSSREF"], officialSeed: true }),
  Object.freeze({ id: "GRADUATION_CREDENTIALS", label: "Tốt nghiệp và chuẩn đầu ra", apiIds: ["OPENALEX", "CROSSREF"], officialSeed: true }),
  Object.freeze({ id: "RESEARCH_TOPICS", label: "Nghiên cứu và chủ đề học thuật", apiIds: ["OPENALEX", "CROSSREF"], officialSeed: false }),
  Object.freeze({ id: "INTERNSHIPS_CAREER", label: "Thực tập và nghề nghiệp", apiIds: ["GDELT_DOC", "OPENALEX"], officialSeed: true }),
  Object.freeze({ id: "HOUSING_CAMPUS_LIFE", label: "Nhà trọ và đời sống campus", apiIds: ["GDELT_DOC", "OPEN_METEO_GEOCODING"], officialSeed: false }),
  Object.freeze({ id: "CAMPUS_SAFETY", label: "An toàn campus", apiIds: ["GDELT_DOC", "OPEN_METEO_GEOCODING", "OPEN_METEO_FORECAST"], officialSeed: true }),
  Object.freeze({ id: "SCAM_PHISHING", label: "Lừa đảo và phishing", apiIds: ["GDELT_DOC"], officialSeed: true }),
  Object.freeze({ id: "WEATHER_TRAVEL", label: "Thời tiết và di chuyển", apiIds: ["OPEN_METEO_GEOCODING", "OPEN_METEO_FORECAST"], officialSeed: false }),
  Object.freeze({ id: "PUBLIC_POLICY_REGULATION", label: "Chính sách và quy định công", apiIds: ["GDELT_DOC"], officialSeed: true }),
]);

/**
 * Public discovery seeds are intentionally not fetched or treated as proof by
 * this registry. They give an independent adapter a bounded official search
 * surface while the MOET directory remains a soft discovery signal.
 */
export const OFFICIAL_DISCOVERY_SOURCES = Object.freeze([
  Object.freeze({
    sourceId: "MOET_VQA_ACCREDITATION_2026",
    title: "Danh sách cơ sở giáo dục được công nhận đạt chuẩn chất lượng",
    publisher: "Cục Quản lý Chất lượng — Bộ Giáo dục và Đào tạo",
    domain: "vqa.moet.gov.vn",
    canonicalUrl: "https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-bao-dam/thong-bao/danh-sach-cac-co-so-giao-duc-chuong-trinh-dao-tao-giao-duc-dai-hoc-va-cao-dang-su-pham-duoc-cong-nhan-dat-tieu-chuan-chat-luong-giao-duc-cap-nhat-den-ngay-31-7-2026-93.html",
    authorityTier: "GOVERNMENT_REGULATOR",
    topics: ["ADMISSIONS", "PUBLIC_POLICY_REGULATION", "GRADUATION_CREDENTIALS"],
  }),
  Object.freeze({
    sourceId: "MOET_KDCLDH_PORTAL",
    title: "Cổng quản lý kiểm định chất lượng giáo dục đại học",
    publisher: "Bộ Giáo dục và Đào tạo",
    domain: "kdcldh.moet.gov.vn",
    canonicalUrl: "https://kdcldh.moet.gov.vn/admin",
    authorityTier: "GOVERNMENT_REGULATOR",
    topics: ["PUBLIC_POLICY_REGULATION", "GRADUATION_CREDENTIALS"],
  }),
]);

/**
 * The model plan points to the existing AI Gateway catalog. It describes role
 * ownership only; it never exposes whether a provider secret is configured.
 */
export const MODEL_CAPABILITY_POLICY = Object.freeze([
  Object.freeze({ capability: "FAST_CLASSIFICATION", primaryModel: "gpt-5-nano", fallbackModels: ["gemini-3.8-flash", "DeterministicPolicyReasoner_v5"] }),
  Object.freeze({ capability: "CLAIM_EXTRACTION", primaryModel: "gpt-5-mini", fallbackModels: ["gemini-3.8-flash", "DeterministicPolicyReasoner_v5"] }),
  Object.freeze({ capability: "DEEP_REASONING", primaryModel: "gpt-5.6-luna", fallbackModels: ["gemini-3.8-flash", "DeterministicPolicyReasoner_v5"] }),
  Object.freeze({ capability: "MULTIMODAL_INSPECTION", primaryModel: "gemini-3.8-flash", fallbackModels: ["gemini-3.6-flash", "Tesseract_local"] }),
  Object.freeze({ capability: "EMBEDDING", primaryModel: null, fallbackModels: ["DeterministicLexicalRetrieval_v1"], status: "NOT_CONFIGURED" }),
]);

export function getPublicApiDefinition(apiId) {
  return PUBLIC_API_REGISTRY.find((entry) => entry.id === apiId) || null;
}

export function getTopicDefinition(topicId) {
  const normalized = String(topicId || "").trim().toUpperCase();
  return STUDENTHUB_TOPIC_TAXONOMY.find((topic) => topic.id === normalized) || null;
}

export function getPublicApiCatalog() {
  return {
    apis: PUBLIC_API_REGISTRY.map(({ id, name, category, auth, role, evidenceClass, defaultCacheTtlMs, documentationUrl, disclosure }) => ({
      id, name, category, auth, role, evidenceClass, defaultCacheTtlMs, documentationUrl, disclosure,
    })),
    topics: STUDENTHUB_TOPIC_TAXONOMY.map((topic) => ({ ...topic })),
    models: MODEL_CAPABILITY_POLICY.map((policy) => ({ ...policy, fallbackModels: [...policy.fallbackModels] })),
    officialDiscovery: OFFICIAL_DISCOVERY_SOURCES.map(({ sourceId, title, publisher, domain, canonicalUrl, authorityTier, topics }) => ({
      sourceId, title, publisher, domain, canonicalUrl, authorityTier, topics: [...topics],
      sourceState: "PUBLIC_DISCOVERY_SEED",
      isAuthoritative: false,
      canAuthorizeTrustVerdict: false,
    })),
    dataNotice: "Public API output is contextual/discovery data. Trust verdicts still require the StudentHub evidence and policy pipeline.",
  };
}

export function findOfficialDiscoverySeeds({ query = "", topic = "" } = {}) {
  const topicDefinition = getTopicDefinition(topic);
  const normalized = String(query || "").toLowerCase().trim();
  const topicNeedle = topicDefinition ? `${topicDefinition.id} ${topicDefinition.label}`.toLowerCase() : String(topic || "").toLowerCase().trim();
  if (!normalized && !topicNeedle) return OFFICIAL_DISCOVERY_SOURCES.map((source) => ({ ...source }));
  return OFFICIAL_DISCOVERY_SOURCES
    .filter((source) => {
      const searchable = `${source.title} ${source.publisher} ${source.domain} ${source.topics.join(" ")}`.toLowerCase();
      const queryMatches = normalized.length >= 2 && (searchable.includes(normalized) || normalized.split(/\s+/).some((word) => word.length >= 4 && searchable.includes(word)));
      const topicMatches = topicNeedle && source.topics.some((item) => topicNeedle.includes(item.toLowerCase()));
      return queryMatches || topicMatches;
    })
    .map((source) => ({ ...source }));
}
