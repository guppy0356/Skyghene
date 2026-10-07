import type {
  ApplicationDetail,
  ApplicationInterview,
  ApplicationStatus,
} from "@api/Application.api";

export interface ApplicationDetailHeadline {
  title: string;
  status: ApplicationStatus;
  statusLabel: string;
  applied: string;
  salary: string;
  notes: string;
}

export interface ApplicationDetailInterview {
  id: string;
  kind: string;
  byline: string;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  offer: "Offer received",
  rejected: "Rejected",
};

const KIND_LABELS: Record<ApplicationInterview["kind"], string> = {
  phone: "Phone screen",
  video: "Video call",
  onsite: "On-site",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-09-01" (or the date part of an instant) → "Sep 1, 2026"
const toDisplayDate = (iso: string) =>
  `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}, ${iso.slice(0, 4)}`;

export function toApplicationDetailHeadline(application: ApplicationDetail): ApplicationDetailHeadline {
  return {
    title: `${application.position} at ${application.companyName}`,
    status: application.status,
    statusLabel: STATUS_LABELS[application.status],
    applied: `Applied ${toDisplayDate(application.appliedAt)}`,
    salary: `Salary: ${application.salary ?? "Not disclosed"}`,
    notes: application.notes === "" ? "No notes yet" : application.notes,
  };
}

export function toApplicationDetailInterview(interview: ApplicationInterview): ApplicationDetailInterview {
  return {
    id: interview.id,
    kind: KIND_LABELS[interview.kind],
    // The instant stays in UTC, as the API sends it ("…T09:30:00Z").
    byline: `${toDisplayDate(interview.scheduledAt)} ${interview.scheduledAt.slice(11, 16)} UTC · ${interview.interviewer}`,
  };
}
