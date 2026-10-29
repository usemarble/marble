/**
 * Marble comparison pages, rendered by src/pages/compare.
 *
 * Every claim about another product must link to that vendor's own pricing
 * page or documentation. Re-check a comparison's sources and update its
 * checked date whenever its claims change.
 */

export interface ComparisonSource {
  label: string;
  href: string;
}

export interface ComparisonRow {
  topic: string;
  marble: string;
  competitor: string;
  sources?: ComparisonSource[];
}

export interface Comparison {
  slug: string;
  name: string;
  /** When this comparison's official sources were last checked. */
  checked: string;
  /** One line shown on the /compare hub. */
  summary: string;
  meta: {
    title: string;
    description: string;
  };
  intro: string;
  chooseMarble: string[];
  chooseCompetitor: string[];
  rows: ComparisonRow[];
  workflow: {
    marble: string[];
    competitor: string[];
  };
  migration: {
    title: string;
    steps: string[];
  };
  faqs: Array<{ question: string; answer: string }>;
}

const MARBLE_DOCS = {
  import: "https://docs.marblecms.com/features/import",
  webhooks: "https://docs.marblecms.com/features/webhooks",
};

const GHOST = {
  pricing: { label: "Ghost(Pro) pricing", href: "https://ghost.org/pricing/" },
  headless: {
    label: "Ghost docs: Ghost on the JAMstack",
    href: "https://docs.ghost.org/jamstack/",
  },
  contentApi: {
    label: "Ghost docs: Content API",
    href: "https://docs.ghost.org/content-api/",
  },
  newsletters: {
    label: "Ghost help: Setting up email newsletters",
    href: "https://ghost.org/help/setup-email-newsletters/",
  },
  publishing: {
    label: "Ghost help: Publishing and scheduling",
    href: "https://ghost.org/help/publishing-content/",
  },
  customFields: {
    label: "Ghost: Contentful vs Ghost",
    href: "https://ghost.org/vs/contentful/",
  },
  exports: {
    label: "Ghost help: Exporting content and data",
    href: "https://ghost.org/help/exports/",
  },
  install: {
    label: "Ghost docs: How to install Ghost",
    href: "https://docs.ghost.org/install/",
  },
  github: {
    label: "Ghost on GitHub",
    href: "https://github.com/TryGhost/Ghost",
  },
};

const SANITY = {
  pricing: { label: "Sanity pricing", href: "https://www.sanity.io/pricing" },
  studio: {
    label: "Sanity docs: Studio",
    href: "https://www.sanity.io/docs/studio",
  },
  schemas: {
    label: "Sanity docs: Schema types",
    href: "https://www.sanity.io/docs/studio/schema-types",
  },
  portableText: {
    label: "Sanity docs: Portable Text",
    href: "https://www.sanity.io/docs/developer-guides/presenting-block-text",
  },
  groq: {
    label: "Sanity docs: How GROQ queries work",
    href: "https://www.sanity.io/docs/content-lake/how-queries-work",
  },
  exporting: {
    label: "Sanity docs: Export a dataset",
    href: "https://www.sanity.io/docs/content-lake/exporting-data",
  },
  github: {
    label: "Sanity on GitHub",
    href: "https://github.com/sanity-io/sanity",
  },
};

const PAYLOAD = {
  getStarted: {
    label: "Payload: Get started, hosting, and pricing",
    href: "https://payloadcms.com/get-started",
  },
  installation: {
    label: "Payload docs: Installation",
    href: "https://payloadcms.com/docs/getting-started/installation",
  },
  collections: {
    label: "Payload docs: Collections",
    href: "https://payloadcms.com/docs/configuration/collections",
  },
  richText: {
    label: "Payload docs: Rich text editor",
    href: "https://payloadcms.com/docs/rich-text/overview",
  },
  converters: {
    label: "Payload docs: Lexical converters",
    href: "https://payloadcms.com/docs/rich-text/converters",
  },
  localApi: {
    label: "Payload docs: Local API",
    href: "https://payloadcms.com/docs/local-api/overview",
  },
  deployment: {
    label: "Payload docs: Production deployment",
    href: "https://payloadcms.com/docs/production/deployment",
  },
  versions: {
    label: "Payload docs: Versions",
    href: "https://payloadcms.com/docs/versions/overview",
  },
  drafts: {
    label: "Payload docs: Drafts and scheduled publishing",
    href: "https://payloadcms.com/docs/versions/drafts",
  },
  jobs: {
    label: "Payload docs: Jobs queue",
    href: "https://payloadcms.com/docs/jobs-queue/overview",
  },
  localization: {
    label: "Payload docs: Localization",
    href: "https://payloadcms.com/docs/configuration/localization",
  },
  accessControl: {
    label: "Payload docs: Access control",
    href: "https://payloadcms.com/docs/access-control/overview",
  },
  hooks: {
    label: "Payload docs: Hooks",
    href: "https://payloadcms.com/docs/hooks/overview",
  },
};

const STRAPI = {
  cmsPricing: {
    label: "Strapi: CMS pricing",
    href: "https://strapi.io/pricing-cms",
  },
  cloudPricing: {
    label: "Strapi: Cloud hosting pricing",
    href: "https://strapi.io/pricing-cloud",
  },
  plans: {
    label: "Strapi docs: Features and plans",
    href: "https://docs.strapi.io/cms/features",
  },
  contentTypes: {
    label: "Strapi docs: Content-type Builder",
    href: "https://docs.strapi.io/cms/features/content-type-builder",
  },
  contentManager: {
    label: "Strapi docs: Content Manager and rich text fields",
    href: "https://docs.strapi.io/cms/features/content-manager",
  },
  blocksRenderer: {
    label: "Strapi: Blocks React renderer",
    href: "https://github.com/strapi/blocks-react-renderer",
  },
  quickStart: {
    label: "Strapi docs: Quick start",
    href: "https://docs.strapi.io/cms/quick-start",
  },
  rest: {
    label: "Strapi docs: REST API",
    href: "https://docs.strapi.io/cms/api/rest",
  },
  populate: {
    label: "Strapi docs: Populate and select",
    href: "https://docs.strapi.io/cms/api/rest/populate-select",
  },
  graphql: {
    label: "Strapi docs: GraphQL API",
    href: "https://docs.strapi.io/cms/api/graphql",
  },
  deployment: {
    label: "Strapi docs: Deployment",
    href: "https://docs.strapi.io/cms/deployment",
  },
  drafts: {
    label: "Strapi docs: Draft & Publish",
    href: "https://docs.strapi.io/cms/features/draft-and-publish",
  },
  history: {
    label: "Strapi docs: Content History",
    href: "https://docs.strapi.io/cms/features/content-history",
  },
  releases: {
    label: "Strapi docs: Releases and scheduled publishing",
    href: "https://docs.strapi.io/cms/features/releases",
  },
  localization: {
    label: "Strapi docs: Internationalization",
    href: "https://docs.strapi.io/cms/features/internationalization",
  },
  rbac: {
    label: "Strapi docs: Admin roles and permissions",
    href: "https://docs.strapi.io/cms/features/rbac",
  },
  webhooks: {
    label: "Strapi docs: Webhooks",
    href: "https://docs.strapi.io/cms/backend-customization/webhooks",
  },
};

const CONTENTFUL = {
  pricing: {
    label: "Contentful pricing",
    href: "https://www.contentful.com/pricing/",
  },
  dataModel: {
    label: "Contentful docs: Data model",
    href: "https://www.contentful.com/developers/docs/concepts/data-model/",
  },
  richText: {
    label: "Contentful docs: Rich Text",
    href: "https://www.contentful.com/developers/docs/concepts/rich-text/",
  },
  apis: {
    label: "Contentful docs: API basics",
    href: "https://www.contentful.com/developers/docs/references/api-basics/",
  },
  contentDelivery: {
    label: "Contentful docs: Content Delivery API",
    href: "https://www.contentful.com/developers/docs/references/content-delivery-api/overview/",
  },
  exporting: {
    label: "Contentful docs: CLI import and export",
    href: "https://www.contentful.com/developers/docs/tutorials/cli/import-and-export/",
  },
  webhooks: {
    label: "Contentful docs: Webhooks",
    href: "https://www.contentful.com/developers/docs/extensibility/webhooks/overview/",
  },
};

const WORDPRESS = {
  overview: {
    label: "WordPress: Features",
    href: "https://wordpress.org/about/features/",
  },
  hosting: {
    label: "WordPress.com: WordPress.com vs WordPress.org",
    href: "https://wordpress.com/support/com-vs-org/",
  },
  posts: {
    label: "WordPress docs: Posts REST API",
    href: "https://developer.wordpress.org/rest-api/reference/posts/",
  },
  blocks: {
    label: "WordPress docs: Block markup",
    href: "https://developer.wordpress.org/block-editor/getting-started/fundamentals/markup-representation-block/",
  },
  contentTypes: {
    label: "WordPress docs: Custom content types and the REST API",
    href: "https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-rest-api-support-for-custom-content-types/",
  },
  customFields: {
    label: "Learn WordPress: Custom fields and the REST API",
    href: "https://learn.wordpress.org/tutorial/wp-rest-api-custom-fields-authentication-and-testing/",
  },
  roles: {
    label: "WordPress docs: Roles and capabilities",
    href: "https://wordpress.org/documentation/article/roles-and-capabilities/",
  },
  revisions: {
    label: "WordPress docs: Revisions",
    href: "https://wordpress.org/documentation/article/revisions/",
  },
  postSettings: {
    label: "WordPress docs: Post settings",
    href: "https://wordpress.org/documentation/article/page-post-settings-sidebar/",
  },
  cron: {
    label: "WordPress docs: WP-Cron",
    href: "https://developer.wordpress.org/plugins/cron/",
  },
  updates: {
    label: "WordPress docs: Updating WordPress",
    href: "https://wordpress.org/documentation/article/updating-wordpress/",
  },
  exports: {
    label: "WordPress docs: Tools Export screen",
    href: "https://wordpress.org/documentation/article/tools-export-screen/",
  },
  pagination: {
    label: "WordPress docs: REST API pagination",
    href: "https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/",
  },
  embedding: {
    label: "WordPress docs: Linking and embedding",
    href: "https://developer.wordpress.org/rest-api/using-the-rest-api/linking-and-embedding/",
  },
};

export const COMPARISONS: Comparison[] = [
  {
    slug: "ghost",
    name: "Ghost",
    checked: "September 2026",
    summary:
      "Ghost bundles a themed website, newsletters, and memberships. Marble delivers posts to a site you build.",
    meta: {
      title: "Marble vs Ghost: A Headless Ghost Alternative",
      description:
        "Compare Marble and Ghost for your blog. Ghost bundles themes, newsletters, and memberships; Marble is a headless CMS for posts on a site you build.",
    },
    intro:
      "Ghost is a complete publishing platform: a website with themes, email newsletters, and paid memberships in one product. Marble is a headless CMS: it handles writing, media, and delivery, and your own frontend renders the posts. Which one fits depends on whether you want Ghost's built-in audience tools or your own site.",
    chooseMarble: [
      "You're building the site yourself in Next.js, Astro, or another framework and want posts delivered through an API.",
      "Your blog should live inside an existing site, for example at example.com/blog next to your product.",
      "You need posts, authors, categories, tags, and custom fields, not newsletters or memberships.",
      "You want to start free and pay $5 or $20 a month per workspace.",
    ],
    chooseCompetitor: [
      "You want a complete publication, including website, themes, and hosting, without building a frontend.",
      "Email newsletters are central. Ghost can send each post to subscribers and run several newsletters.",
      "You plan to sell memberships or paid subscriptions. Ghost connects to Stripe and charges no transaction fee of its own.",
      "You want to schedule posts or self-host MIT-licensed software.",
    ],
    rows: [
      {
        topic: "Built for",
        marble: "Blogs, articles, and changelogs on a site you build.",
        competitor:
          "Independent publications that want a website, newsletter, and memberships in one product.",
      },
      {
        topic: "Website frontend",
        marble:
          "Not included. You render posts with your own components in any framework.",
        competitor:
          "Included, with Handlebars themes. Custom themes need the Publisher plan or higher. Ghost can also run headless.",
        sources: [GHOST.pricing, GHOST.headless],
      },
      {
        topic: "API",
        marble:
          "REST API and TypeScript SDK. Content comes back as sanitized HTML or Markdown.",
        competitor:
          "Read-only Content API on every plan. The Admin API needs Publisher or higher on Ghost(Pro).",
        sources: [GHOST.contentApi, GHOST.pricing],
      },
      {
        topic: "Included API usage",
        marble:
          "5,000 requests a month on Free, 25,000 on Hobby, 50,000 on Pro.",
        competitor:
          "Ghost's docs describe the Content API as fully cacheable and say you can fetch from it as often as you like.",
        sources: [GHOST.contentApi],
      },
      {
        topic: "Email newsletters",
        marble:
          "Not included. A webhook can pass new posts to your email tool.",
        competitor:
          "Built in. Publisher and higher can run several newsletters per site.",
        sources: [GHOST.newsletters, GHOST.pricing],
      },
      {
        topic: "Memberships and paid subscriptions",
        marble: "Not included.",
        competitor:
          "Built in with Stripe on Publisher and higher. Ghost's docs say these features need Ghost's own frontend, not a headless setup.",
        sources: [GHOST.pricing, GHOST.headless],
      },
      {
        topic: "Content model",
        marble:
          "Posts with multiple authors, one category, tags, and typed custom fields.",
        competitor:
          "Posts and pages with tags and authors. Ghost's own Contentful comparison lists custom fields as unsupported.",
        sources: [GHOST.customFields],
      },
      {
        topic: "Scheduled publishing",
        marble: "Not available yet.",
        competitor: "Yes, for posts and newsletters.",
        sources: [GHOST.publishing],
      },
      {
        topic: "Webhooks",
        marble:
          "On every plan (100 events a month on Free), with signed payloads, retries, and a delivery log.",
        competitor: "On Ghost(Pro) Publisher and higher.",
        sources: [GHOST.pricing],
      },
      {
        topic: "Blog at example.com/blog",
        marble:
          "Yes. Your framework serves posts on whatever route you choose.",
        competitor:
          "With Ghost's own frontend, Ghost(Pro) runs on a domain or subdomain. A subdirectory needs your own reverse proxy and a $50/month add-on on the Business plan.",
        sources: [GHOST.pricing],
      },
      {
        topic: "Hosting and license",
        marble: "Hosted by Marble. The source code is AGPL-3.0.",
        competitor:
          "Ghost(Pro) managed hosting, or self-host the MIT-licensed software.",
        sources: [GHOST.install, GHOST.github],
      },
      {
        topic: "Team members",
        marble: "1 on Free, 5 on Hobby, 10 on Pro.",
        competitor:
          "1 staff user on Starter, 3 on Publisher, 15 on Business. Contributors are free.",
        sources: [GHOST.pricing],
      },
      {
        topic: "Starting price",
        marble: "Free. Hobby is $5/month and Pro is $20/month.",
        competitor:
          "Ghost(Pro) Starter from $18/month and Publisher from $29/month, billed yearly.",
        sources: [GHOST.pricing],
      },
    ],
    workflow: {
      competitor: [
        "Write a post in Ghost's editor.",
        "Publish it. Ghost renders the post with your theme on your Ghost site.",
        "Optionally send it as an email newsletter to your members.",
        "Ghost handles signups, paid tiers, and gated content.",
      ],
      marble: [
        "Write a post in Marble's editor.",
        "Publish it. The post becomes available through the API.",
        "Your site fetches it with the SDK and renders it with your components.",
        "A webhook revalidates or rebuilds the page, or notifies other tools.",
      ],
    },
    migration: {
      title: "Moving from Ghost to Marble",
      steps: [
        `Export your content from Ghost as JSON under Settings → Advanced → Import/Export (<a href="${GHOST.exports.href}" target="_blank" rel="noopener">Ghost help</a>).`,
        `Marble imports Markdown and MDX files, not Ghost's JSON. Convert each post to a .md file, then upload files one at a time or as a ZIP of up to 100. Posts arrive as drafts for review (<a href="${MARBLE_DOCS.import}" target="_blank" rel="noopener">import docs</a>).`,
        "Images in exported posts still point to your Ghost site. Upload them to Marble's media library before you shut Ghost down.",
        "Members, paid subscriptions, and newsletter lists have no equivalent in Marble. Move them to your email or membership tool.",
        "Keep your post slugs, or add redirects in your frontend so existing links keep working.",
      ],
    },
    faqs: [
      {
        question: "Is Marble a good Ghost alternative?",
        answer:
          "It depends on what you use Ghost for. If you mainly publish articles on a site you build, Marble covers writing, media, and API delivery. If you rely on Ghost's newsletters, memberships, or themes, Marble doesn't replace them.",
      },
      {
        question: "Can Marble send email newsletters?",
        answer: `No. Marble doesn't send email. You can subscribe a <a href="${MARBLE_DOCS.webhooks}" target="_blank" rel="noopener">webhook</a> to post events and pass new posts to an email service.`,
      },
      {
        question: "Can I use Ghost as a headless CMS instead?",
        answer: `Yes. Ghost has a Content API and guides for Next.js and other frameworks. <a href="${GHOST.headless.href}" target="_blank" rel="noopener">Ghost's docs</a> note that memberships, paid subscriptions, and comments need Ghost's own frontend, and that features like tag archives and sitemaps must be rebuilt in a custom frontend.`,
      },
      {
        question: "Is Marble open source like Ghost?",
        answer:
          "Yes. Marble's source code is on <a href='https://github.com/usemarble/marble' target='_blank' rel='noopener'>GitHub</a> under the AGPL-3.0 license, while Ghost uses the MIT license. Marble is offered as a hosted service; Ghost can run on Ghost(Pro) or your own server.",
      },
      {
        question: "Which is cheaper, Marble or Ghost?",
        answer:
          "Marble has a free plan, and its paid plans cost $5 or $20 a month per workspace. Ghost(Pro) starts at $18 a month billed yearly, and that price includes hosting for your website and newsletter. Self-hosting Ghost costs whatever your server does.",
      },
    ],
  },
  {
    slug: "sanity",
    name: "Sanity",
    checked: "September 2026",
    summary:
      "Sanity models any content in code with a configurable Studio. Marble is a ready-made CMS for posts.",
    meta: {
      title: "Marble vs Sanity: Which Headless CMS Fits Your Blog?",
      description:
        "Compare Marble and Sanity. Sanity is a structured content platform with a configurable Studio; Marble is a focused headless CMS for posts and articles.",
    },
    intro:
      "Sanity is a structured content platform. You define content types in code, customize the editing Studio, and query everything with GROQ. Marble is a headless CMS built around posts, with an editor that works as soon as you sign up. The choice usually comes down to how much content modeling your project needs.",
    chooseMarble: [
      "Your content is mostly articles, blog posts, and changelogs.",
      "Writers should get a ready editor on signup, with no schema or Studio to configure and deploy.",
      "You'd rather render HTML or Markdown than serialize Portable Text.",
      "You want pricing per workspace rather than per seat.",
    ],
    chooseCompetitor: [
      "You need custom content types such as landing pages, products, or localized content, modeled in code.",
      "Several editors work on the same document at once. Sanity includes real-time editing and presence on every plan.",
      "You want visual editing, live previews, comments, tasks, or scheduled drafts.",
      "Your project needs high API volumes, GROQ or GraphQL queries, or a React editing app you can customize.",
    ],
    rows: [
      {
        topic: "Built for",
        marble: "Blog posts, articles, and changelogs.",
        competitor:
          "Structured content for websites, apps, and commerce, modeled however you need.",
      },
      {
        topic: "Content model",
        marble:
          "A fixed post model with authors, one category, and tags, plus custom fields you add in the dashboard.",
        competitor:
          "Schemas you define in JavaScript or TypeScript, with unlimited content types.",
        sources: [SANITY.schemas, SANITY.pricing],
      },
      {
        topic: "Editing interface",
        marble: "A hosted editor that's ready as soon as you sign up.",
        competitor:
          "Sanity Studio, an open-source React app you configure. Sanity offers free Studio hosting.",
        sources: [SANITY.studio, SANITY.pricing],
      },
      {
        topic: "Rich text in the API",
        marble: "Sanitized HTML by default, or Markdown.",
        competitor:
          "Portable Text, a JSON format you serialize with Sanity's tools for React, Astro, and others.",
        sources: [SANITY.portableText],
      },
      {
        topic: "Querying",
        marble:
          "REST endpoints with filters for category, tag, featured, and search, plus a TypeScript SDK.",
        competitor: "GROQ and GraphQL.",
        sources: [SANITY.groq, SANITY.pricing],
      },
      {
        topic: "Included API usage",
        marble:
          "5,000 requests a month on Free, 25,000 on Hobby, 50,000 on Pro.",
        competitor:
          "1M API CDN requests and 250k API requests a month on Free and Growth, with pay-as-you-go overage on Growth.",
        sources: [SANITY.pricing],
      },
      {
        topic: "Content and media limits",
        marble:
          "Unlimited posts. 1 GB of media on Free, 5 GB on Hobby, 10 GB on Pro.",
        competitor:
          "10k documents on Free and 25k on Growth. 100 GB of assets on both.",
        sources: [SANITY.pricing],
      },
      {
        topic: "Collaboration",
        marble:
          "Owner, Admin, and Member roles. 1 team member on Free, 5 on Hobby, 10 on Pro.",
        competitor:
          "Real-time editing and presence on every plan. Comments and tasks on Growth. 20 seats on Free, up to 50 on Growth.",
        sources: [SANITY.pricing],
      },
      {
        topic: "Drafts and previews",
        marble:
          "Fetch drafts with a private key that has the drafts scope. Share draft links on Hobby and Pro.",
        competitor: "Live preview and visual editing on every plan.",
        sources: [SANITY.pricing],
      },
      {
        topic: "Scheduling",
        marble: "Not available yet.",
        competitor:
          "Scheduled drafts on Growth. Content releases on Enterprise.",
        sources: [SANITY.pricing],
      },
      {
        topic: "Webhooks",
        marble: "On every plan, with 100 events a month on Free.",
        competitor: "GROQ-powered webhooks: 2 on Free, 4 on Growth.",
        sources: [SANITY.pricing],
      },
      {
        topic: "Source code",
        marble: "The whole app is open source under AGPL-3.0; Marble hosts it.",
        competitor:
          "Sanity Studio is MIT-licensed. Content is stored in Sanity's hosted Content Lake.",
        sources: [SANITY.github, SANITY.pricing],
      },
      {
        topic: "Pricing",
        marble: "Free. Hobby is $5/month and Pro is $20/month, per workspace.",
        competitor:
          "Free. Growth is $15 per seat per month. Enterprise is custom.",
        sources: [SANITY.pricing],
      },
    ],
    workflow: {
      competitor: [
        "Create a Studio with the Sanity CLI, starting from a template or a blank schema.",
        "Define or adjust a post schema in code, then deploy the Studio.",
        "Write the post in Studio, with others editing alongside you in real time.",
        "Query it with GROQ and render its Portable Text body with a serializer.",
      ],
      marble: [
        "Create a workspace. The editor is ready without any setup.",
        "Write the post and set its authors, category, and tags.",
        "Fetch it with the SDK or REST API using an API key.",
        "Render the HTML body with your own components and styles.",
      ],
    },
    migration: {
      title: "Moving from Sanity to Marble",
      steps: [
        `Export your dataset with the Sanity CLI. You get a gzipped archive of documents and asset files (<a href="${SANITY.exporting.href}" target="_blank" rel="noopener">Sanity docs</a>).`,
        `Convert post documents to Markdown. Portable Text needs a serializer; Sanity lists the maintained options in its <a href="${SANITY.portableText.href}" target="_blank" rel="noopener">Portable Text docs</a>.`,
        `Upload the .md files, one at a time or as a ZIP of up to 100. Marble creates a draft for each (<a href="${MARBLE_DOCS.import}" target="_blank" rel="noopener">import docs</a>).`,
        "Upload images to Marble's media library and update references in your posts.",
        "Content types other than posts don't map to Marble. Keep them where they are, or store simple metadata in custom fields.",
      ],
    },
    faqs: [
      {
        question: "Is Marble a Sanity alternative?",
        answer:
          "For blogs and article publishing, yes. Marble gives you an editor, media library, and API without defining schemas. For projects that need many custom content types, Sanity's flexibility fits better.",
      },
      {
        question: "Can I create custom content types in Marble?",
        answer:
          "Not arbitrary document types. Every entry is a post with authors, a category, and tags. Custom fields add typed metadata to posts: text, number, boolean, date, rich text, select, and multi-select.",
      },
      {
        question: "Does Marble support GROQ or GraphQL?",
        answer:
          "No. Marble has a REST API with query parameters for filtering and pagination, a TypeScript SDK, and an MCP server for AI agents.",
      },
      {
        question: "Can several people edit the same post at once?",
        answer:
          "Not in real time. Marble workspaces support several team members with roles, but it doesn't have Sanity's multiplayer editing, comments, or tasks.",
      },
      {
        question: "Which costs less, Marble or Sanity?",
        answer:
          "It depends on your team size and traffic. Marble charges per workspace: $5 a month for up to 5 members or $20 for up to 10. Sanity's Free plan includes 20 seats, and Growth costs $15 per seat per month. Sanity's plans also include far more API requests, which matters if your site calls the API on every page view.",
      },
    ],
  },
  {
    slug: "payload",
    name: "Payload",
    checked: "October 2026",
    summary:
      "Payload gives you a configurable CMS and backend inside Next.js. Marble hosts an editor and API for posts.",
    meta: {
      title: "Marble vs Payload: Which CMS Fits Your Blog?",
      description:
        "Compare Marble and Payload for your blog: setup, editing, content models, hosting, and pricing. See when each headless CMS is the better fit.",
    },
    intro:
      "Payload is an open-source CMS and application backend that runs inside Next.js. You define collections in TypeScript and choose how to deploy the app and database. Marble is a hosted headless CMS built around posts, with an editor and API ready on signup. Both can power a blog; the choice depends on how much of the content system you want to build and control.",
    chooseMarble: [
      "Your content is mostly blog posts, articles, and changelogs on a site you build.",
      "Writers need a ready editor, with authors, categories, and tags already set up.",
      "You want Marble to host the CMS and media while you manage your frontend.",
      "You want HTML or Markdown from an API, with workspace plans at $0, $5, or $20 a month.",
    ],
    chooseCompetitor: [
      "You need collections for products, pages, or other content alongside your blog.",
      "You want the CMS inside your Next.js app, with direct database access through Payload's Local API.",
      "Your project needs configurable access rules, localized fields, version history, or scheduled publishing.",
      "You want to customize the editor and own the deployment, database, and application code.",
    ],
    rows: [
      {
        topic: "Built for",
        marble: "Blog posts, articles, and changelogs on a site you build.",
        competitor:
          "A configurable CMS and backend for websites and applications. Its website template includes a frontend and layout builder.",
        sources: [PAYLOAD.getStarted, PAYLOAD.collections],
      },
      {
        topic: "Content model",
        marble:
          "Posts with authors, one category, tags, and typed custom fields you add in the dashboard.",
        competitor:
          "Collections and fields defined in TypeScript. You can model posts, pages, products, and relationships between them.",
        sources: [PAYLOAD.collections],
      },
      {
        topic: "Getting started",
        marble:
          "Create a workspace and start writing. Connect your site with an API key.",
        competitor:
          "Start from a template or add Payload to a Next.js app. Configure your collections, database adapter, and deployment.",
        sources: [PAYLOAD.installation, PAYLOAD.getStarted],
      },
      {
        topic: "Editing and rich text",
        marble:
          "A hosted rich text editor. The API returns sanitized HTML by default, or Markdown.",
        competitor:
          "A customizable Lexical editor that stores rich text as JSON. Payload provides converters for JSX, HTML, and Markdown.",
        sources: [PAYLOAD.richText, PAYLOAD.converters],
      },
      {
        topic: "Content delivery",
        marble:
          "REST API with filtering and pagination, plus a TypeScript SDK.",
        competitor:
          "REST and GraphQL APIs, plus a Local API for querying your database directly from server code.",
        sources: [PAYLOAD.localApi],
      },
      {
        topic: "Frameworks",
        marble:
          "The hosted API works with Next.js, Astro, or any frontend that can make HTTP requests.",
        competitor:
          "The CMS runs in Next.js. Other frontends can fetch content through its REST or GraphQL API.",
        sources: [PAYLOAD.installation, PAYLOAD.localApi],
      },
      {
        topic: "Hosting and maintenance",
        marble:
          "Marble hosts the CMS and media library. You host and maintain your own website.",
        competitor:
          "Deploy wherever Next.js runs. Your project needs a database and persistent file storage; you manage those services and app updates.",
        sources: [PAYLOAD.deployment],
      },
      {
        topic: "API usage",
        marble:
          "5,000 requests a month on Free, 25,000 on Hobby, 50,000 on Pro.",
        competitor:
          "Requests run on your deployment. Capacity and costs depend on your app, database, and hosting provider.",
        sources: [PAYLOAD.deployment, PAYLOAD.localApi],
      },
      {
        topic: "Drafts and version history",
        marble:
          "Draft and published posts. Read drafts with a scoped private API key; share draft links on Hobby and Pro.",
        competitor:
          "Enable drafts, autosave, and version history per collection. Editors can compare versions and restore earlier content.",
        sources: [PAYLOAD.versions, PAYLOAD.drafts],
      },
      {
        topic: "Scheduled publishing",
        marble: "Not available yet.",
        competitor:
          "Supported when configured. Enable scheduled publish or unpublish actions and arrange for the jobs queue to run.",
        sources: [PAYLOAD.drafts, PAYLOAD.jobs],
      },
      {
        topic: "Localization",
        marble:
          "No built-in locale workflow. You can organize translated posts and metadata yourself.",
        competitor:
          "Built-in field localization, configured with your project's locales.",
        sources: [PAYLOAD.localization],
      },
      {
        topic: "Team permissions",
        marble:
          "Owner, Admin, and Member roles. 1 team member on Free, 5 on Hobby, 10 on Pro.",
        competitor:
          "Access rules in code for collections, globals, and fields. Permissions can depend on roles, document data, and the operation.",
        sources: [PAYLOAD.accessControl],
      },
      {
        topic: "Publishing integrations",
        marble:
          "Configure webhooks in the dashboard, with signed payloads, retries, and delivery logs.",
        competitor:
          "Use lifecycle hooks to call other services or revalidate pages. Queue background work with Payload's jobs system.",
        sources: [PAYLOAD.hooks, PAYLOAD.jobs],
      },
      {
        topic: "License and pricing",
        marble:
          "AGPL-3.0 source code. Hosted Free plan; Hobby is $5/month and Pro is $20/month per workspace.",
        competitor:
          "MIT-licensed core with no software license fee. Budget for hosting, a database, and storage. Enterprise support and features are available through sales.",
        sources: [PAYLOAD.getStarted, PAYLOAD.deployment],
      },
    ],
    workflow: {
      competitor: [
        "Start with Payload's website template, or add it to your Next.js app and define a posts collection.",
        "Connect a database, set access rules, and deploy the app with persistent media storage.",
        "Write in the Admin Panel and publish, with drafts and versions enabled if you need them.",
        "Fetch posts with the Local API or HTTP APIs, render the rich text, and configure hooks for publishing updates.",
      ],
      marble: [
        "Create a workspace. The editor, media library, and post model are ready.",
        "Write a post and set its authors, category, tags, and metadata.",
        "Publish, then fetch the post through the SDK or REST API and render its HTML or Markdown.",
        "Configure a webhook to revalidate or rebuild your frontend when posts change.",
      ],
    },
    migration: {
      title: "Moving blog posts from Payload to Marble",
      steps: [
        `Read the posts you want to move through Payload's <a href="${PAYLOAD.localApi.href}" target="_blank" rel="noopener">Local API</a> or REST API. The export shape depends on your collections and fields.`,
        `Convert each post to Markdown. For Lexical bodies, use Payload's <a href="${PAYLOAD.converters.href}" target="_blank" rel="noopener">converters</a> and check how custom blocks and relationships are represented.`,
        `Set title, slug, and description in each file's frontmatter. Upload the .md files individually or as a ZIP of up to 100; Marble creates drafts for review (<a href="${MARBLE_DOCS.import}" target="_blank" rel="noopener">import docs</a>).`,
        "Review the drafts and restore publication dates, author assignments, categories, tags, and custom fields before publishing. The file importer doesn't automatically map all of that metadata.",
        "Upload media to Marble and replace old image URLs before retiring your Payload deployment. Preserve post slugs or add redirects in your frontend.",
        "Marble doesn't replace arbitrary collections, user authentication, or custom backend logic. Keep those parts of your application running, and move only the publishing content that fits Marble's post model.",
      ],
    },
    faqs: [
      {
        question: "Is Marble a good Payload alternative for a blog?",
        answer:
          "Yes, if you want a hosted editor and API for articles, blog posts, and changelogs. Payload is a better fit when you need custom collections, detailed access rules, localized fields, or a CMS that lives inside your application.",
      },
      {
        question: "Can Payload work with Astro or another frontend?",
        answer: `Yes. Payload runs in Next.js, but other frontends can fetch content through its REST or GraphQL API. Its <a href="${PAYLOAD.localApi.href}" target="_blank" rel="noopener">Local API</a> is for server code running with Payload, rather than a remote browser or separate frontend. Marble's hosted API can also serve any framework.`,
      },
      {
        question: "Is Payload free, and which CMS costs less?",
        answer: `Payload's MIT-licensed core is free. You pay for the infrastructure your deployment uses; enterprise support and features are available through sales (<a href="${PAYLOAD.getStarted.href}" target="_blank" rel="noopener">Payload's current options</a>). Marble has a hosted Free plan, with Hobby at $5/month and Pro at $20/month per workspace. Which costs less depends on traffic, hosting choices, and the work needed to maintain your setup.`,
      },
      {
        question: "Can I customize Marble's content model like Payload's?",
        answer:
          "Marble lets you add typed custom fields to posts, but it doesn't let you define arbitrary collections or replace the editor with your own components. Payload's collections and configurable editor give you more control when your project needs it.",
      },
      {
        question: "Can I migrate an entire Payload application to Marble?",
        answer:
          "No. You can move blog posts that fit Marble's model after converting their content and mapping metadata. Application users, custom collections, access rules, and backend logic need to stay in Payload or move to another backend. Marble has no direct Payload importer.",
      },
    ],
  },
  {
    slug: "strapi",
    name: "Strapi",
    checked: "October 2026",
    summary:
      "Strapi lets you define content types and customize a Node.js backend. Marble hosts an editor and API built around posts.",
    meta: {
      title: "Marble vs Strapi: A Simpler CMS for Your Blog",
      description:
        "Looking for a Strapi alternative for your blog? Compare Marble and Strapi on editing, content models, hosting, pricing, and when each CMS fits.",
    },
    intro:
      "Strapi is an open-source headless CMS with a visual content model builder and a backend you can customize. You can self-host it or use Strapi Cloud. Marble is a hosted headless CMS for blog posts, articles, and changelogs, with authors and taxonomy already set up. Both work with a frontend you build. The choice depends on whether your content fits a post model or needs a CMS you can extend.",
    chooseMarble: [
      "You want to add a blog to an existing site, with posts, authors, categories, and tags already set up.",
      "You want a hosted editor and media library without deploying a CMS application or managing its database.",
      "Your frontend needs post bodies as HTML or Markdown, with no Blocks renderer to configure.",
      "Your content fits posts with typed custom fields, and the hosted $0, $5, or $20 workspace plans fit your usage.",
    ],
    chooseCompetitor: [
      "You need your own collection types, reusable components, dynamic zones, or relations between different kinds of content.",
      "Your team needs localized fields or detailed admin permissions. Both are available in the free Community plan.",
      "You want to self-host the CMS or extend its Node.js backend with custom application logic.",
      "You need content history or scheduled releases and are prepared to use the Growth or Enterprise CMS plan.",
    ],
    rows: [
      {
        topic: "Built for",
        marble: "Blog posts, articles, and changelogs on a site you build.",
        competitor:
          "Websites and applications with content types you define, such as articles, landing pages, and products.",
        sources: [STRAPI.contentTypes],
      },
      {
        topic: "Content model",
        marble:
          "Posts with authors, one category, tags, and typed custom fields you add in the dashboard.",
        competitor:
          "Collection types, single types, reusable components, dynamic zones, and relations. Change the model in development, then deploy it.",
        sources: [STRAPI.contentTypes],
      },
      {
        topic: "Getting started",
        marble:
          "Create a workspace and connect your frontend with an API key. Existing posts can be imported as Markdown files.",
        competitor:
          "Create a project or use a template, configure an article type and API permissions, then deploy. Writers use the Content Manager for routine posts.",
        sources: [
          STRAPI.quickStart,
          STRAPI.contentManager,
          { label: "Marble docs: Markdown import", href: MARBLE_DOCS.import },
        ],
      },
      {
        topic: "Editing and rich text",
        marble:
          "A rich text editor with post bodies delivered as sanitized HTML by default, or Markdown.",
        competitor:
          "Choose Rich Text Blocks or a Markdown field. Blocks need a frontend renderer; Strapi provides an official React renderer. Markdown fields deliver Markdown text.",
        sources: [STRAPI.contentManager, STRAPI.blocksRenderer],
      },
      {
        topic: "Content delivery",
        marble:
          "REST API and TypeScript SDK for Next.js, Astro, or any frontend that can make HTTP requests.",
        competitor:
          "REST endpoints for your content types, with GraphQL through an optional plugin. Configure API access and request related media and entries with populate.",
        sources: [STRAPI.rest, STRAPI.graphql, STRAPI.populate],
      },
      {
        topic: "Hosting and maintenance",
        marble:
          "Marble hosts the CMS and media library. You host and maintain your own frontend.",
        competitor:
          "Strapi Cloud hosts the CMS infrastructure, or you manage the app, database, and media storage yourself. Your team still maintains its content model and custom code.",
        sources: [STRAPI.deployment],
      },
      {
        topic: "API usage",
        marble:
          "5,000 requests a month on Free, 25,000 on Hobby, 50,000 on Pro.",
        competitor:
          "Community has no CMS software quota on API calls. Self-hosted capacity depends on your infrastructure. Strapi Cloud Starter includes 100,000 requests a month.",
        sources: [STRAPI.cmsPricing, STRAPI.cloudPricing, STRAPI.deployment],
      },
      {
        topic: "Drafts and history",
        marble:
          "Draft and published posts. Read drafts with a scoped private API key; share draft links on Hobby and Pro.",
        competitor:
          "Draft & Publish is free and enabled per content type. Content History, with earlier versions you can restore, needs Growth or Enterprise.",
        sources: [STRAPI.drafts, STRAPI.history, STRAPI.plans],
      },
      {
        topic: "Scheduled publishing",
        marble: "Not available yet.",
        competitor:
          "Releases can group and schedule publish or unpublish actions on Growth and Enterprise. Draft & Publish must be enabled on the content type.",
        sources: [STRAPI.releases],
      },
      {
        topic: "Localization",
        marble:
          "No built-in locale workflow. You can organize translated posts and metadata yourself.",
        competitor:
          "Free internationalization with locales and localized content types and fields.",
        sources: [STRAPI.localization, STRAPI.plans],
      },
      {
        topic: "Team permissions",
        marble:
          "Owner, Admin, and Member roles. 1 team member on Free, 5 on Hobby, 10 on Pro.",
        competitor:
          "Free admin role-based access control, with default and custom roles. Configure what each role can read, edit, or publish in the admin panel.",
        sources: [STRAPI.rbac, STRAPI.plans],
      },
      {
        topic: "Publishing integrations",
        marble:
          "Configure webhooks in the dashboard, with signed payloads, retries, and delivery logs.",
        competitor:
          "Configure webhooks for content and media events, including publish and unpublish, to call your services or update your frontend.",
        sources: [STRAPI.webhooks],
      },
      {
        topic: "CMS license and pricing",
        marble:
          "AGPL-3.0 source code. Hosted Free plan; Hobby is $5/month and Pro is $20/month per workspace.",
        competitor:
          "Community is free, with an MIT-licensed core. Growth is $45/month for 3 admin users and adds paid CMS features. Hosting is separate.",
        sources: [STRAPI.cmsPricing, STRAPI.plans],
      },
      {
        topic: "Hosting costs",
        marble:
          "CMS hosting and media storage are included within your plan's limits. Frontend hosting is separate.",
        competitor:
          "Strapi Cloud Starter is $35/project/month on monthly billing. You can instead self-host and pay your infrastructure provider. Frontend hosting is separate.",
        sources: [STRAPI.cloudPricing, STRAPI.deployment],
      },
    ],
    workflow: {
      competitor: [
        "Create a Strapi project and define your article fields, author and category relations, and rich text format in development.",
        "Configure API access and deploy to Strapi Cloud or your own infrastructure. Deploy later changes to the content model too.",
        "Writers create and publish entries in the Content Manager. Enable Draft & Publish if they need drafts alongside live posts.",
        "Fetch posts from your frontend, request related media and entries, render Blocks or Markdown, and configure webhooks for updates.",
      ],
      marble: [
        "Create a workspace. The editor, media library, and post model are ready.",
        "Write a post and set its authors, category, tags, and metadata.",
        "Publish, then fetch the post through the SDK or REST API and render its HTML or Markdown.",
        "Configure a webhook to revalidate or rebuild your frontend when posts change.",
      ],
    },
    migration: {
      title: "Moving blog posts from Strapi to Marble",
      steps: [
        `Fetch your articles through Strapi's <a href="${STRAPI.rest.href}" target="_blank" rel="noopener">REST API</a> with authorized access and pagination. Use <a href="${STRAPI.populate.href}" target="_blank" rel="noopener">populate</a> to include the authors, taxonomy, media, and components you need.`,
        `Reuse a Markdown body, or convert <a href="${STRAPI.contentManager.href}" target="_blank" rel="noopener">Blocks and custom components</a> to Markdown. Check code samples, embeds, links, and image captions after conversion.`,
        `Set title, slug, description, date, category, and tags in each file's frontmatter. Import the .md files individually or as a ZIP of up to 100 files. Marble creates drafts for review (<a href="${MARBLE_DOCS.import}" target="_blank" rel="noopener">import docs</a>).`,
        "Review the imported dates, category, tags, and slugs. The importer assigns an author for the import, so set the correct authors and any custom fields before publishing.",
        "Upload media to Marble and replace URLs that depend on your Strapi deployment. Keep your public post URLs or add redirects in your frontend before retiring the old CMS.",
        "Move only content that fits Marble's post model. Custom content types, application users, backend logic, and permission rules need to stay in Strapi or move to another backend.",
      ],
    },
    faqs: [
      {
        question: "Is Marble a good Strapi alternative for a blog?",
        answer:
          "Yes, if your site needs posts with authors, categories, tags, and custom fields, and you want a hosted editor and API. Strapi is a better fit when your blog shares a CMS with custom content types, localized content, or application logic you need to control.",
      },
      {
        question: "Is Strapi free, and how does its pricing compare?",
        answer: `Strapi Community is free software. You pay for your own infrastructure or a separate Cloud hosting plan. Growth adds paid CMS features and does not include hosting (<a href="${STRAPI.cmsPricing.href}" target="_blank" rel="noopener">CMS pricing</a>, <a href="${STRAPI.cloudPricing.href}" target="_blank" rel="noopener">Cloud pricing</a>). Marble includes CMS hosting on Free, Hobby at $5/month, and Pro at $20/month per workspace. Compare the features, traffic, storage, and maintenance your project needs.`,
      },
      {
        question: "Can I use Strapi with Next.js or Astro?",
        answer: `Yes. Both can fetch Strapi's REST API, or its <a href="${STRAPI.graphql.href}" target="_blank" rel="noopener">GraphQL API</a> after you install the plugin. Your frontend renders the fields you configured. Strapi supports both Blocks and Markdown bodies; Marble delivers post bodies as HTML or Markdown.`,
      },
      {
        question:
          "Does Strapi charge for drafts, localization, or admin roles?",
        answer: `No. Draft & Publish, internationalization, and admin role-based access control are in the free Community plan. Content History and scheduled Releases need Growth or Enterprise. Strapi's <a href="${STRAPI.plans.href}" target="_blank" rel="noopener">feature and plan table</a> separates these capabilities.`,
      },
      {
        question: "Can I import my existing Strapi blog into Marble?",
        answer: `Yes, after you convert the articles to Markdown files and map their metadata to Marble's post model. There is no direct Strapi importer. Marble's <a href="${MARBLE_DOCS.import}" target="_blank" rel="noopener">file importer</a> creates drafts, reads supported frontmatter, and assigns a default author. Review the content, authors, media, and public URLs before switching your frontend. Custom backend code and content types do not transfer.`,
      },
    ],
  },
  {
    slug: "wordpress",
    name: "WordPress",
    checked: "October 2026",
    summary:
      "WordPress combines blogging with themes, plugins, and a website you can extend. Marble hosts a post editor and API for your own frontend.",
    meta: {
      title: "Marble vs WordPress: A Hosted CMS for Your Custom Blog",
      description:
        "Compare Marble and WordPress for your blog. See how editing, headless delivery, hosting, pricing, and migration work, and when WordPress fits better.",
    },
    intro:
      "WordPress is open-source website software with blogging built in. You choose a host, which can include managed services. WordPress.com is a separate managed hosting service with its own plans. This comparison covers the open-source software. Marble hosts an editor and API for posts on a frontend you build. WordPress can serve a themed website or a custom frontend through its REST API. Choose based on whether you need a post service or a broader website system.",
    chooseMarble: [
      "You already have a site in Next.js, Astro, or another framework and want a hosted editor and post API.",
      "Your content fits posts with authors, one category, tags, and typed custom fields.",
      "You want HTML or Markdown for your frontend without maintaining a WordPress installation or choosing a WordPress host.",
      "The hosted Free, $5/month Hobby, or $20/month Pro workspace plan fits your usage, and you host your frontend separately.",
    ],
    chooseCompetitor: [
      "You want a website built with themes, or you depend on WordPress plugins and built-in comments.",
      "Your writers need scheduled publishing, revision restore, or the core Editor, Author, and Contributor permissions.",
      "You need custom post types and taxonomies beyond a blog's post model.",
      "You want control of your WordPress installation, or a managed WordPress host that handles operations for you.",
    ],
    rows: [
      {
        topic: "Built for",
        marble: "Blog posts, articles, and changelogs on a site you build.",
        competitor:
          "Blogs and broader websites, with posts, pages, themes, and plugins. An ordinary blog does not need plugins.",
        sources: [WORDPRESS.overview],
      },
      {
        topic: "Website and frontend",
        marble:
          "You build and host the frontend. Marble is not a theme or site builder.",
        competitor:
          "Use a WordPress theme for the public site, or build a separate frontend that reads the built-in REST API.",
        sources: [WORDPRESS.overview, WORDPRESS.posts],
      },
      {
        topic: "Editor and content output",
        marble:
          "A rich text editor with post bodies delivered as HTML or Markdown.",
        competitor:
          "The block editor stores HTML with block delimiter comments. Dynamic blocks render on the server. REST responses can include rendered HTML.",
        sources: [WORDPRESS.blocks, WORDPRESS.posts],
      },
      {
        topic: "Blog post fields",
        marble:
          "Posts already have authors, one category, tags, a cover image, a slug, and a description.",
        competitor:
          "Posts already have an author, categories, tags, a featured image, a slug, and an excerpt. No custom post type is needed for a blog.",
        sources: [WORDPRESS.postSettings, WORDPRESS.posts],
      },
      {
        topic: "Custom content types",
        marble:
          "A fixed post model with typed custom fields. No arbitrary content types or custom taxonomies.",
        competitor:
          "Register custom post types and taxonomies in code or through plugins. Set show_in_rest to expose them through the REST API.",
        sources: [WORDPRESS.contentTypes],
      },
      {
        topic: "Custom fields",
        marble: "Add typed custom post fields in the dashboard.",
        competitor:
          "Register post meta and expose it through the REST API with show_in_rest. Custom fields do not inherently require a paid plugin.",
        sources: [WORDPRESS.customFields],
      },
      {
        topic: "Headless delivery",
        marble:
          "A hosted REST API and TypeScript SDK. Your frontend renders the returned HTML or Markdown.",
        competitor:
          "Fetch posts at /wp-json/wp/v2/posts and render the returned HTML. Theme styling and plugin behavior may need separate frontend work.",
        sources: [WORDPRESS.posts, WORDPRESS.blocks],
      },
      {
        topic: "CMS hosting",
        marble:
          "CMS hosting and the media library are included within your plan's limits. Frontend hosting is separate.",
        competitor:
          "Choose hosting for the open-source software. Managed WordPress hosts can handle operations. WordPress.com packages hosting in its own service plans.",
        sources: [WORDPRESS.hosting],
      },
      {
        topic: "Maintenance",
        marble:
          "Marble operates the hosted CMS. You maintain your frontend and its integrations.",
        competitor:
          "Plan for updates and backups. WordPress supports background updates, and managed hosts can handle maintenance. Responsibilities depend on your host and installed plugins.",
        sources: [WORDPRESS.updates, WORDPRESS.hosting],
      },
      {
        topic: "Drafts and revisions",
        marble:
          "Draft and published posts, with draft sharing on Hobby and Pro. No built-in revision restore UI.",
        competitor:
          "Core drafts, pending review, and autosaves. Compare revisions and restore earlier content without a paid add-on.",
        sources: [WORDPRESS.postSettings, WORDPRESS.revisions],
      },
      {
        topic: "Scheduled publishing",
        marble: "No built-in scheduled publishing.",
        competitor:
          "Schedule posts in core with a future publication date. Default WP-Cron runs on page loads, so low traffic can delay tasks. A host or system scheduler can address this.",
        sources: [WORDPRESS.postSettings, WORDPRESS.cron],
      },
      {
        topic: "Team permissions",
        marble:
          "Owner, Admin, and Member roles. Plans allow 1 team member on Free, 5 on Hobby, and 10 on Pro.",
        competitor:
          "Core Administrator, Editor, Author, Contributor, and Subscriber roles, with capabilities you can customize through code or plugins.",
        sources: [WORDPRESS.roles],
      },
      {
        topic: "Themes, plugins, and comments",
        marble:
          "No WordPress-style theme or plugin system, built-in comments, or commerce backend. Add those services to your frontend separately.",
        competitor:
          "Themes control the website's presentation, plugins extend its behavior, and comments are built in. Check how any plugin works with a headless frontend.",
        sources: [WORDPRESS.overview, WORDPRESS.posts],
      },
      {
        topic: "Software and pricing",
        marble:
          "Hosted Free plan at $0, Hobby at $5/month, and Pro at $20/month per workspace on monthly billing. Frontend hosting is separate.",
        competitor:
          "Free GPL software. Budget for hosting and any paid themes, plugins, or services you choose. WordPress.com has separate hosting plans.",
        sources: [WORDPRESS.overview, WORDPRESS.hosting],
      },
    ],
    workflow: {
      competitor: [
        "Choose a WordPress host or install WordPress on your infrastructure. Agree who handles updates and backups.",
        "Use a theme for your site, or connect your custom frontend to the built-in REST API. Basic blogging does not require plugins.",
        "Write in the block editor, set the post's author and taxonomy, and publish or schedule it. Use revisions when you need to restore earlier content.",
        "For a themed site, WordPress renders the post. For a custom frontend, fetch the rendered HTML and account for any theme styles or plugin behavior your content needs.",
      ],
      marble: [
        "Create a workspace. The editor, media library, and post model are ready.",
        "Write a post and set its authors, category, tags, and metadata.",
        "Publish, then fetch the post through the SDK or REST API and render its HTML or Markdown.",
        "Configure a webhook to revalidate or rebuild your frontend when posts change.",
      ],
    },
    migration: {
      title: "Moving blog posts from WordPress to Marble",
      steps: [
        `Export your posts with <a href="${WORDPRESS.exports.href}" target="_blank" rel="noopener">Tools > Export</a> as WordPress XML, also called WXR, or fetch them through the REST API. Follow <a href="${WORDPRESS.pagination.href}" target="_blank" rel="noopener">every page of REST results</a>, not just the first response. Marble cannot directly import WXR or raw REST JSON.`,
        `Resolve author, featured media, category, and tag IDs into the values you need. The REST API supports <a href="${WORDPRESS.embedding.href}" target="_blank" rel="noopener">embedded or linked resources</a>. Choose one category per post for Marble, and keep a record of each post's old public URL.`,
        `Convert each post body into a Markdown file. Review <a href="${WORDPRESS.blocks.href}" target="_blank" rel="noopener">block content</a>, shortcodes, and interactive embeds. Replace anything that depends on WordPress or plugin code with content your new frontend can display. Move images or verify their URLs before removing the old media host.`,
        `Add title, slug, description, date, category, and tags as supported frontmatter. In Settings > Data, upload the .md files individually or in ZIP batches. The <a href="${MARBLE_DOCS.import}" target="_blank" rel="noopener">import limits</a> are 4 MB per upload, 100 Markdown files per ZIP, and 20 MB of extracted content.`,
        "Review the imported drafts before publishing. Posts initially use the importing user's author profile, so reassign authors where needed. Set cover images and custom fields manually, and check dates, taxonomy, links, and converted content. The importer does not rehost images automatically.",
        "Keep the old public URLs or add redirects in your frontend. Audit titles, descriptions, canonical URLs, and publication dates after publishing. Matching a slug alone does not preserve a dated or category-based WordPress URL.",
        "Move only posts that fit Marble's model. Themes, plugins, comments, forms, users, roles, and custom content types do not transfer. Keep any needed website or application functionality running elsewhere before retiring WordPress.",
      ],
    },
    faqs: [
      {
        question: "Is Marble a good WordPress alternative for a blog?",
        answer:
          "Yes, if you build your own frontend and want a hosted editor and API for posts. Choose WordPress when you want a themed website, depend on its plugins, or need built-in comments, scheduling, and revision restore. Both already have a blog post model, so neither requires you to design one from scratch.",
      },
      {
        question: "Is WordPress free, and how does its pricing compare?",
        answer: `The open-source WordPress software is free. You pay for hosting and any optional paid plugins, themes, or services. <a href="${WORDPRESS.hosting.href}" target="_blank" rel="noopener">WordPress.com is a separate managed hosting service</a> with its own plans. Marble includes CMS hosting on Free at $0, Hobby at $5/month, and Pro at $20/month per workspace on monthly billing. You still host your frontend. Compare the services and maintenance your project needs, rather than treating a WordPress.com starting price as the cost of every WordPress setup.`,
      },
      {
        question: "Can I use WordPress headlessly with Next.js or Astro?",
        answer: `Yes. WordPress has a <a href="${WORDPRESS.posts.href}" target="_blank" rel="noopener">built-in REST API for posts</a> that custom frontends can fetch. Ordinary post content can arrive as rendered HTML, so a custom block renderer is not required for that HTML. You still need to reproduce any theme styles or plugin behavior your frontend depends on. Marble also supports custom frontends, with HTML or Markdown post bodies.`,
      },
      {
        question: "Do WordPress custom fields require a paid plugin?",
        answer: `No. You can register post meta in code and expose it through the REST API with show_in_rest. The official <a href="${WORDPRESS.customFields.href}" target="_blank" rel="noopener">custom fields tutorial</a> explains this setup. Plugins can provide other field interfaces and workflows. Marble lets you add typed fields to posts in its dashboard, while WordPress also supports custom post types and taxonomies.`,
      },
      {
        question: "Can I import my entire WordPress site into Marble?",
        answer: `No. Marble has no direct WordPress WXR or REST JSON importer. Convert blog posts into Markdown files with supported frontmatter, then use the <a href="${MARBLE_DOCS.import}" target="_blank" rel="noopener">file importer</a> to create drafts. Review authors, covers, custom fields, image URLs, and redirects. Themes, plugins, comments, users, and custom content types need a separate plan.`,
      },
    ],
  },
  {
    slug: "contentful",
    name: "Contentful",
    checked: "October 29, 2026",
    summary:
      "Contentful models structured, localized content with linked entries. Marble provides a ready-made post model and hosted editor for your blog.",
    meta: {
      title: "Marble vs Contentful for blog publishing",
      description:
        "Looking for a Contentful alternative for your blog? Compare Marble's post publishing workflow with Contentful's content model, APIs, and pricing.",
    },
    intro:
      "Contentful is a hosted structured content platform. You configure content types, localize fields, and link entries and assets for delivery through APIs. Marble hosts an editor and API around a ready-made post model with authors, a category, tags, and custom fields. Both work with a frontend you build. Choose based on whether you need a service for blog publishing or a configurable model for several kinds of content.",
    chooseMarble: [
      "Your site needs blog posts, articles, or changelogs with authors and taxonomy already defined.",
      "Writers need a hosted post editor without first designing content types and their relationships.",
      "Your frontend should receive HTML or Markdown post bodies through a REST API or TypeScript SDK.",
      "Your blog fits Marble's usage limits, and you want paid workspace plans at $5 or $20 a month on monthly billing.",
    ],
    chooseCompetitor: [
      "You need configurable content types for products, landing pages, or other content alongside your blog.",
      "You reuse linked entries and assets across pages or embed structured entries inside Rich Text.",
      "You need localized fields and locale settings within the content platform.",
      "You need Contentful's larger free allowance of 100,000 API calls a month and 10 users, or its GraphQL Content API.",
    ],
    rows: [
      {
        topic: "Content model",
        marble:
          "Posts with authors, one category, tags, and typed custom fields. No arbitrary content types to configure.",
        competitor:
          "Content types with fields you define, including text, dates, media, and references to other entries.",
        sources: [CONTENTFUL.dataModel],
      },
      {
        topic: "Hosted editing workflow",
        marble:
          "A hosted editor for posts. Create a workspace, write, and connect your frontend to the API.",
        competitor:
          "A hosted web app for editing entries. Define or adapt your content model, then connect your frontend to its delivery APIs.",
        sources: [CONTENTFUL.dataModel, CONTENTFUL.apis],
      },
      {
        topic: "Body format",
        marble: "HTML by default, or Markdown through the format parameter.",
        competitor:
          "Rich Text returns JSON nodes, with renderers available. A Long Text field can hold Markdown instead, so your body format depends on your model.",
        sources: [CONTENTFUL.richText, CONTENTFUL.dataModel],
      },
      {
        topic: "Content delivery",
        marble:
          "REST endpoints for posts and related resources, plus a TypeScript SDK. Your frontend renders the returned content.",
        competitor:
          "A Content Delivery API for published JSON content, a Preview API for unpublished content, and a GraphQL Content API.",
        sources: [CONTENTFUL.apis, CONTENTFUL.contentDelivery],
      },
      {
        topic: "Included API usage",
        marble:
          "5,000 requests a month on Free, 25,000 on Hobby, and 50,000 on Pro.",
        competitor:
          "100,000 API calls a month on Free and 1 million on Lite. The free allowance is substantially higher than Marble's.",
        sources: [CONTENTFUL.pricing],
      },
      {
        topic: "Relationships and reuse",
        marble:
          "Posts have built-in author, category, and tag relationships. Custom fields extend post metadata.",
        competitor:
          "Reference fields link entries and assets. Rich Text can also embed or link entries and assets within the body.",
        sources: [CONTENTFUL.dataModel, CONTENTFUL.richText],
      },
      {
        topic: "Localization",
        marble:
          "The post model has no built-in localized field variants. Plan translated posts and their URL relationships in your application.",
        competitor:
          "Localized content within a space, with 2 locales on Free and 3 on Lite.",
        sources: [CONTENTFUL.dataModel, CONTENTFUL.pricing],
      },
      {
        topic: "Team access",
        marble: "1 team member on Free, 5 on Hobby, and 10 on Pro.",
        competitor:
          "10 users and 2 roles on Free. Lite includes 20 users and 3 roles, plus live collaboration.",
        sources: [CONTENTFUL.pricing],
      },
      {
        topic: "Webhooks",
        marble:
          "Post and other workspace events can trigger your rebuild or revalidation endpoint, with signed payloads, retries, and delivery logs.",
        competitor:
          "Content changes can trigger HTTP callbacks. Filters can restrict events to an environment, entry, asset, or content type.",
        sources: [CONTENTFUL.webhooks],
      },
      {
        topic: "Pricing",
        marble:
          "Free at $0. Hobby is $5/month and Pro is $20/month per workspace on monthly billing. All include unlimited posts.",
        competitor:
          "Free at $0, Lite at $300/month, and Enterprise at a custom price. Each plan includes a Starter Space.",
        sources: [CONTENTFUL.pricing],
      },
    ],
    workflow: {
      competitor: [
        "Create a Contentful space and define or adapt a blog content type, its fields, and any author or category references.",
        "Choose Rich Text or Long Text for the body, and configure localized fields if your blog needs them.",
        "Write the entry in Contentful's web app and publish the entries and assets your post references.",
        "Fetch published content with a delivery API. Render Rich Text nodes or Markdown and handle any linked content in your frontend.",
        "Configure a webhook if your site needs to rebuild or revalidate after content changes.",
      ],
      marble: [
        "Create a Marble workspace with its post model and hosted editor already available.",
        "Write a post, add its authors, category, tags, and cover image, and publish it.",
        "Create an API key and fetch the post through the REST API or TypeScript SDK.",
        "Render the HTML body, or request Markdown for your frontend's Markdown renderer.",
        "Configure a webhook to rebuild or revalidate your site when posts change.",
      ],
    },
    migration: {
      title: "Moving a Contentful blog to Marble",
      steps: [
        `Export the intended space and environment with <code>contentful space export</code>. Include drafts if you need them, and keep the export as a backup (<a href="${CONTENTFUL.exporting.href}" target="_blank" rel="noopener">Contentful CLI docs</a>).`,
        "Select the entries that represent blog posts and the locale you intend to publish. Record each entry's old public URL and its new slug, including any locale prefixes or category paths.",
        `For Rich Text bodies, resolve linked entries and assets before converting the nodes to Markdown. Decide how embedded entries become text, images, or frontend components. If the body is Long Text Markdown, keep that source and review its syntax (<a href="${CONTENTFUL.richText.href}" target="_blank" rel="noopener">Rich Text docs</a>).`,
        `Create a .md or .mdx file per post with supported frontmatter for title, slug, description, date, one category, and tags. Marble cannot import Contentful JSON directly. Upload files individually or as a ZIP of up to 100 Markdown files, within the import size limits. They become drafts (<a href="${MARBLE_DOCS.import}" target="_blank" rel="noopener">Marble import docs</a>).`,
        "Review the imported drafts before publishing. Match authors, check the category and tags, and set cover images and custom fields separately. Check converted formatting, especially tables and embedded components.",
        "Audit every image URL. A ZIP import does not rehost Contentful assets. Upload images you need to retain to Marble's media library and update body and cover references before removing the old assets.",
        "Plan locale groupings, arbitrary content types, editorial workflows, and relationships separately. They do not transfer as equivalent Marble features. Keep other content in Contentful or another suitable system, and add frontend redirects wherever public URLs change.",
      ],
    },
    faqs: [
      {
        question: "Is Marble a Contentful alternative for a blog?",
        answer:
          "Yes, when your content fits posts with authors, a category, tags, and custom fields. Marble provides that model and a hosted editor and API. Contentful is a better fit when your blog shares structured entries with other content types or needs localized fields. Both require your own frontend.",
      },
      {
        question: "Are Marble and Contentful both free to start?",
        answer: `Yes. Marble's Free plan includes 5,000 API requests a month and 1 team member. Contentful's Free plan includes 100,000 API calls a month and 10 users. Marble's paid plans are $5 and $20 per workspace per month on monthly billing. Contentful Lite is $300/month alongside its Free plan. Compare your usage against both <a href="https://marblecms.com/pricing" target="_blank" rel="noopener">Marble pricing</a> and <a href="${CONTENTFUL.pricing.href}" target="_blank" rel="noopener">Contentful pricing</a>.`,
      },
      {
        question: "Does every Contentful blog need a Rich Text renderer?",
        answer: `No. Contentful's Rich Text field returns JSON nodes, and Contentful provides rendering tools. A Long Text field can hold Markdown instead. Check your existing content type before choosing a rendering or migration approach (<a href="${CONTENTFUL.dataModel.href}" target="_blank" rel="noopener">data model docs</a>, <a href="${CONTENTFUL.richText.href}" target="_blank" rel="noopener">Rich Text docs</a>). Marble returns post bodies as HTML or Markdown.`,
      },
      {
        question: "Can Marble replace Contentful's localized content model?",
        answer: `Marble does not provide equivalent localized fields or arbitrary linked content types. You can plan separate translated posts and routes in your application, but you must manage their relationships yourself. Keep Contentful when those platform features are central to your workflow (<a href="${CONTENTFUL.dataModel.href}" target="_blank" rel="noopener">Contentful data model</a>).`,
      },
      {
        question: "Can I import a Contentful export directly into Marble?",
        answer: `No. Select the blog entries and intended locale from your Contentful export, resolve linked content, and convert the bodies to Markdown. Marble's <a href="${MARBLE_DOCS.import}" target="_blank" rel="noopener">file importer</a> creates drafts from Markdown or MDX files. Review authors, taxonomy, covers, custom fields, images, and old URL mappings before publishing.`,
      },
    ],
  },
];

export function getComparison(slug: string) {
  return COMPARISONS.find((comparison) => comparison.slug === slug);
}
