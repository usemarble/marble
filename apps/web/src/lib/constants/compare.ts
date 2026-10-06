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
];

export function getComparison(slug: string) {
  return COMPARISONS.find((comparison) => comparison.slug === slug);
}
