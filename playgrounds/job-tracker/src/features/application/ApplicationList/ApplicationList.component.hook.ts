import { useCallback, useMemo } from "react";
import type { ApplicationSort, ApplicationStatus, ApplicationSummary } from "@api/Application.api";
import type { ApplicationListSearch } from "./ApplicationList.search";
import { toApplicationListRow, type ApplicationListRow } from "./ApplicationList.view-model";

export interface ApplicationListComponentParams {
  applications: ApplicationSummary[];
  totalPages: number;
  search: ApplicationListSearch;
  applySearch: (next: ApplicationListSearch) => void;
}

export interface ApplicationListComponentState {
  rows: ApplicationListRow[];
  toggleStatus: (status: ApplicationStatus) => void;
  changeSort: (sort: ApplicationSort) => void;
  previousPageSearch: ApplicationListSearch | undefined;
  nextPageSearch: ApplicationListSearch | undefined;
}

export function useApplicationListComponent({
  applications,
  totalPages,
  search,
  applySearch,
}: ApplicationListComponentParams): ApplicationListComponentState {
  const rows = useMemo(() => applications.map(toApplicationListRow), [applications]);

  const toggleStatus = useCallback(
    (status: ApplicationStatus) => {
      const next = search.status.includes(status)
        ? search.status.filter((s) => s !== status)
        : [...search.status, status];
      applySearch({ ...search, status: next, page: 1 });
    },
    [search, applySearch],
  );

  const changeSort = useCallback(
    (sort: ApplicationSort) => applySearch({ ...search, sort, page: 1 }),
    [search, applySearch],
  );

  const previousPageSearch = useMemo(
    () => (search.page > 1 ? { ...search, page: search.page - 1 } : undefined),
    [search],
  );
  const nextPageSearch = useMemo(
    () => (search.page < totalPages ? { ...search, page: search.page + 1 } : undefined),
    [search, totalPages],
  );

  return { rows, toggleStatus, changeSort, previousPageSearch, nextPageSearch };
}
