import type { InferRouterOutputs, RouterClient } from "@orpc/server";
import { categoriesRouter } from "./categories";
import { meRouter } from "./me";
import { postsRouter } from "./posts";
import { tagsRouter } from "./tags";
import { workspacesRouter } from "./workspaces";

export const appRouter = {
  categories: categoriesRouter,
  tags: tagsRouter,
  me: meRouter,
  posts: postsRouter,
  workspaces: workspacesRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<AppRouter>;
export type RouterOutputs = InferRouterOutputs<AppRouter>;
