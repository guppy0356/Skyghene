import { memo, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ApplicationSort, ApplicationStatus } from "@api/Application.api";
import type { ApplicationListContainerState } from "./ApplicationList.container.hook";
import type { ApplicationListSearch } from "./ApplicationList.search";
import { useApplicationListComponent } from "./ApplicationList.component.hook";
import { SORT_OPTIONS, STATUS_OPTIONS, type ApplicationListRow } from "./ApplicationList.view-model";

export interface ApplicationListComponentProps extends ApplicationListContainerState {
  search: ApplicationListSearch;
}

const STATUS_TONES: Record<ApplicationStatus, string> = {
  applied: "bg-gray-100 text-gray-700",
  screening: "bg-blue-100 text-blue-800",
  interviewing: "bg-amber-100 text-amber-800",
  offer: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

// Private memo'd body: a pure view over the finished rows; the row actions are the Container's
const ApplicationRows = memo(function ApplicationRows({
  rows,
  updateApplication,
  deleteApplication,
}: {
  rows: ApplicationListRow[];
  updateApplication: ApplicationListContainerState["updateApplication"];
  deleteApplication: ApplicationListContainerState["deleteApplication"];
}) {
  if (rows.length === 0) return <p className="text-gray-600">No applications match.</p>;
  return (
    <ul className="divide-y rounded border">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center gap-4 p-2">
          <div className="flex-1">
            <Link
              to="/applications/$applicationId"
              params={{ applicationId: row.id }}
              className="font-medium hover:underline"
            >
              {row.position}
            </Link>
            <p className="text-sm text-gray-600">{row.byline}</p>
          </div>
          <span className={`rounded px-2 py-0.5 text-xs ${STATUS_TONES[row.status]}`}>
            {row.statusLabel}
          </span>
          <select
            aria-label="Status"
            value={row.status}
            onChange={(e) =>
              updateApplication(row.id, { status: e.target.value as ApplicationStatus })
            }
            className="rounded border px-2 py-1 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => deleteApplication(row.id)}
            className="rounded border px-2 py-1 text-sm text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
});

// Private Skeleton: the same <ul>, with placeholder rows
function ApplicationRowsSkeleton() {
  return (
    <ul className="divide-y rounded border">
      {[0, 1, 2].map((i) => (
        <li key={i} className="p-2">
          <div className="h-5 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mt-1 h-4 w-48 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

export function ApplicationListComponent({
  applications,
  totalPages,
  isPending,
  isRefetching,
  updateApplication,
  deleteApplication,
  search,
}: ApplicationListComponentProps) {
  const navigate = useNavigate();
  const applySearch = useCallback(
    (next: ApplicationListSearch) => navigate({ to: "/applications", search: next }),
    [navigate],
  );
  const { rows, toggleStatus, changeSort, previousPageSearch, nextPageSearch } =
    useApplicationListComponent({ applications, totalPages, search, applySearch });

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Applications</h1>
        <Link to="/applications/new" className="rounded bg-blue-600 px-3 py-1.5 text-white">
          New application
        </Link>
      </header>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <fieldset className="flex flex-wrap gap-4">
          <legend className="sr-only">Status</legend>
          {STATUS_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={search.status.includes(option.value)}
                onChange={() => toggleStatus(option.value)}
              />
              {option.label}
            </label>
          ))}
        </fieldset>
        <label className="flex items-center gap-2">
          Sort
          <select
            value={search.sort}
            onChange={(e) => changeSort(e.target.value as ApplicationSort)}
            className="rounded border px-2 py-1"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}>
        {isPending ? (
          <ApplicationRowsSkeleton />
        ) : (
          <ApplicationRows
            rows={rows}
            updateApplication={updateApplication}
            deleteApplication={deleteApplication}
          />
        )}
      </div>
      <nav className="flex items-center gap-4">
        {previousPageSearch ? (
          <Link to="/applications" search={previousPageSearch} className="hover:underline">
            Previous
          </Link>
        ) : (
          <span aria-disabled="true" className="text-gray-400">
            Previous
          </span>
        )}
        <span>
          Page {search.page} of {totalPages}
        </span>
        {nextPageSearch ? (
          <Link to="/applications" search={nextPageSearch} className="hover:underline">
            Next
          </Link>
        ) : (
          <span aria-disabled="true" className="text-gray-400">
            Next
          </span>
        )}
      </nav>
    </section>
  );
}
