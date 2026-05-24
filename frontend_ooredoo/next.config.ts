/** @type {import('next').NextConfig} */
const nextConfig = {
  // Directement à la racine de l'objet, pas dans experimental
  devIndicators: {
    appIsrStatus: false,
  },
  // Pour Next.js 15+, la clé est parfois traitée différemment selon Turbopack
  async headers() {
    return [
      {
        source: '/_next/:path*',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
    ];
  },
};

module.exports = nextConfig;