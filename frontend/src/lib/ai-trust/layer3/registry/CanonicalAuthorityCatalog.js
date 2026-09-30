import { SOURCE_AUTHORITY_TIER } from "../types.js";

const PRIMARY = SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE;

function authority(domain, organization, aliases, scope = "general") {
  const profile = scope === "documentation"
    ? { general: 0.92, documentation: 0.99, technical_claim: 0.90, security: 0.88 }
    : scope === "research"
      ? { general: 0.90, research: 0.99, scientific_claim: 0.97, policy: 0.82 }
      : scope === "government"
        ? { general: 0.92, legal: 0.99, policy: 0.99, security_alert: 0.96, public_service: 0.98 }
        : { general: 0.91, research: 0.90, data: 0.96, policy: 0.90, institutional: 0.92 };
  return {
    domain,
    organization,
    aliases,
    tier: PRIMARY,
    authorityProfiles: profile,
    isOfficial: true,
  };
}

// Exact organization and service domains. This catalog is deliberately
// entity-specific: it does not infer authority from .gov, .edu, or other TLDs.
export const CANONICAL_AUTHORITY_CATALOG = Object.freeze([
  authority("chinhphu.vn", "Cổng Thông tin điện tử Chính phủ Việt Nam", ["chính phủ", "chính phủ việt nam", "government of vietnam"], "government"),
  authority("vanban.chinhphu.vn", "Cơ sở dữ liệu văn bản Chính phủ Việt Nam", ["cơ sở dữ liệu văn bản quy phạm pháp luật", "văn bản quy phạm pháp luật chính phủ"], "government"),
  authority("baohiemxahoi.gov.vn", "Bảo hiểm xã hội Việt Nam", ["bảo hiểm xã hội việt nam", "vietnam social security"], "government"),
  authority("vbsp.org.vn", "Ngân hàng Chính sách xã hội Việt Nam", ["ngân hàng chính sách xã hội", "ngân hàng csxh", "vbsp"], "government"),
  authority("ncsc.gov.vn", "Trung tâm Giám sát an toàn không gian mạng quốc gia", ["trung tâm giám sát an toàn không gian mạng quốc gia", "ncsc", "an toàn không gian mạng"], "government"),
  authority("mps.gov.vn", "Cổng Thông tin điện tử Bộ Công an", ["bộ công an", "ministry of public security", "mps vietnam"], "government"),
  authority("congbao.chinhphu.vn", "Công báo nước Cộng hòa Xã hội Chủ nghĩa Việt Nam", ["công báo chính phủ", "công báo nước cộng hòa xã hội chủ nghĩa việt nam"], "government"),
  authority("moh.gov.vn", "Bộ Y tế Việt Nam", ["bộ y tế", "ministry of health vietnam", "moh vietnam"], "government"),
  authority("data.gov.vn", "Cổng dữ liệu quốc gia Việt Nam", ["cổng dữ liệu quốc gia việt nam", "dữ liệu mở quốc gia việt nam", "national open data vietnam"], "government"),
  authority("hanu.vn", "Đại học Hà Nội", ["đại học hà nội", "trường đại học hà nội", "hanoi university"], "education"),
  authority("tlu.edu.vn", "Đại học Thủy lợi", ["đại học thủy lợi", "trường đại học thủy lợi", "thuy loi university"], "education"),
  authority("iuh.edu.vn", "Đại học Công nghiệp Thành phố Hồ Chí Minh", ["đại học công nghiệp tp hcm", "đại học công nghiệp thành phố hồ chí minh", "industrial university of ho chi minh city"], "education"),
  authority("ntu.edu.vn", "Đại học Nha Trang", ["đại học nha trang", "trường đại học nha trang", "nha trang university"], "education"),
  authority("sgu.edu.vn", "Đại học Sài Gòn", ["đại học sài gòn", "trường đại học sài gòn", "saigon university"], "education"),
  authority("ctu.edu.vn", "Đại học Cần Thơ", ["đại học cần thơ", "can tho university"], "education"),
  authority("tdtu.edu.vn", "Đại học Tôn Đức Thắng", ["đại học tôn đức thắng", "ton duc thang university"], "education"),
  authority("vlu.edu.vn", "Đại học Văn Lang", ["đại học văn lang", "van lang university"], "education"),
  authority("ussh.edu.vn", "Đại học Khoa học Xã hội và Nhân văn ĐHQG TP HCM", ["đại học khoa học xã hội và nhân văn", "ussh"], "education"),
  authority("huit.edu.vn", "Đại học Công Thương TP HCM", ["đại học công thương tp hcm", "huit"], "education"),

  authority("pubmed.ncbi.nlm.nih.gov", "PubMed / U.S. National Library of Medicine", ["pubmed", "pubmed ncbi", "national library of medicine"], "research"),
  authority("arxiv.org", "arXiv", ["arxiv", "arxiv preprint"], "research"),
  authority("crossref.org", "Crossref DOI Registry", ["crossref", "crossref doi registry", "doi registry"], "research"),
  authority("openalex.org", "OpenAlex", ["openalex", "openalex api"], "research"),
  authority("nature.com", "Nature Portfolio", ["nature journal", "nature research article", "nature climate research"], "research"),
  authority("ieeexplore.ieee.org", "IEEE Xplore", ["ieee xplore", "ieee peer reviewed paper"], "research"),
  authority("dl.acm.org", "ACM Digital Library", ["acm digital library", "acm dl", "acm research paper"], "research"),
  authority("nih.gov", "U.S. National Institutes of Health", ["national institutes of health", "nih research evidence", "nih"], "research"),
  authority("nist.gov", "U.S. National Institute of Standards and Technology", ["national institute of standards and technology", "nist publication", "nist"], "research"),

  authority("react.dev", "React documentation", ["react", "react documentation", "react official documentation", "react use state hook", "react release notes"], "documentation"),
  authority("nextjs.org", "Next.js documentation", ["next.js", "nextjs", "next.js app router documentation", "next.js release notes"], "documentation"),
  authority("supabase.com", "Supabase documentation", ["supabase", "supabase documentation", "supabase official documentation", "supabase changelog"], "documentation"),
  authority("docs.github.com", "GitHub documentation", ["github documentation", "github official documentation", "github docs", "github creating a pull request"], "documentation"),
  authority("github.blog", "GitHub Blog", ["github blog", "github changelog", "github official changelog", "github product changelog", "github security changelog"], "documentation"),
  authority("docs.python.org", "Python documentation", ["python programming language", "python official documentation", "python docs", "python asyncio", "python asyncio documentation", "python tutorial"], "documentation"),
  authority("nodejs.org", "Node.js documentation", ["node.js", "nodejs", "node.js documentation", "node.js release schedule"], "documentation"),
  authority("postgresql.org", "PostgreSQL documentation", ["postgresql", "postgresql official documentation", "postgresql release support policy"], "documentation"),
  authority("developer.mozilla.org", "MDN Web Docs", ["mdn web docs", "mozilla developer network", "mdn fetch api"], "documentation"),
  authority("typescriptlang.org", "TypeScript documentation", ["typescript handbook", "typescriptlang", "typescript official documentation"], "documentation"),
  authority("playwright.dev", "Playwright documentation", ["playwright documentation", "playwright.dev", "playwright browser projects"], "documentation"),
  authority("kubernetes.io", "Kubernetes documentation", ["kubernetes", "kubernetes official documentation", "kubernetes deployment workloads"], "documentation"),
  authority("kernel.org", "Linux kernel documentation", ["linux kernel", "linux kernel documentation", "kernel memory management"], "documentation"),
  authority("oracle.com", "Oracle Java documentation", ["java programming language", "java programming language official documentation", "java language documentation oracle"], "documentation"),
  authority("swift.org", "Swift programming language", ["swift programming language", "swift language documentation", "swift official documentation"], "documentation"),
  authority("tavily.com", "Tavily", ["tavily api documentation", "tavily official api documentation", "tavily api changes"], "documentation"),

  authority("nasa.gov", "NASA", ["nasa", "national aeronautics and space administration", "nasa official mission", "nasa earth science", "nasa and noaa global warming measurements"], "research"),
  authority("worldbank.org", "World Bank", ["world bank", "world bank vietnam data", "world bank official data", "world bank and united nations vietnam population"], "government"),
  authority("who.int", "World Health Organization", ["world health organization", "who.int", "who fact sheet", "who guidance", "who and cdc"], "government"),
  authority("un.org", "United Nations", ["united nations", "un sustainable development goals", "un official", "world bank and united nations vietnam population"], "government"),
  authority("imf.org", "International Monetary Fund", ["international monetary fund", "imf country data", "imf vietnam"], "government"),
  authority("oecd.org", "OECD", ["oecd", "oecd official education statistics", "oecd indicators"], "government"),
  authority("ourworldindata.org", "Our World in Data", ["our world in data", "ourworldindata", "our world in data life expectancy"], "research"),
  authority("cdc.gov", "U.S. Centers for Disease Control and Prevention", ["centers for disease control", "cdc official guidance", "cdc seasonal influenza", "who and cdc"], "government"),
  authority("noaa.gov", "U.S. National Oceanic and Atmospheric Administration", ["noaa", "national oceanic and atmospheric administration", "noaa climate data"], "government"),
  authority("esa.int", "European Space Agency", ["european space agency", "esa solar system missions"], "government"),
  authority("sec.gov", "U.S. Securities and Exchange Commission", ["securities and exchange commission", "sec company filings", "sec filing"], "government"),
  authority("federalreserve.gov", "U.S. Federal Reserve", ["federal reserve", "federal reserve monetary policy"], "government"),
  authority("europa.eu", "European Commission / European Union", ["european commission", "erasmus student exchange program", "european union official"], "government"),
  authority("unesco.org", "UNESCO", ["unesco", "unesco world heritage convention"], "government"),
  authority("stanford.edu", "Stanford University", ["stanford university", "stanford computer science course catalog"], "education"),
  authority("mit.edu", "Massachusetts Institute of Technology", ["massachusetts institute of technology", "mit", "mit undergraduate admissions", "mit admissions requirements"], "education"),
  authority("cam.ac.uk", "University of Cambridge", ["university of cambridge", "cambridge university", "cambridge university undergraduate admissions", "cambridge uk admissions"], "education"),
  authority("wa.gov", "Washington State Government", ["washington state government", "washington state student aid"], "government"),
  authority("iucnredlist.org", "IUCN Red List", ["iucn red list", "international union for conservation of nature red list"], "research"),
  authority("unicode.org", "Unicode Consortium", ["unicode consortium", "unicode text normalization", "unicode normalization nfc nfkc"], "documentation"),
  authority("w3.org", "World Wide Web Consortium", ["w3c", "web content accessibility guidelines", "wcag 2.2", "w3c specification"], "documentation"),
  authority("ietf.org", "Internet Engineering Task Force", ["internet engineering task force", "ietf", "ietf rfc"], "documentation"),
  authority("rfc-editor.org", "RFC Editor", ["rfc editor", "rfc 7519", "http semantics rfc"], "documentation"),
  authority("unfccc.int", "United Nations Framework Convention on Climate Change", ["unfccc", "paris agreement treaty text", "paris agreement climate treaty"], "government"),
  authority("rmit.edu.vn", "RMIT University Vietnam", ["rmit vietnam", "rmit viet nam", "rmit university vietnam"], "education"),
]);

export const CONTEXTUAL_OFFICIAL_DOMAIN_RULES = Object.freeze([
  { pattern: /\b(?:form\s*10\s*[- ]?k|edgar|sec\s+filing)\b/i, domains: ["sec.gov"] },
  { pattern: /\b(?:vietnamese|vietnam)\b.{0,80}\b(?:legal\s+text|law|decree|government\s+gazette)\b/i, domains: ["vanban.chinhphu.vn", "congbao.chinhphu.vn"] },
  { pattern: /(?:bảo hiểm xã hội|bảo hiểm y tế).{0,100}(?:học sinh|sinh viên|mức đóng|quyền lợi)/i, domains: ["baohiemxahoi.gov.vn"] },
  { pattern: /\b(?:cảnh báo|warning|giả mạo|lừa đảo)\b.{0,80}\b(?:an toàn thông tin|an ninh mạng|cybersecurity)\b/i, domains: ["ncsc.gov.vn", "mps.gov.vn"] },
  { pattern: /\b(?:country|quốc gia)\b.{0,100}\b(?:population|dân số|economic indicators|chỉ số kinh tế)\b/i, domains: ["worldbank.org", "un.org", "imf.org"] },
]);
