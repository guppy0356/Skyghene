import { useParams, useSearch } from "@tanstack/react-router";
import { useApplicationDetailContainer } from "./ApplicationDetail.container.hook";
import { ApplicationDetailComponent } from "./ApplicationDetail.component";

export function ApplicationDetailContainer() {
  const { applicationId } = useParams({ from: "/applications/$applicationId" });
  const search = useSearch({ from: "/applications/$applicationId" });
  const {
    detail,
    interviews,
    isApplicationPending,
    isApplicationRefetching,
    isNotFound,
    isInterviewsLoading,
  } = useApplicationDetailContainer({
    applicationId,
    withInterviews: search.tab === "interviews",
  });
  return (
    <ApplicationDetailComponent
      detail={detail}
      interviews={interviews}
      isApplicationPending={isApplicationPending}
      isApplicationRefetching={isApplicationRefetching}
      isNotFound={isNotFound}
      isInterviewsLoading={isInterviewsLoading}
      search={search}
    />
  );
}
