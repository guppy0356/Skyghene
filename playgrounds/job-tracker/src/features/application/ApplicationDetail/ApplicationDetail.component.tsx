import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type {
  ApplicationDetail,
  ApplicationInterview,
  ApplicationStatus,
} from "@api/Application.api";
import type { ApplicationDetailContainerState } from "./ApplicationDetail.container.hook";
import type { ApplicationDetailSearch } from "./ApplicationDetail.search";
import { useApplicationDetailComponent } from "./ApplicationDetail.component.hook";

export interface ApplicationDetailComponentProps extends ApplicationDetailContainerState {
  search: ApplicationDetailSearch;
}

const STATUS_TONES: Record<ApplicationStatus, string> = {
  applied: "bg-gray-100 text-gray-700",
  screening: "bg-blue-100 text-blue-800",
  interviewing: "bg-amber-100 text-amber-800",
  offer: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

// Placeholder for the interviews pane alone: the record and the tabs stay on screen
function ApplicationInterviewsSkeleton() {
  return (
    <ul className="space-y-2">
      {[0, 1].map((i) => (
        <li key={i} className="rounded border p-2">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

// Private memo'd body: owns the tabs, so the interviews' own loading flag comes in here
const ApplicationTabs = memo(function ApplicationTabs({
  detail,
  interviews,
  isInterviewsLoading,
  tab,
}: {
  detail: ApplicationDetail;
  interviews: ApplicationInterview[];
  isInterviewsLoading: boolean;
  tab: ApplicationDetailSearch["tab"];
}) {
  const { headline, interviewItems } = useApplicationDetailComponent({ detail, interviews });
  return (
    <article className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">{headline.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className={`rounded px-2 py-0.5 text-xs ${STATUS_TONES[headline.status]}`}>
            {headline.statusLabel}
          </span>
          <span>{headline.applied}</span>
          <span>{headline.salary}</span>
        </div>
      </header>
      <nav className="flex gap-2 border-b">
        <Link
          to="/applications/$applicationId"
          params={{ applicationId: detail.id }}
          search={{ tab: "overview" }}
          replace
          activeOptions={{ exact: true }}
          activeProps={{ className: "border-b-2 border-blue-500 font-semibold" }}
          className="px-3 py-2"
        >
          Overview
        </Link>
        <Link
          to="/applications/$applicationId"
          params={{ applicationId: detail.id }}
          search={{ tab: "interviews" }}
          replace
          activeOptions={{ exact: true }}
          activeProps={{ className: "border-b-2 border-blue-500 font-semibold" }}
          className="px-3 py-2"
        >
          Interviews
        </Link>
      </nav>
      {tab === "overview" ? (
        <p className="whitespace-pre-line">{headline.notes}</p>
      ) : isInterviewsLoading ? (
        <ApplicationInterviewsSkeleton />
      ) : interviewItems.length === 0 ? (
        <p className="text-gray-600">No interviews scheduled.</p>
      ) : (
        <ul className="space-y-2">
          {interviewItems.map((interview) => (
            <li key={interview.id} className="rounded border p-2">
              <p className="font-medium">{interview.kind}</p>
              <p className="text-sm text-gray-600">{interview.byline}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
});

// Private Skeleton: page-level, standing in for the whole record
function ApplicationDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-64 animate-pulse rounded bg-gray-200" />
      <div className="h-5 w-80 animate-pulse rounded bg-gray-200" />
      <div className="h-9 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-16 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

export function ApplicationDetailComponent({
  detail,
  interviews,
  isApplicationPending,
  isApplicationRefetching,
  isNotFound,
  isInterviewsLoading,
  search,
}: ApplicationDetailComponentProps) {
  return (
    <div className="space-y-4">
      <Link to="/applications" className="text-sm text-blue-700 hover:underline">
        All applications
      </Link>
      {isNotFound ? (
        <p>This application does not exist.</p>
      ) : isApplicationPending || detail === undefined ? (
        <ApplicationDetailSkeleton />
      ) : (
        <div className={`transition-opacity ${isApplicationRefetching ? "opacity-50" : ""}`}>
          <ApplicationTabs
            detail={detail}
            interviews={interviews}
            isInterviewsLoading={isInterviewsLoading}
            tab={search.tab}
          />
        </div>
      )}
    </div>
  );
}
