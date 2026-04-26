import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Firebase Admin out of the client bundle
  serverExternalPackages: ["firebase-admin"],

  images: {
    remotePatterns: [
      // YouTube thumbnails
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },

  // Allow Apify and YouTube API calls from server
  experimental: {
    serverActions: {
      // Increase body size limit for gaze data payloads (default 1MB)
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
