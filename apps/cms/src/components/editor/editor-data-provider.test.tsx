// @vitest-environment happy-dom

import { emptyPost } from "@marble/api/lib/post-defaults";
import type { PostEditorValues } from "@marble/api/lib/post-validation";
import {
  QueryClient,
  QueryClientProvider,
  skipToken,
} from "@tanstack/react-query";
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditorDataProvider, useEditorData } from "./editor-data-provider";

const state = vi.hoisted(() => ({
  update: vi.fn(),
  readPost: vi.fn(),
  create: vi.fn(),
  beforeSubmit: vi.fn(),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push }),
  useParams: () => ({ workspace: "test" }),
  notFound: vi.fn(),
}));
vi.mock("@/providers/workspace", () => ({
  useWorkspace: () => ({ activeWorkspace: { id: "workspace" } }),
}));
vi.mock("@marble/ui/components/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("../shared/page-loader", () => ({ default: () => <p>Loading</p> }));
vi.mock("@/lib/orpc", () => ({
  orpc: {
    posts: {
      get: {
        queryOptions: ({ input }: { input: unknown }) => ({
          queryKey: ["post"],
          queryFn: input === skipToken ? skipToken : state.readPost,
        }),
      },
      fields: {
        get: {
          queryOptions: ({ input }: { input: unknown }) => ({
            queryKey: ["fields"],
            queryFn: input === skipToken ? skipToken : vi.fn(),
          }),
        },
        list: {
          queryOptions: () => ({
            queryKey: ["new-fields"],
            queryFn: skipToken,
          }),
        },
      },
      key: () => ["post"],
      list: { key: () => ["list"] },
      create: { mutationOptions: () => ({ mutationFn: state.create }) },
      update: {
        mutationOptions: (options: object) => ({
          ...options,
          mutationFn: state.update,
        }),
      },
    },
  },
}));

let root: Root;
let host: HTMLDivElement;
let queryClient: QueryClient;
let editor: ReturnType<typeof useEditorData>;
const publishedAt = new Date("2030-05-01T15:30:00Z");
const values = {
  ...emptyPost,
  title: "Launch",
  slug: "launch",
  description: "A launch",
  category: "category",
  authors: ["author"],
  publishedAt,
  customFields: {},
};

function Probe() {
  editor = useEditorData();
  useEffect(() => editor.registerBeforeSubmit(state.beforeSubmit), []);
  return <p>{editor.isReadOnly ? "Read only" : "Editable"}</p>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  state.update.mockResolvedValue({ id: "post" });
  state.create.mockResolvedValue({ id: "new" });
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Number.POSITIVE_INFINITY, retry: false },
    },
  });
  state.readPost.mockImplementation(async () =>
    queryClient.getQueryData(["post"])
  );
  queryClient.setQueryData(["fields"], { fields: [], values: {} });
  queryClient.setQueryData(["new-fields"], []);
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

async function mount(
  status: PostEditorValues["status"],
  postId: string | null = "post"
) {
  queryClient.setQueryData(["post"], { ...values, status });
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <EditorDataProvider postId={postId ?? undefined}>
          <Probe />
        </EditorDataProvider>
      </QueryClientProvider>
    );
  });
}

async function submit() {
  await act(async () => {
    editor.submit();
  });
}

describe("scheduled editor write protection", () => {
  it("hydrates scheduled status and instant, and refuses submissions before callbacks", async () => {
    await mount("scheduled");
    expect(host.textContent).toBe("Read only");
    expect(editor.form.getValues()).toMatchObject({
      status: "scheduled",
      publishedAt,
    });
    await act(async () => {
      editor.form.setValue("status", "draft");
    });
    await submit();
    expect(editor.isReadOnly).toBe(true);
    expect(state.beforeSubmit).not.toHaveBeenCalled();
    expect(state.update).not.toHaveBeenCalled();
    expect(state.create).not.toHaveBeenCalled();
  });

  it("immediately refuses writes when a previously editable row refetches as scheduled", async () => {
    await mount("draft");
    await act(async () => {
      queryClient.setQueryData(["post"], { ...values, status: "scheduled" });
    });
    await submit();
    expect(state.beforeSubmit).not.toHaveBeenCalled();
    expect(state.update).not.toHaveBeenCalled();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(editor.isReadOnly).toBe(true);
    expect(editor.form.getValues()).toMatchObject({
      status: "scheduled",
      publishedAt,
    });
  });

  it("preserves refetched scheduled values when an earlier save resolves", async () => {
    let finishUpdate: (value: { id: string }) => void = () => {
      throw new Error("Update has not started");
    };
    state.update.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishUpdate = resolve;
        })
    );
    await mount("draft");
    await submit();
    await vi.waitFor(() => expect(state.update).toHaveBeenCalledOnce());
    const scheduledValues = {
      ...values,
      status: "scheduled",
      content: "<p>Stored scheduled content</p>",
      publishedAt: new Date("2031-07-02T16:00:00Z"),
    };
    await act(async () => {
      queryClient.setQueryData(["post"], scheduledValues);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(editor.isReadOnly).toBe(true);
    expect(editor.form.getValues()).toMatchObject(scheduledValues);
    await act(async () => {
      finishUpdate({ id: "post" });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(editor.isReadOnly).toBe(true);
    expect(state.readPost).toHaveBeenCalledOnce();
    expect(editor.form.getValues()).toMatchObject(scheduledValues);
  });

  it.each(["draft", "published"] as const)(
    "still submits %s posts through the closed write schema",
    async (status) => {
      await mount(status);
      await submit();
      await vi.waitFor(() => expect(state.update).toHaveBeenCalledOnce());
      expect(state.beforeSubmit).toHaveBeenCalledOnce();
      expect(state.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "post", status, publishedAt }),
        expect.anything()
      );
    }
  );

  it("keeps new-post creation on draft", async () => {
    await mount("draft", null);
    await act(async () => {
      editor.form.reset(values);
    });
    await submit();
    await vi.waitFor(() => expect(state.create).toHaveBeenCalledOnce());
    expect(state.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "draft" }),
      expect.anything()
    );
  });
});
