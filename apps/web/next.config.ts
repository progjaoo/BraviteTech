import type { NextConfig } from "next";
const configuredApi = process.env.API_URL?.trim();
if (process.env.VERCEL && !configuredApi) {
  throw new Error("Set API_URL to the deployed Bravite API origin before building this Vercel project.");
}
if (process.env.VERCEL && configuredApi && !configuredApi.startsWith("https://")) {
  throw new Error("API_URL must use HTTPS in Vercel environments.");
}
const api = configuredApi || "http://127.0.0.1:4000";
const config: NextConfig = {
  devIndicators: false,
  output: "standalone",
  images: {
    maximumRedirects: 0,
    remotePatterns: [
      { protocol: "https", hostname: "imagedelivery.net" },
      { protocol: "https", hostname: "media.bravite.com.br", port: "", pathname: "/editorial/**", search: "" },
    ],
  },
  async rewrites() { return [{ source: "/api/:path*", destination: `${api}/api/:path*` }]; },
  async headers() { return [{ source: "/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "X-Frame-Options", value: "DENY" }, { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }] }]; },
};
export default config;
