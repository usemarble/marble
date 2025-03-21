# Contributing to marble

Thank you for your interest in contributing! This document outlines the process for contributing to the project.

## Structure

This repository is a monorepo and is structured as follows

```text
/
├── apps/
│ ├─ api/
│ ├─ cms/
│ ├─ docs/
│ └─ web/
├── packages/
│ ├─ db/
│ ├─ tsconfig/
│ └─ ui/
├── .npmrc
├── .prettierrc
├── biome.json
├── LICENSE.md
├── package.json
├── pnpm-workspace.yaml
├── README.md
└── turbo.json
```

## Apps

This directory contains the source code for all related applications:

- api: A [Hono](https://hono.dev) app for the api
- cms: A [Next.js](https://nextjs.org) app for the dashboard
- docs: A [Next.js](https://nextjs.org) app for api documentation
- web: An [Astro.js](https://astro.build) app for the website

## Packages

Packages contain internal shared modules used across different applications:

- ui: contains react ui components shared between `docs` and `web`
- db: contains the database client and schema shared between `api` and `app` for database operations
- tsconfig: TypeScript configurations shared across the monorepo.

## Getting Started

1. [Fork](https://github.com/taqh/marble/fork/) this repository to your own account and then
   [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device.
2. Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test your changes thoroughly and ensure the build runs successfully before pushing.
5. Commit your changes with clear, descriptive commit messages
6. Push to your fork
7. Submit a Pull Request

## Pull Request Guidelines

- Your PR should reference an issue (if applicable) or clearly describe its impact on the project. [see how to Link a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
- Include a clear description of the changes
- Keep PRs small and focused. Large PRs are harder to review and may be rejected or delayed.
- Ensure consistency with the existing codebase. Use Biome for formatting.
- Include tests if applicable
- Update documentation if your changes affect usage or API behavior.

## Code Style

- Follow the existing code formatting in the project (use Biome for consistency).
- Write clear, self-documenting code
- Add comments only when necessary to explain complex logic
- Use meaningful variable and function names

## Reporting Issues

- Use the GitHub issue tracker
- Check if the issue already exists before creating a new one
- Provide a clear description of the issue
- Include steps to reproduce the issue

## Need Help?

Feel free to open an issue for questions or join our discussions. We're here to help!

Thank you for contributing!
