import type {
  InferRouterInputs,
  InferRouterOutputs,
  RouterClient,
} from "@orpc/server";
import { authorsRouter } from "./authors";
import { categoriesRouter } from "./categories";
import { fieldsRouter } from "./fields";
import { keysRouter } from "./keys";
import { meRouter } from "./me";
import { postsRouter } from "./posts";
import { shareRouter } from "./share";
import { tagsRouter } from "./tags";
import { webhooksRouter } from "./webhooks";
import { workspacesRouter } from "./workspaces";

export const appRouter = {
  authors: authorsRouter,
  categories: categoriesRouter,
  fields: fieldsRouter,
  tags: tagsRouter,
  me: meRouter,
  keys: keysRouter,
  posts: postsRouter,
  share: shareRouter,
  workspaces: workspacesRouter,
  webhooks: webhooksRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<AppRouter>;
export type RouterInputs = InferRouterInputs<AppRouter>;
export type RouterOutputs = InferRouterOutputs<AppRouter>;
