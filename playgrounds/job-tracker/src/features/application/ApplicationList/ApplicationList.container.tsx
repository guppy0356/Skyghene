import { useSearch } from "@tanstack/react-router";
import { useApplicationListContainer } from "./ApplicationList.container.hook";
import { ApplicationListComponent } from "./ApplicationList.component";

export function ApplicationListContainer() {
  const search = useSearch({ from: "/applications" });
  const {
    applications,
    totalPages,
    isPending,
    isRefetching,
    updateApplication,
    deleteApplication,
  } = useApplicationListContainer({ params: search });
  return (
    <ApplicationListComponent
      applications={applications}
      totalPages={totalPages}
      isPending={isPending}
      isRefetching={isRefetching}
      updateApplication={updateApplication}
      deleteApplication={deleteApplication}
      search={search}
    />
  );
}
