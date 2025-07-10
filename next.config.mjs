const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ekdjxzhujettocosgzql.supabase.co",
      },
    ],
    domains: [
      "ekdjxzhujettocosgzql.supabase.co",
    ],
  },
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
  },
  webpack: (config) => {
    // config.resolve.alias["/app"] = path.resolve(__dirname, "app")
    return config
  },
}
