// next.config.js
module.exports = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: "memory",
        cacheUnaffected: true,
      };
      config.optimization.splitChunks.cacheGroups = {};
    }
    return config;
  },
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },
};
