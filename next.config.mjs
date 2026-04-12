/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type checking is done separately via `npx tsc --noEmit`.
    // Skipping here avoids OOM on Vercel's build workers.
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["axios", "socks-proxy-agent"],
  webpack: (config) => {
    // The existing src/ files use NodeNext module resolution with .js extensions
    // in imports (e.g., import from "./redashClient.js"). Webpack needs to resolve
    // these .js imports to .ts source files.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
