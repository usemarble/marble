import type { InferRouterOutputs, RouterClient } from "@orpc/server";
import { meRouter } from "./me";
import { workspacesRouter } from "./workspaces";

export const appRouter = {
  me: meRouter,
  workspaces: workspacesRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<AppRouter>;
export type RouterOutputs = InferRouterOutputs<AppRouter>;
