const nextConfig = {
  reactStrictMode: true,
  distDir: '.next',
  async redirects() {
    return [
      // Browsers request /favicon.ico; without this it hits legacy [room_id] and can 500.
      { source: '/favicon.ico', destination: '/icon', permanent: false },
    ];
  },
};

export default nextConfig;
