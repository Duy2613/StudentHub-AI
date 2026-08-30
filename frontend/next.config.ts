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
    ];
  },
};

export default nextConfig;
