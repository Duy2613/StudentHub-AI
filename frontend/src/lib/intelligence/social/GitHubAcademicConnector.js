/**
 * StudentHub AI — GitHub Academic Connector (Live REST API Fetcher)
 * 
 * Fetches course syllabi, lab materials, and academic updates from institutional GitHub organizations.
 */

import {
  ISourceConnector,
  CONNECTOR_PLATFORM,
  CONNECTOR_CAPABILITY,
  SOURCE_CLASSIFICATION,
  CONNECTOR_HEALTH
} from "./ISourceConnector.js";

export class GitHubAcademicConnector extends ISourceConnector {
  #repoPath;

  constructor(options = {}) {
    super({
      connectorId: options.connectorId || "github_academic_repos",
      platform: CONNECTOR_PLATFORM.GITHUB_ACADEMIC,
      sourceClassification: SOURCE_CLASSIFICATION.COMMUNITY,
      capabilities: [
        CONNECTOR_CAPABILITY.CAN_READ_PUBLIC_CONTENT,
        CONNECTOR_CAPABILITY.CAN_SEARCH,
        CONNECTOR_CAPABILITY.CAN_SYNC,
        CONNECTOR_CAPABILITY.CAN_GET_AUTHOR_METADATA
      ],
      rateLimits: { requestsPerMinute: 60, burstQuota: 10 },
      termsProfile: { allowIndexing: true, requiresAttribution: true },
      ...options
    });

    this.#repoPath = options.repoPath || "fit-hcmute/academic-materials";
  }

  async syncIncremental({ cursor = null, limit = 20 } = {}) {
    const dataMode = process.env.DATA_MODE || (process.env.NODE_ENV === "test" ? "FIXTURE" : "REAL");

    if (dataMode === "REAL") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`https://api.github.com/repos/${this.#repoPath}/commits?per_page=${limit}`, {
          headers: {
            "User-Agent": "StudentHub-Academic-Agent/1.0",
            Accept: "application/vnd.github.v3+json"
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const commits = await res.json();
          this.health = CONNECTOR_HEALTH.HEALTHY;
          const items = (commits || []).map(c => ({
            rawId: `github_commit_${c.sha}`,
            title: `Cập nhật tài liệu: ${c.commit?.message?.split("\n")[0]}`,
            content: c.commit?.message || "",
            author: c.commit?.author?.name || "GitHub Contributor",
            publishedAt: c.commit?.author?.date || new Date().toISOString(),
            url: c.html_url
          }));
          return { items, nextCursor: commits[0]?.sha || null };
        }

        this.health = CONNECTOR_HEALTH.DEGRADED;
        return { items: [], nextCursor: cursor };
      } catch {
        this.health = CONNECTOR_HEALTH.DEGRADED;
        return { items: [], nextCursor: cursor };
      }
    }

    // Fixture mode
    return {
      items: [
        {
          rawId: "github_commit_sample_01",
          title: "Cập nhật bài giảng môn Kiến trúc Phần mềm SOEN3305 tuần 5",
          content: "Thêm slide bài giảng Microservices và Distributed Tracing cho sinh viên K22 và K23.",
          author: "fit-hcmute-lecturer",
          publishedAt: new Date().toISOString(),
          url: "https://github.com/fit-hcmute/academic-materials/commit/sample01"
        }
      ],
      nextCursor: "cursor_gh_01"
    };
  }
}
