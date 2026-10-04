import type {
  InferRouterInputs,
  InferRouterOutputs,
  RouterClient,
} from "@orpc/server";
import { aiRouter } from "./ai";
import { authorsRouter } from "./authors";
import { categoriesRouter } from "./categories";
import { dataTransferRouter } from "./data-transfer";
import { fieldsRouter } from "./fields";
import { keysRouter } from "./keys";
import { meRouter } from "./me";
import { mediaRouter } from "./media";
import { postsRouter } from "./posts";
import { shareRouter } from "./share";
import { tagsRouter } from "./tags";
import { uploadsRouter } from "./uploads";
import { webhooksRouter } from "./webhooks";
import { workspacesRouter } from "./workspaces";

export const appRouter = {
  ai: aiRouter,
  authors: authorsRouter,
  categories: categoriesRouter,
  data: dataTransferRouter,
  fields: fieldsRouter,
  tags: tagsRouter,
  uploads: uploadsRouter,
  me: meRouter,
  keys: keysRouter,
  media: mediaRouter,
  posts: postsRouter,
  share: shareRouter,
  workspaces: workspacesRouter,
  webhooks: webhooksRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<AppRouter>;
export type RouterInputs = InferRouterInputs<AppRouter>;
export type RouterOutputs = InferRouterOutputs<AppRouter>;
