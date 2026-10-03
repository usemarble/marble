import type { InferRouterOutputs, RouterClient } from "@orpc/server";
import { meRouter } from "./me";
import { postsRouter } from "./posts";
import { workspacesRouter } from "./workspaces";

export const appRouter = {
  me: meRouter,
  posts: postsRouter,
  workspaces: workspacesRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<AppRouter>;
export type RouterOutputs = InferRouterOutputs<AppRouter>;
