"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@marble/ui/components/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { FormProvider, type Resolver, useForm } from "react-hook-form";
import { emptyPost } from "@/lib/data/post";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type PostEditorValues,
  type PostValues,
  postEditorSchema,
} from "@/lib/validations/post";
import type { CustomField } from "@/types/fields";
import PageLoader from "../shared/page-loader";

type EditorMode = "create" | "update";

interface EditorBootstrap {
  fields: CustomField[];
  values: PostEditorValues;
}

interface EditorDataContextValue {
  fieldDefinitions: CustomField[];
  form: ReturnType<typeof useForm<PostEditorValues>>;
  hasUnsavedChanges: boolean;
  isReady: boolean;
  isSubmitting: boolean;
  mode: EditorMode;
  postId?: string;
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
  attribution: "Attribution",
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

async function fetchEditorBootstrap(
  postId?: string
): Promise<EditorBootstrap | null> {
  if (!postId) {
    const response = await fetch("/api/fields");

    if (!response.ok) {
      throw new Error("Failed to fetch custom fields");
    }

    const fields: CustomField[] = await response.json();

    return {
      fields,
      values: buildEditorValues(fields),
    };
  }

  const [postResponse, customFieldsResponse] = await Promise.all([
    fetch(`/api/posts/${postId}`),
    fetch(`/api/posts/${postId}/fields`),
  ]);

  if (postResponse.status === 404 || customFieldsResponse.status === 404) {
    return null;
  }

  if (!postResponse.ok) {
    throw new Error("Failed to fetch post");
  }

  if (!customFieldsResponse.ok) {
    throw new Error("Failed to fetch post custom fields");
  }

  const post = (await postResponse.json()) as PostValues;
  const customFieldData = (await customFieldsResponse.json()) as {
    fields: CustomField[];
    values: Record<string, string>;
  };

  return {
    fields: customFieldData.fields,
    values: buildEditorValues(
      customFieldData.fields,
      post,
      customFieldData.values
    ),
  };
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
  const mode: EditorMode = postId ? "update" : "create";
  const [hasHydrated, setHasHydrated] = useState(false);
  const didInitialize = useRef(false);

  const form = useForm<PostEditorValues>({
    resolver: zodResolver(postEditorSchema) as Resolver<PostEditorValues>,
    defaultValues: buildEditorValues([]),
  });

  const bootstrapQuery = useQuery({
    queryKey: ["editor-bootstrap", postId ?? "new"],
    staleTime: 1000 * 60 * 5,
    queryFn: () => fetchEditorBootstrap(postId),
  });

  useEffect(() => {
    if (bootstrapQuery.data === undefined) {
      return;
    }

    if (bootstrapQuery.data === null) {
      setHasHydrated(true);
      return;
    }

    if (!didInitialize.current) {
      form.reset(bootstrapQuery.data.values);
      didInitialize.current = true;
    }

    setHasHydrated(true);
  }, [bootstrapQuery.data, form]);

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

  const createMutation = useMutation({
    mutationFn: async (values: PostEditorValues) => {
      const response = await fetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          customFields: buildCustomFieldPayload(
            bootstrapQuery.data?.fields ?? [],
            values.customFields
          ),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to create post");
      }

      return (await response.json()) as { id: string };
    },
    onSuccess: async (data) => {
      toast.success("Post created");
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.POSTS(params.workspace),
      });
      router.push(`/${params.workspace}/editor/p/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: PostEditorValues) => {
      if (!postId) {
        throw new Error("Missing post ID");
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...values,
          customFields: buildCustomFieldPayload(
            bootstrapQuery.data?.fields ?? [],
            values.customFields
          ),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update post");
      }

      return values;
    },
    onSuccess: async (values) => {
      toast.success("Post updated");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.POSTS(params.workspace),
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.POST(params.workspace, postId ?? ""),
        }),
        queryClient.invalidateQueries({
          queryKey: ["editor-bootstrap", postId ?? "new"],
        }),
      ]);
      form.reset(values);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleInvalidSubmit = useCallback(() => {
    const formErrors = form.formState.errors;
    const invalidFields = new Set<string>();

    for (const [fieldName, label] of Object.entries(CORE_FIELD_LABELS)) {
      if (fieldName in formErrors) {
        invalidFields.add(label);
      }
    }

    const customFieldErrors = formErrors.customFields;
    if (customFieldErrors && bootstrapQuery.data) {
      for (const field of bootstrapQuery.data.fields) {
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
  }, [bootstrapQuery.data, form.formState.errors]);

  const handleValidSubmit = useCallback(
    async (values: PostEditorValues) => {
      if (mode === "update") {
        await updateMutation.mutateAsync(values);
        return;
      }

      await createMutation.mutateAsync(values);
    },
    [createMutation, mode, updateMutation]
  );

  const submit = useCallback(() => {
    form.handleSubmit(handleValidSubmit, handleInvalidSubmit)();
  }, [form, handleInvalidSubmit, handleValidSubmit]);

  const contextValue = useMemo<EditorDataContextValue>(() => {
    const fieldDefinitions = bootstrapQuery.data?.fields ?? [];
    return {
      fieldDefinitions,
      form,
      hasUnsavedChanges: form.formState.isDirty,
      isReady: bootstrapQuery.isSuccess && hasHydrated,
      isSubmitting: createMutation.isPending || updateMutation.isPending,
      mode,
      postId,
      submit,
    };
  }, [
    bootstrapQuery.data?.fields,
    bootstrapQuery.isSuccess,
    createMutation.isPending,
    form,
    hasHydrated,
    mode,
    postId,
    submit,
    updateMutation.isPending,
  ]);

  if (bootstrapQuery.isLoading || (bootstrapQuery.isSuccess && !hasHydrated)) {
    return <PageLoader />;
  }

  if (bootstrapQuery.data === null) {
    return notFound();
  }

  if (bootstrapQuery.isError || !bootstrapQuery.data) {
    throw bootstrapQuery.error;
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
