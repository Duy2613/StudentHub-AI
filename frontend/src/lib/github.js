// frontend/src/lib/github.js
// Tích hợp GitHub Public API để tự động lấy Avatar, Thông tin và Top 3 Dự án nổi bật của Chuyên gia

/**
 * Lấy dữ liệu GitHub của Chuyên gia và tự động tính điểm uy tín
 * @param {string} rawUsername - Username GitHub
 * @returns {Promise<{ avatarUrl: string, bio: string, name: string, topRepos: Array, reputationScore: number, followers: number, publicReposCount: number }>}
 */
export async function fetchGitHubExpertData(rawUsername) {
  if (!rawUsername) {
    throw new Error("Vui lòng nhập tên người dùng (username) GitHub.");
  }

  const username = rawUsername.trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9-]{1,39}$/.test(username)) {
    throw new Error("Tên người dùng GitHub không hợp lệ.");
  }

  try {
    // 1. Gọi GitHub User API
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userRes.ok) {
      if (userRes.status === 404) {
        throw new Error(`Không tìm thấy tài khoản GitHub "${username}".`);
      }
      if (userRes.status === 403) {
        throw new Error("GitHub API tạm thời bị giới hạn tần suất (Rate Limit). Vui lòng thử lại sau.");
      }
      throw new Error(`Không thể kết nối tới GitHub API (Mã lỗi: ${userRes.status}).`);
    }

    const userData = await userRes.json();

    // 2. Gọi GitHub Repositories API để lấy danh sách dự án
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    let topRepos = [];
    let totalStars = 0;

    if (reposRes.ok) {
      const repos = await reposRes.json();
      if (Array.isArray(repos)) {
        // Lọc các repo không phải fork và sắp xếp theo số lượng Stars
        const sortedRepos = repos
          .filter((r) => !r.fork)
          .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));

        // Lấy top 3 repo nổi bật nhất
        topRepos = (sortedRepos.length > 0 ? sortedRepos : repos)
          .slice(0, 3)
          .map((repo) => {
            const stars = repo.stargazers_count || 0;
            totalStars += stars;
            return {
              id: repo.id,
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description || "Dự án mã nguồn mở trên GitHub",
              stars: stars,
              forks: repo.forks_count || 0,
              language: repo.language || "Mã nguồn",
              htmlUrl: repo.html_url,
            };
          });
      }
    }

    // 3. Công thức tính Điểm Uy Tín tự động:
    // Base Chuyên gia (90) + (Số Star * 3) + (Số Followers * 1) + (Số Repos * 0.5)
    // Tối đa 100 điểm uy tín ban đầu
    const followers = userData.followers || 0;
    const publicReposCount = userData.public_repos || 0;
    const calculatedBonus = Math.min(totalStars * 3 + followers + Math.floor(publicReposCount * 0.5), 10);
    const reputationScore = Math.min(90 + calculatedBonus, 100);

    return {
      success: true,
      username: userData.login,
      name: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
      bio: userData.bio || "Chuyên gia phát triển phần mềm và đóng góp mã nguồn mở trên GitHub.",
      followers,
      publicReposCount,
      totalStars,
      topRepos,
      reputationScore,
    };
  } catch (error) {
    console.error("[GitHub API Error]:", error?.name || "github_request_failed");
    throw error;
  }
}
