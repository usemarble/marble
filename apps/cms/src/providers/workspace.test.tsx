// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceContextType } from "@/types/workspace";
import { useWorkspace, WorkspaceProvider } from "./workspace";

const state = vi.hoisted(() => ({
  session: { session: { activeOrganizationId: "removed" as string | null } },
  workspaces: [] as { id: string; slug: string; currentUserRole: string }[],
  pathname: "/removed/settings/general",
  list: vi.fn(),
  setActive: vi.fn(),
  deleteWorkspace: vi.fn(),
  leaveWorkspace: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/lib/auth/client", () => ({
  useSession: () => ({ data: state.session }),
  organization: {
    setActive: state.setActive,
    delete: state.deleteWorkspace,
    leave: state.leaveWorkspace,
  },
}));
vi.mock("@/lib/orpc", () => ({
  orpc: {
    workspaces: {
      list: {
        key: () => ["workspaces"],
        queryOptions: () => ({ queryKey: ["workspaces"], queryFn: state.list }),
      },
    },
  },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push, replace: state.replace }),
  usePathname: () => state.pathname,
}));
vi.mock("@marble/ui/components/sonner", () => ({
  toast: { error: state.toast },
}));
vi.mock("@/app/not-found", () => ({ default: () => <div>Not found</div> }));
vi.mock("@/utils/workspace/client", () => ({
  setLastVisitedWorkspace: vi.fn(),
}));

const removedWorkspace = {
  id: "removed",
  slug: "removed",
  currentUserRole: "owner",
};
const nextWorkspace = { id: "next", slug: "next", currentUserRole: "owner" };
interface AuthResult {
  error: { message: string } | null;
}

let root: Root;
let host: HTMLDivElement;
let queryClient: QueryClient;
let workspace: WorkspaceContextType;

function Probe() {
  workspace = useWorkspace();
  return <div>{workspace.activeWorkspace?.slug}</div>;
}

function render(slug = "removed") {
  root.render(
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider key={slug} workspaceSlug={slug}>
        <Probe />
      </WorkspaceProvider>
    </QueryClientProvider>
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function mount(slug = "removed") {
  await act(async () => {
    render(slug);
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  state.session = { session: { activeOrganizationId: "removed" } };
  state.workspaces = [removedWorkspace, nextWorkspace];
  state.list.mockImplementation(() => Promise.resolve(state.workspaces));
  state.setActive.mockImplementation(({ organizationId }) => {
    state.session = { session: { activeOrganizationId: organizationId } };
    return Promise.resolve({ error: null });
  });
  const remove = ({ organizationId }: { organizationId: string }) => {
    state.workspaces = state.workspaces.filter(
      (entry) => entry.id !== organizationId
    );
    state.session = { session: { activeOrganizationId: null } };
    return Promise.resolve({ error: null });
  };
  state.deleteWorkspace.mockImplementation(remove);
  state.leaveWorkspace.mockImplementation(remove);
  queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: false } },
  });
  queryClient.setQueryData(["workspaces"], state.workspaces);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  queryClient.clear();
  host.remove();
  vi.unstubAllGlobals();
});

describe("workspace removal", () => {
  it.each(["delete", "leave"] as const)(
    "%s pauses the old workspace through list/session refresh and redirects once",
    async (action) => {
      await mount();

      await act(async () => {
        await workspace.removeWorkspace("removed", action);
        render();
      });

      expect(state.setActive).not.toHaveBeenCalled();
      expect(state.toast).not.toHaveBeenCalled();
      expect(host.textContent).toBe("removed");
      expect(state.replace).toHaveBeenCalledExactlyOnceWith("/next");
      expect(state.push).not.toHaveBeenCalled();
      expect(queryClient.getQueryData(["workspaces"])).toEqual([nextWorkspace]);

      await mount("next");
      expect(state.setActive).toHaveBeenCalledExactlyOnceWith({
        organizationId: "next",
      });
      expect(state.session.session.activeOrganizationId).toBe("next");
    }
  );

  it.each(["delete", "leave"] as const)(
    "%s of the last workspace refreshes the list and redirects to /new",
    async (action) => {
      state.workspaces = [removedWorkspace];
      queryClient.setQueryData(["workspaces"], state.workspaces);
      await mount();

      await act(async () => {
        await workspace.removeWorkspace("removed", action);
        render();
      });

      expect(state.replace).toHaveBeenCalledExactlyOnceWith("/new");
      expect(queryClient.getQueryData(["workspaces"])).toEqual([]);
      expect(state.setActive).not.toHaveBeenCalled();
      expect(state.toast).not.toHaveBeenCalled();
      expect(host.textContent).toBe("removed");
    }
  );

  it("stays paused when the session refresh beats a slow workspace list", async () => {
    const list = deferred<typeof state.workspaces>();
    state.list.mockReturnValue(list.promise);
    await mount();

    await act(async () => {
      await workspace.removeWorkspace("removed", "delete");
      render();
    });
    expect(queryClient.isFetching()).toBe(1);
    expect(state.setActive).not.toHaveBeenCalled();

    await act(async () => {
      list.resolve(state.workspaces);
      await list.promise;
    });
    expect(state.setActive).not.toHaveBeenCalled();
    expect(state.toast).not.toHaveBeenCalled();
  });

  it("waits for every activation already in flight before deleting", async () => {
    const first = deferred<AuthResult>();
    const second = deferred<AuthResult>();
    state.session = { session: { activeOrganizationId: null } };
    state.setActive
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    await mount();
    state.session = { session: { activeOrganizationId: null } };
    await mount();
    expect(state.setActive).toHaveBeenCalledTimes(2);

    let removal: Promise<void>;
    await act(async () => {
      removal = workspace.removeWorkspace("removed", "delete");
    });
    expect(state.deleteWorkspace).not.toHaveBeenCalled();

    await act(async () => {
      second.resolve({ error: null });
      await second.promise;
    });
    expect(state.deleteWorkspace).not.toHaveBeenCalled();

    await act(async () => {
      first.resolve({ error: null });
      await removal;
    });
    expect(state.deleteWorkspace).toHaveBeenCalledExactlyOnceWith({
      organizationId: "removed",
    });
    expect(state.setActive).toHaveBeenCalledTimes(2);
    expect(state.toast).not.toHaveBeenCalled();
    expect(state.replace).toHaveBeenCalledExactlyOnceWith("/next");
  });

  it.each(["delete", "leave"] as const)(
    "resumes activation and permits retry when %s fails",
    async (action) => {
      const pending = deferred<AuthResult>();
      const remove =
        action === "delete" ? state.deleteWorkspace : state.leaveWorkspace;
      remove.mockReturnValueOnce(pending.promise);
      await mount();
      let removal: Promise<void>;
      await act(async () => {
        removal = workspace.removeWorkspace("removed", action);
      });
      state.session = { session: { activeOrganizationId: null } };
      await mount();
      expect(state.setActive).not.toHaveBeenCalled();

      await act(async () => {
        pending.resolve({ error: { message: "Removal failed" } });
        await expect(removal).rejects.toThrow("Removal failed");
      });
      expect(state.replace).not.toHaveBeenCalled();
      expect(state.setActive).toHaveBeenCalledExactlyOnceWith({
        organizationId: "removed",
      });

      await act(async () => {
        await workspace.removeWorkspace("removed", action);
      });
      expect(state.replace).toHaveBeenCalledExactlyOnceWith("/next");
    }
  );

  it("resumes after a network rejection", async () => {
    state.deleteWorkspace.mockRejectedValueOnce(
      new Error("Network unavailable")
    );
    await mount();
    await act(async () => {
      await expect(
        workspace.removeWorkspace("removed", "delete")
      ).rejects.toThrow("Network unavailable");
    });
    state.session = { session: { activeOrganizationId: null } };
    await mount();
    expect(state.setActive).toHaveBeenCalledExactlyOnceWith({
      organizationId: "removed",
    });
    expect(state.replace).not.toHaveBeenCalled();
  });
});

describe("workspace activation", () => {
  it("ignores an activation error after the outgoing provider unmounts", async () => {
    const pending = deferred<AuthResult>();
    state.session = { session: { activeOrganizationId: null } };
    state.setActive.mockReturnValueOnce(pending.promise);
    await mount();
    await mount("next");

    await act(async () => {
      pending.resolve({
        error: { message: "User is not a member of the organization" },
      });
      await pending.promise;
    });
    expect(host.textContent).toBe("next");
    expect(state.toast).not.toHaveBeenCalled();
  });

  it("still reports an activation error for the current workspace", async () => {
    state.session = { session: { activeOrganizationId: null } };
    state.setActive.mockResolvedValueOnce({
      error: { message: "Activation failed" },
    });
    await mount();
    expect(state.toast).toHaveBeenCalledExactlyOnceWith("Activation failed");
  });

  it("keeps normal switching on the same dashboard path", async () => {
    await mount();
    await workspace.updateActiveWorkspace({ slug: "next" });
    expect(state.push).toHaveBeenCalledExactlyOnceWith(
      "/next/settings/general"
    );
    expect(state.replace).not.toHaveBeenCalled();
  });
});
