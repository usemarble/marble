"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { emptyPost } from "@marble/api/lib/post-defaults";
import {
  type PostEditorValues,
  type PostValues,
  postEditorSchema,
} from "@marble/api/lib/post-validation";
import { toast } from "@marble/ui/components/sonner";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { notFound, useParams, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { z } from "zod";
import { orpc } from "@/lib/orpc";
import { useWorkspace } from "@/providers/workspace";
import type { CustomField } from "@/types/fields";
import PageLoader from "../shared/page-loader";

type PostEditorInput = z.input<typeof postEditorSchema>;

type EditorMode = "create" | "update";

interface EditorBootstrap {
  fields: CustomField[];
  values: PostEditorValues;
}

interface EditorDataContextValue {
  fieldDefinitions: CustomField[];
  form: ReturnType<typeof useForm<PostEditorInput, unknown, PostEditorValues>>;
  hasUnsavedChanges: boolean;
  isReady: boolean;
  isSubmitting: boolean;
  mode: EditorMode;
  postId?: string;
  /**
   * Register work that must run right before the form is submitted, such as
   * writing debounced editor content into the form. Returns an unregister
   * function.
   */
  registerBeforeSubmit: (callback: () => void) => () => void;
  submit: () => void;
}

const EditorDataContext = createContext<EditorDataContextValue | undefined>(
  undefined
);

const CORE_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  slug: "Slug",
  category: "Category",
  content: "Content",
  contentJson: "Content",
  publishedAt: "Publish date",
  coverImage: "Cover image",
};

function buildEditorValues(
  fields: CustomField[],
  post?: PostValues,
  customFieldValues?: Record<string, string>
): PostEditorValues {
  const values: PostValues = post
    ? {
        ...post,
        publishedAt: new Date(post.publishedAt),
      }
    : {
        ...emptyPost,
        authors: [],
      };

  return {
    ...values,
    customFields: Object.fromEntries(
      fields.map((field) => [field.id, customFieldValues?.[field.id] ?? ""])
    ),
  };
}

function buildCustomFieldPayload(
  fields: CustomField[],
  values: Record<string, string>
) {
  return Object.fromEntries(
    fields.map((field) => {
      const value = values[field.id] ?? "";
      return [field.id, value.trim() === "" ? null : value];
    })
  );
}

export function EditorDataProvider({
  children,
  postId,
}: {
  children: React.ReactNode;
  postId?: string;
}) {
  const router = useRouter();
  const params = useParams<{ workspace: string }>();
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;
  const mode: EditorMode = postId ? "update" : "create";
  const [hasHydrated, setHasHydrated] = useState(false);
  const didInitialize = useRef(false);
  const beforeSubmitCallbacks = useRef(new Set<() => void>());

  const form = useForm<PostEditorInput, unknown, PostEditorValues>({
    resolver: zodResolver(postEditorSchema),
    defaultValues: buildEditorValues([]),
  });

  const postQuery = useQuery(
    orpc.posts.get.queryOptions({
      input: workspaceId && postId ? { workspaceId, id: postId } : skipToken,
      staleTime: 1000 * 60 * 5,
    })
  );
  const postFieldsQuery = useQuery(
    orpc.posts.fields.get.queryOptions({
      input: workspaceId && postId ? { workspaceId, id: postId } : skipToken,
      staleTime: 1000 * 60 * 5,
    })
  );
  const newFieldsQuery = useQuery(
    orpc.posts.fields.list.queryOptions({
      input: workspaceId && !postId ? { workspaceId } : skipToken,
      staleTime: 1000 * 60 * 5,
    })
  );
  const bootstrap = useMemo<EditorBootstrap | undefined>(() => {
    if (!postId) {
      return newFieldsQuery.data
        ? {
            fields: newFieldsQuery.data,
            values: buildEditorValues(newFieldsQuery.data),
          }
        : undefined;
    }
    if (!(postQuery.data && postFieldsQuery.data)) {
      return;
    }
    return {
      fields: postFieldsQuery.data.fields,
      values: buildEditorValues(
        postFieldsQuery.data.fields,
        postQuery.data,
        postFieldsQuery.data.values
      ),
    };
  }, [newFieldsQuery.data, postFieldsQuery.data, postId, postQuery.data]);
  const bootstrapError = postId
    ? (postQuery.error ?? postFieldsQuery.error)
    : newFieldsQuery.error;

  useEffect(() => {
    if (bootstrap === undefined) {
      return;
    }

    if (!didInitialize.current) {
      form.reset(bootstrap.values);
      didInitialize.current = true;
    }

    setHasHydrated(true);
  }, [bootstrap, form]);

  useEffect(() => {
    if (!form.formState.isDirty) {
      return;
    }

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [form.formState.isDirty]);

  const createMutation = useMutation(
    orpc.posts.create.mutationOptions({
      onSuccess: async (data) => {
        toast.success("Post created");
        await queryClient.invalidateQueries({
          queryKey: orpc.posts.list.key({ input: { workspaceId } }),
        });
        router.push(`/${params.workspace}/editor/p/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const updateMutation = useMutation(
    orpc.posts.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Post updated");
        await queryClient.invalidateQueries({
          queryKey: orpc.posts.key({ input: { workspaceId } }),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleInvalidSubmit = useCallback(() => {
    const formErrors = form.formState.errors;
    const invalidFields = new Set<string>();

    for (const [fieldName, label] of Object.entries(CORE_FIELD_LABELS)) {
      if (fieldName in formErrors) {
        invalidFields.add(label);
      }
    }

    const customFieldErrors = formErrors.customFields;
    if (customFieldErrors && bootstrap) {
      for (const field of bootstrap.fields) {
        if (customFieldErrors[field.id]) {
          invalidFields.add(field.name);
        }
      }
    }

    toast.error(
      invalidFields.size > 0
        ? `Missing or invalid fields: ${Array.from(invalidFields).join(", ")}`
        : "Please fix the highlighted fields"
    );
  }, [bootstrap, form.formState.errors]);

  const handleValidSubmit = useCallback(
    async (values: PostEditorValues) => {
      if (!workspaceId) {
        throw new Error("Missing workspace ID");
      }
      const input = {
        ...values,
        workspaceId,
        customFields: buildCustomFieldPayload(
          bootstrap?.fields ?? [],
          values.customFields
        ),
      };
      if (postId) {
        await updateMutation.mutateAsync({ ...input, id: postId });
        form.reset(values);
        return;
      }
      await createMutation.mutateAsync(input);
    },
    [
      bootstrap?.fields,
      createMutation,
      form,
      postId,
      updateMutation,
      workspaceId,
    ]
  );

  const registerBeforeSubmit = useCallback((callback: () => void) => {
    beforeSubmitCallbacks.current.add(callback);
    return () => {
      beforeSubmitCallbacks.current.delete(callback);
    };
  }, []);

  const submit = useCallback(() => {
    for (const callback of beforeSubmitCallbacks.current) {
      callback();
    }

    form.handleSubmit(handleValidSubmit, handleInvalidSubmit)();
  }, [form, handleInvalidSubmit, handleValidSubmit]);

  const contextValue = useMemo<EditorDataContextValue>(() => {
    const fieldDefinitions = bootstrap?.fields ?? [];
    return {
      fieldDefinitions,
      form,
      hasUnsavedChanges: form.formState.isDirty,
      isReady: Boolean(bootstrap) && hasHydrated,
      isSubmitting: createMutation.isPending || updateMutation.isPending,
      mode,
      postId,
      registerBeforeSubmit,
      submit,
    };
  }, [
    bootstrap,
    createMutation.isPending,
    form,
    form.formState.isDirty,
    hasHydrated,
    mode,
    postId,
    registerBeforeSubmit,
    submit,
    updateMutation.isPending,
  ]);

  if (bootstrapError) {
    if ("code" in bootstrapError && bootstrapError.code === "NOT_FOUND") {
      return notFound();
    }
    throw bootstrapError;
  }
  if (!bootstrap || !hasHydrated) {
    return <PageLoader />;
  }

  return (
    <EditorDataContext.Provider value={contextValue}>
      <FormProvider {...form}>{children}</FormProvider>
    </EditorDataContext.Provider>
  );
}

export function useEditorData() {
  const context = useContext(EditorDataContext);

  if (!context) {
    throw new Error("useEditorData must be used within EditorDataProvider");
  }

  return context;
}
