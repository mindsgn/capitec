import { Helmet } from 'react-helmet-async';

export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://loan-simulator.example.com';

interface Props { title: string; description: string; path?: string; noindex?: boolean; jsonLd?: object | object[] }

export function Seo({ title, description, path = '/', noindex, jsonLd }: Props) {
  const url = `${SITE_URL}${path}`;
  const image = `${SITE_URL}/og-image.png`;
  return (
    <Helmet>
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Loan Simulator" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
