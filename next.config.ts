import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.preview.emergentagent.com",
    "*.preview.emergentcf.cloud",
    "*.cluster-12.preview.emergentcf.cloud",
    "github-connect-112.cluster-12.preview.emergentcf.cloud",
    "c99b0c8e-e046-4f41-8b6f-43602b5c22ac.preview.emergentagent.com",
    "c99b0c8e-e046-4f41-8b6f-43602b5c22ac.cluster-12.preview.emergentcf.cloud",
  ],
};

export default nextConfig;
