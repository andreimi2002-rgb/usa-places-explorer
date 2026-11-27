import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Resolve metadata before streaming for every client so notFound() yields a real HTTP 404.
  htmlLimitedBots: /.*/,
  images: {
    // Only rights-cleared, credited media hosts are allowed (see docs/DATA_SOURCES.md).
    remotePatterns: [{ protocol: "https", hostname: "upload.wikimedia.org", pathname: "/wikipedia/commons/**" }],
  },
  // `pg` is a server-only dependency and must never reach a client bundle.
  serverExternalPackages: ["pg"],
  // Fixture mode reads the committed seed snapshot at runtime; ship it with every server function
  // (required on Netlify/serverless, where only traced files are deployed).
  outputFileTracingIncludes: { "/**": ["./seed/**/*.json"] },
};

export default nextConfig;
