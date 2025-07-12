import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@supabase/supabase-js"],
  },

  // Add image optimization
  images: {
    formats: ["image/webp", "image/avif"],
  },

  // Enable SWC minification
  swcMinify: true,

  reactStrictMode: false, // Disable strict mode to avoid double effects
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": "./src",
    }

    // Provide React globally for all environments
    config.plugins.push(
      new webpack.ProvidePlugin({
        React: "react",
        react: "react",
      })
    )

    return config
  },
  // Disable resource preloading for unused assets
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
