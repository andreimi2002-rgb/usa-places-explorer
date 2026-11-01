const SITE_NAME = 'USA Places Explorer';

interface SeoProps {
  /** Page title without the site name. Omit on the homepage. */
  title?: string;
  description: string;
}

/** React 19 hoists <title> and <meta> into <head> automatically. */
export function Seo({ title, description }: SeoProps) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME}: Discover Every Side of America`;
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
    </>
  );
}
