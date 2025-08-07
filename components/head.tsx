import Head from 'next/head';

export default function HtmlHead() {
  return (
    <Head>
      <title>Weindampfer Schichtplan</title>
      <meta name="description" content="Schichtplan für den Weindampfer" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/favicon.png" />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/icons/favicon-16x16.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/icons/favicon-32x32.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="57x57"
        href="/icons/favicon-57x57.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="60x60"
        href="/icons/favicon-60x60.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="72x72"
        href="/icons/favicon-72x72.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="76x76"
        href="/icons/favicon-76x76.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="96x96"
        href="/icons/favicon-96x96.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="114x114"
        href="/icons/favicon-114x114.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="120x120"
        href="/icons/favicon-120x120.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="144x144"
        href="/icons/favicon-144x144.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="152x152"
        href="/icons/favicon-152x152.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/icons/favicon-180x180.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="192x192"
        href="/icons/favicon-192x192.png"
      />

      <link rel="canonical" href="https://team.derweindampfer.de/" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:image"
        content={encodeURI('https://team.derweindampfer.de/logo-og.jpg')}
      />
      <meta name="twitter:url" content="https://team.derweindampfer.de/" />
      <meta name="twitter:title" content="Weindampfer Schichtplan" />
      <meta
        name="twitter:description"
        content="Schichtplan für den Weindampfer"
      />

      <meta property="og:type" content="website" />
      <meta
        property="og:image"
        content={encodeURI('https://team.derweindampfer.de/logo-og.jpg')}
      />
      <meta property="og:title" content="Weindampfer Schichtplan" />
      <meta
        property="og:description"
        content="Schichtplan für den Weindampfer"
      />
      <meta property="og:site_name" content="Weindampfer Schichtplan" />
      <meta property="og:url" content="https://team.derweindampfer.de/" />
    </Head>
  );
}
