import type {NextConfig} from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
    // mion packages are type-checked separately with their own tsconfig;
    // skip re-checking them under Next.js's DOM-flavored lib settings
    typescript: {ignoreBuildErrors: true},
    // Transpile linked mion packages so Turbopack can resolve them
    transpilePackages: ['@mionjs/client', '@mionjs/core'],
    turbopack: {
        resolveAlias: {
            'virtual:mion-aot/caches': './mion-aot-caches-shim.js',
            'virtual:mion-server-pure-fns': './mion-aot-caches-shim.js',
        },
    },
    // In dev, proxy API requests to the standalone mion server (vite-node on port 3001)
    // In production, the catch-all route at app/api/[...mion]/route.ts handles requests
    ...(isDev && {
        rewrites: async () => [{source: '/api/mion/:path*', destination: 'http://localhost:3001/api/mion/:path*'}],
    }),
};

export default nextConfig;
