import type { NextConfig } from "next";

// Derive repo name from GitHub Actions env when available; fallback to default
const derivedRepo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const repoName = derivedRepo || "Green-K-Do";
const isGhPages = process.env.NEXT_PUBLIC_GHPAGES === "1";
const isUserOrOrgPage = repoName.endsWith(".github.io");

const nextConfig: NextConfig = {
  // Generate a purely static site in ./out for GH Pages builds only
  output: isGhPages ? "export" : undefined,
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
  // When building for GitHub Pages project site, serve under /<repo>
  basePath: isGhPages && !isUserOrOrgPage ? `/${repoName}` : undefined,
  assetPrefix: isGhPages && !isUserOrOrgPage ? `/${repoName}/` : undefined,
  images: {
    // Disable next/image optimizations for static export compatibility
    unoptimized: true,
  },
};

export default nextConfig;
