import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applicationApi,
  type ApplicationListParams,
  type ApplicationPage,
  type ApplicationSummary,
  type UpdateApplicationInput,
} from "@api/Application.api";
import { applicationQueries } from "@api/Application.queries";

export interface ApplicationListContainerParams {
  params: ApplicationListParams;
}

export interface ApplicationListContainerState {
  applications: ApplicationSummary[];
  totalPages: number;
  isPending: boolean;
  isRefetching: boolean;
  updateApplication: (id: string, input: UpdateApplicationInput) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
}

export function useApplicationListContainer({
  params,
}: ApplicationListContainerParams): ApplicationListContainerState {
  const queryClient = useQueryClient();
  const listQuery = applicationQueries.list(params);
  const { data, isPending, isRefetching } = useQuery(listQuery);

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateApplicationInput }) =>
      applicationApi.update(id, input),
    // cancel in-flight fetches, keep the previous page, write the change into the row
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: listQuery.queryKey });
      const previous = queryClient.getQueryData<ApplicationPage>(listQuery.queryKey);
      queryClient.setQueryData<ApplicationPage>(listQuery.queryKey, (old) =>
        old && { ...old, items: old.items.map((a) => (a.id === id ? { ...a, ...input } : a)) },
      );
      return { previous };
    },
    // on failure, restore the previous page
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(listQuery.queryKey, context?.previous);
    },
    // the record still exists: its detail is stale, not gone
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: applicationQueries.detail(id).queryKey });
    },
    // the row can sit on any filter and page, so every list is refetched
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: applicationQueries.lists() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationApi.delete(id),
    // the same three steps: cancel, snapshot, drop the row from the page
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listQuery.queryKey });
      const previous = queryClient.getQueryData<ApplicationPage>(listQuery.queryKey);
      queryClient.setQueryData<ApplicationPage>(listQuery.queryKey, (old) =>
        old && { ...old, items: old.items.filter((a) => a.id !== id) },
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(listQuery.queryKey, context?.previous);
    },
    // the record is gone: drop its detail cache instead of refetching it
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: applicationQueries.detail(id).queryKey });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: applicationQueries.lists() });
    },
  });

  const updateApplication = useCallback(
    async (id: string, input: UpdateApplicationInput) => {
      await updateMutation.mutateAsync({ id, input });
    },
    [updateMutation.mutateAsync],
  );

  const deleteApplication = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation.mutateAsync],
  );

  return {
    applications: data?.items ?? [],
    // the pager renders a page count; total and pageSize are the server's word for it
    totalPages: data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1,
    isPending,
    isRefetching,
    updateApplication,
    deleteApplication,
  };
}
