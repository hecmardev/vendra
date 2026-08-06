/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Las fotos se suben por server action; el default de 1MB no alcanza
    // (el tope real por foto son 5MB, validado en services/storage.ts).
    serverActions: { bodySizeLimit: '6mb' }
  },
  images: {
    // Fotos de autos servidas desde Supabase Storage.
    // Reemplazar <project-ref> por el ref real del proyecto Supabase.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**'
      }
    ]
  },
  async redirects () {
    // Rutas movidas hacia /autos. Redirect permanente (preserva ?query) para no
    // perder enlaces antiguos ni valor de SEO.
    //   /catalogo      -> /autos        (listado)
    //   /auto/[slug]   -> /autos/[slug] (ficha)
    return [
      { source: '/catalogo', destination: '/autos', permanent: true },
      { source: '/auto/:slug', destination: '/autos/:slug', permanent: true }
    ]
  }
}

module.exports = nextConfig
