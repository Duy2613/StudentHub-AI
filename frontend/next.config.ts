import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/ai",
        destination: "/trust",
        permanent: false,
      },
      {
        source: "/scam-check",
        destination: "/trust",
        permanent: false,
      },
      {
        source: "/contract-check",
        destination: "/trust",
        permanent: false,
      },
      {
        source: "/intelligence",
        destination: "/trust",
        permanent: false,
      },
      {
        source: "/intelligence/ai-trust",
        destination: "/trust",
        permanent: false,
      },
      {
        source: "/intelligence/community",
        destination: "/community",
        permanent: false,
      },
      {
        source: "/intelligence/evidence",
        destination: "/trust",
        permanent: false,
      },
      {
        source: "/intelligence/experts",
        destination: "/expert",
        permanent: false,
      },
      {
        source: "/intelligence/knowledge",
        destination: "/trust",
        permanent: false,
      },
      {
        source: "/intelligence/trust",
        destination: "/trust",
        permanent: false,
      },
      {
        source: "/academic/profile",
        destination: "/profile",
        permanent: false,
      },
      {
        source: "/credit-scheduler",
        destination: "/academic?view=planner",
        permanent: false,
      },
      {
        source: "/prof-rating",
        destination: "/expert",
        permanent: false,
      },
      {
        source: "/profile/:id",
        destination: "/profile?profileId=:id",
        permanent: false,
      },
      {
        source: "/tuition-radar",
        destination: "/academic",
        permanent: false,
      },
      {
        source: "/marketplace",
        destination: "/community",
        permanent: false,
      },
      {
        source: "/quests",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/forum",
        destination: "/community",
        permanent: false,
      },
      {
        source: "/ultra",
        destination: "/cases",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
