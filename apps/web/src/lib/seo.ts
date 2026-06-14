const DESCRIPTION_MAX_LENGTH = 160;

export function cleanMetaDescription(
  description: string | null | undefined,
  fallback: string
) {
  const cleaned = (description || fallback).replace(/\s+/g, " ").trim();

  if (cleaned.length <= DESCRIPTION_MAX_LENGTH) {
    return cleaned;
  }

  return `${cleaned.slice(0, DESCRIPTION_MAX_LENGTH - 1).trimEnd()}…`;
}

export function jsonLd(schema: unknown) {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSiteJsonLd(site: {
  title: string;
  description: string;
  url: string;
  twitterUrl?: string;
  githubUrl?: string;
  logoUrl?: string;
}) {
  const sameAs = [site.twitterUrl, site.githubUrl].filter(Boolean);

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.title,
      alternateName: ["Marble CMS", "MarbleCMS"],
      url: site.url,
      description: site.description,
      sameAs,
      ...(site.logoUrl && { logo: site.logoUrl }),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.title,
      alternateName: ["Marble CMS", "MarbleCMS"],
      url: site.url,
      description: site.description,
      publisher: {
        "@type": "Organization",
        name: site.title,
      },
    },
  ];
}

export function buildSiteNavigationJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "SiteNavigationElement",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildFaqJsonLd(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtml(faq.answer),
      },
    })),
  };
}

export function buildArticleJsonLd({
  type = "BlogPosting",
  title,
  description,
  url,
  image,
  publishedAt,
  updatedAt,
  authors,
  siteTitle,
  siteUrl,
}: {
  type?: "Article" | "BlogPosting" | "TechArticle";
  title: string;
  description: string;
  url: string;
  image?: string | null;
  publishedAt: Date;
  updatedAt: Date;
  authors: Array<{
    name: string;
    image?: string | null;
  }>;
  siteTitle: string;
  siteUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    headline: title,
    description,
    url,
    datePublished: publishedAt.toISOString(),
    dateModified: updatedAt.toISOString(),
    author: authors.map((author) => ({
      "@type": "Person",
      name: author.name,
      ...(author.image && { image: author.image }),
    })),
    publisher: {
      "@type": "Organization",
      name: siteTitle,
      url: siteUrl,
    },
    ...(image && { image }),
  };
}
