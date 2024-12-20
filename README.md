# marble

A smarter way to manage your blog.

## Structure

This repository is a monorepo and is structured as follows

```text
/
├── apps/
│ ├─ api/
│ ├─ cms/
│ ├─ app/  
│ └─ web/
├── packages/
│ ├─ db/
│ ├─ tsconfig/
│ └─ ui/
├── .npmrc
├── .prettierrc
├── CONTRIBUTING.md
├── package.json
├── pnpm-worksapce.yaml
├── README.md
└── turbo.json
```

## Apps

This directory contains the source code for all related applications

- api: A [Hono](https://hono.dev) app for the api
- cms: A [Next.js](https://nextjs.org) app for the dashboard
- docs: A [Next.js](https://nextjs.org) app for api documentation
- web: An [Astro.js](https://astro.build) app for the website

## Packages

Packages contain internal shared packages between application i.e

- ui: contains react ui components shared between `docs` and `web`
- db: contains the database client and schema shared between `api` and `app`

## Resources

Learn more about the power of Turborepo:

- [Turborepo docs](https://turbo.build/docs)
- [Prisma docs](https://www.prisma.io/docs/)
- [Biome docs](https://biomejs.dev/)
- [Next.js docs](https://nextjs.org/docs)
- [Hono docs](https://hono.dev/docs)
