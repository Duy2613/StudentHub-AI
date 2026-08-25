/**
 * Global Standards Registry & International AI Trust Compliance Framework
 * 
 * Ingests and standardizes internationally recognized cyber security,
 * AI safety, digital identity, and journalistic fact-checking frameworks:
 * 
 * 1. MITRE ATT&CK® & D3FEND Framework
 * 2. NIST SP 800-63B / SP 800-53 / NIST AI RMF 1.0
 * 3. IFCN (International Fact-Checking Network) Code of Principles
 * 4. OWASP Top 10 for Large Language Model Applications (2025/2026)
 * 5. ISO/IEC 42001 & ISO/IEC 23894:2023 (Artificial Intelligence Risk Management)
 * 6. Vietnam National Cyber Security Framework (AIS / NCSC & Nghị định 147/2024/NĐ-CP)
 */

export const GLOBAL_SECURITY_STANDARDS = {
  // 1. MITRE ATT&CK Framework
  MITRE_ATTCK: {
    FRAMEWORK: "MITRE ATT&CK® Enterprise & Mobile Matrix",
    TECHNIQUES: {
      T1566_001: {
        id: "T1566.001",
        name: "Phishing: Spearphishing Link",
        description: "Adversaries send targeted links mimicking university or banking portals to collect user credentials.",
        riskLevel: "CRITICAL",
        countermeasures: ["Domain typosquatting screening", "SSRF protection", "Strict brand boundary inspection"],
      },
      T1566_002: {
        id: "T1566.002",
        name: "Phishing: Spearphishing Attachment",
        description: "Adversaries send malicious payloads, polyglot PDFs, or macro-enabled documents masquerading as official scholarships or admission letters.",
        riskLevel: "CRITICAL",
        countermeasures: ["Magic byte binary signature inspection", "Polyglot detection"],
      },
      T1589_001: {
        id: "T1589.001",
        name: "Gather Victim Identity Information: Credentials & OTP",
        description: "Adversaries lure users into inputting one-time passwords (OTP), national IDs, or biometric data.",
        riskLevel: "CRITICAL",
        countermeasures: ["Coercive credential harvesting detection", "Authentication intent analysis"],
      },
      T1656: {
        id: "T1656",
        name: "Impersonation",
        description: "Adversaries impersonate a trusted institutional authority (university board, ministry, bank).",
        riskLevel: "HIGH",
        countermeasures: ["Cross-modal brand-vs-domain alignment", "Authoritative domain registry"],
      },
    },
    D3FEND: {
      D3_UAV: {
        id: "D3-UAV",
        name: "User Authentication Verification",
        description: "Defensive validation of authentication flows preventing credential theft.",
      },
      D3_IRA: {
        id: "D3-IRA",
        name: "Inbound Relationship Analysis",
        description: "Evaluating external claims against primary institutional provenance.",
      },
    },
  },

  // 2. NIST Standards (National Institute of Standards and Technology)
  NIST: {
    AI_RMF_1_0: {
      standard: "NIST AI Risk Management Framework (AI RMF 1.0)",
      pillars: {
        GOVERN: "Establish transparent multi-layer decision matrices and deterministic boundaries.",
        MAP: "Map contextual deception, quantifier distortion, and cross-modal discrepancies.",
        MEASURE: "Quantify truth confidence, risk confidence, and verification completeness.",
        MANAGE: "Enforce zero-LLM fallback resilience and early-exit threat interception.",
      },
    },
    SP_800_63B: {
      standard: "NIST SP 800-63B Digital Identity Guidelines: Authentication and Lifecycle Management",
      level: "AAL2 / AAL3",
      directive: "Mandates phishing-resistant multi-factor authentication; strictly prohibits transmission of OTPs over unencrypted or unverified third-party channels.",
    },
  },

  // 3. IFCN (International Fact-Checking Network)
  IFCN: {
    CODE_OF_PRINCIPLES: [
      {
        principle: 1,
        name: "Nonpartisanship and Fairness",
        detail: "Evaluate factual evidence without ideological, political, or institutional bias.",
      },
      {
        principle: 2,
        name: "Standards and Transparency of Sources",
        detail: "Mandates primary evidence citation; distinguishes between verified sources, unverified claims, and contradictory reports.",
      },
      {
        principle: 3,
        name: "Transparency of Funding & Organization",
        detail: "Institutional authority tiering based on verified public charters and accredited governance.",
      },
      {
        principle: 4,
        name: "Transparency of Methodology",
        detail: "Open 4-layer screening pipeline with measurable latency, calibrated confidence, and traceable evidence graphs.",
      },
      {
        principle: 5,
        name: "Open and Honest Corrections Policy",
        detail: "Temporal updating mechanism recognizing superseding policy amendments over outdated historical documents.",
      },
    ],
  },

  // 4. OWASP Top 10 for LLM Applications (2025/2026)
  OWASP_LLM: {
    LLM01: {
      id: "LLM01:2025",
      name: "Prompt Injection Defense",
      mitigation: "Strict separation of untrusted content data from system instructions; deterministic hard rules constrain LLM outputs.",
    },
    LLM02: {
      id: "LLM02:2025",
      name: "Sensitive Information Disclosure Defense",
      mitigation: "Zero retention of passwords, OTP codes, or personal identification data in audit logs.",
    },
    LLM09: {
      id: "LLM09:2025",
      name: "Overreliance Defense",
      mitigation: "Deterministic policy engine serves as final authority; LLM cannot unilaterally overturn verified security blocks.",
    },
  },

  // 5. ISO/IEC Standards
  ISO: {
    ISO_IEC_42001: "Information technology — Artificial intelligence — Management system (AIMS)",
    ISO_IEC_23894_2023: "Information technology — Artificial intelligence — Guidance on risk management",
    complianceTarget: "Full conformity with Trustworthy AI transparency, explainability, and safety guardrails.",
  },

  // 6. Vietnam National Cyber Security & Information Safety Regulations
  VIETNAM_CYBER_REGULATIONS: {
    NCSC: "National Cyber Security Center of Vietnam (Trung tâm Giám sát An toàn Không gian mạng Quốc gia - KhongGianMang.vn)",
    CHONG_LUA_DAO: "Chống Lừa Đảo Ecosystem (ChongLuaDao.vn)",
    TINGIA_GOV: "Cổng Thông tin tiếp nhận phản ánh và công bố Tin giả (TinGia.gov.vn / Cục Phát thanh truyền hình & Thông tin điện tử)",
    DECREES: [
      "Nghị định 72/2013/NĐ-CP & 147/2024/NĐ-CP về quản lý, cung cấp, sử dụng dịch vụ Internet và thông tin trên mạng",
      "Luật An ninh mạng 2018 (Luật số 24/2018/QH14)",
      "Quyết định 2345/QĐ-NHNN về triển khai các giải pháp an toàn, bảo mật trong thanh toán trực tuyến và thanh toán thẻ ngân hàng",
    ],
  },
};
