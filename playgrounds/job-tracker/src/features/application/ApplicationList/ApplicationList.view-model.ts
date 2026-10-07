import type { ApplicationSort, ApplicationStatus, ApplicationSummary } from "@api/Application.api";

export interface ApplicationListRow {
  id: string;
  position: string;
  byline: string;
  status: ApplicationStatus;
  statusLabel: string;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

// Offered by the status filter and by each row's status select.
export const STATUS_OPTIONS = (
  Object.entries(STATUS_LABELS) as [ApplicationStatus, string][]
).map(([value, label]) => ({ value, label }));

const SORT_LABELS: Record<ApplicationSort, string> = {
  "-appliedAt": "Newest first",
  appliedAt: "Oldest first",
  company: "Company A–Z",
};

export const SORT_OPTIONS = (
  Object.entries(SORT_LABELS) as [ApplicationSort, string][]
).map(([value, label]) => ({ value, label }));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-09-01" → "Sep 1, 2026"
const toDisplayDate = (date: string) =>
  `${MONTHS[Number(date.slice(5, 7)) - 1]} ${Number(date.slice(8, 10))}, ${date.slice(0, 4)}`;

export function toApplicationListRow(application: ApplicationSummary): ApplicationListRow {
  return {
    id: application.id,
    position: application.position,
    byline: `${application.companyName} · applied ${toDisplayDate(application.appliedAt)}`,
    status: application.status,
    statusLabel: STATUS_LABELS[application.status],
  };
}
