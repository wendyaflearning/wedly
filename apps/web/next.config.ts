import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async redirects() {
    return [
      // /wedream (storytelling teaser) a été retiré au profit de la home —
      // filet de sécurité pour tout lien externe/indexé resté sur l'ancienne URL.
      {
        source: '/wedream',
        destination: '/wedream-vendors',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
