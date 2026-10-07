import { useQuery } from "@tanstack/react-query";
import type { ApplicationDetail, ApplicationInterview } from "@api/Application.api";
import { applicationQueries } from "@api/Application.queries";
import { TypedStatusError } from "../../../lib/api-client";

export interface ApplicationDetailContainerParams {
  applicationId: string;
  withInterviews: boolean;
}

export interface ApplicationDetailContainerState {
  detail: ApplicationDetail | undefined;
  interviews: ApplicationInterview[];
  isApplicationPending: boolean;
  isApplicationRefetching: boolean;
  isNotFound: boolean;
  isInterviewsLoading: boolean;
}

export function useApplicationDetailContainer({
  applicationId,
  withInterviews,
}: ApplicationDetailContainerParams): ApplicationDetailContainerState {
  const applicationQuery = useQuery(applicationQueries.detail(applicationId));
  // the wait for the Interviews tab is this page's, added at the call
  const interviewsQuery = useQuery({
    ...applicationQueries.interviews(applicationId),
    enabled: withInterviews,
  });

  return {
    detail: applicationQuery.data,
    interviews: interviewsQuery.data ?? [],
    isApplicationPending: applicationQuery.isPending,
    isApplicationRefetching: applicationQuery.isRefetching,
    isNotFound:
      applicationQuery.error instanceof TypedStatusError && applicationQuery.error.status === 404,
    isInterviewsLoading: interviewsQuery.isLoading,
  };
}
