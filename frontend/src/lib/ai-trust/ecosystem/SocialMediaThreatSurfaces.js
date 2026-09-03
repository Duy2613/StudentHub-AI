/**
 * Social Media & Digital Platform Threat Surfaces
 * 
 * Maps out attack patterns and verification indicators across major social platforms:
 * Facebook, Telegram, Zalo, TikTok, Threads, and X (Twitter).
 */

export const SOCIAL_MEDIA_THREAT_PATTERNS = {
  FACEBOOK: {
    platform: "Facebook",
    verificationSignals: {
      blueBadge: "Official verified badge from Meta",
      pageTransparency: "Creation date, previous name changes, admin country locations",
    },
    threatVectors: {
      RECENT_PAGE_CREATION_ANOMALY: {
        id: "FB_ANOMALY_01",
        description: "Fanpage claiming to represent an established university/bank was created within the last 30 days.",
        riskLevel: "CRITICAL",
      },
      PAGE_NAME_HIJACK: {
        id: "FB_ANOMALY_02",
        description: "Page recently renamed from an unrelated commercial entity to a university admission fanpage.",
        riskLevel: "CRITICAL",
      },
      FAKE_ADMIN_SUPPORT_BOT: {
        id: "FB_ANOMALY_03",
        description: "Automated Messenger bots requesting student credentials or OTP under the guise of technical support.",
        riskLevel: "CRITICAL",
      },
    },
  },

  TELEGRAM: {
    platform: "Telegram",
    threatVectors: {
      TASK_COLLABORATOR_SCAM: {
        id: "TG_SCAM_01",
        description: "Automated task bots promising high commissions for completing online affiliate/e-commerce orders upon depositing funds.",
        riskLevel: "CRITICAL",
      },
      FAKE_EXAM_LEAK_CHANNEL: {
        id: "TG_SCAM_02",
        description: "Channels claiming to sell authentic university final exam papers or national high school graduation keys for cryptocurrency/gift cards.",
        riskLevel: "HIGH",
      },
    },
  },

  ZALO: {
    platform: "Zalo",
    threatVectors: {
      RECRUITMENT_DEPOSIT_TRAP: {
        id: "ZALO_SCAM_01",
        description: "Private Zalo groups requiring students to pay a 'file processing fee' or 'work tool deposit' before receiving part-time employment.",
        riskLevel: "HIGH",
      },
    },
  },

  TIKTOK: {
    platform: "TikTok",
    threatVectors: {
      AI_VOICE_CLONE_POLICY: {
        id: "TT_MISINFO_01",
        description: "Sensational viral short videos using AI voice clones of government or university leaders announcing fabricated tuition cuts or emergency holidays.",
        riskLevel: "MEDIUM",
      },
    },
  },
};
