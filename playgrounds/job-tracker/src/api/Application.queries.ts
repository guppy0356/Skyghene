import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { applicationApi, type ApplicationListParams } from "./Application.api";

export const applicationQueries = {
  all: () => ["applications"] as const,
  // prefix: every combination of filter, sort and page
  lists: () => [...applicationQueries.all(), "list"] as const,
  // leaf: one combination
  list: (params: ApplicationListParams) =>
    queryOptions({
      queryKey: [...applicationQueries.lists(), params],
      queryFn: () => applicationApi.getList(params),
      placeholderData: keepPreviousData,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...applicationQueries.all(), "detail", id],
      queryFn: () => applicationApi.getDetail(id),
      retry: false,
    }),
  // a sibling of "detail", not a child of it
  interviews: (id: string) =>
    queryOptions({
      queryKey: [...applicationQueries.all(), "interviews", id],
      queryFn: () => applicationApi.getInterviews(id),
    }),
};
