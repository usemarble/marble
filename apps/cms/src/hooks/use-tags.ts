import { createTagAction } from "@/lib/actions/tag";
import type { CreateTagValues } from "@/lib/validations/workspace";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useTags(workspaceId: string) {
  const queryClient = useQueryClient();

  const { data: tags } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () =>
      fetch(`/api/workspaces/${workspaceId}/tags`).then((res) => res.json()),
  });

  const createTag = useMutation({
    mutationFn: (data: CreateTagValues) => createTagAction(data, workspaceId),
    onMutate: async (newTag) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tags", workspaceId] });

      // Snapshot the previous value
      const previousTags = queryClient.getQueryData(["tags", workspaceId]);

      // Optimistically update to the new value
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      queryClient.setQueryData(["tags", workspaceId], (old: any[]) => [
        ...old,
        { id: "temp-id", ...newTag },
      ]);

      return { previousTags };
    },
    onError: (err, newTag, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["tags", workspaceId], context?.previousTags);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["tags", workspaceId] });
    },
  });

  return {
    tags,
    createTag,
  };
}
