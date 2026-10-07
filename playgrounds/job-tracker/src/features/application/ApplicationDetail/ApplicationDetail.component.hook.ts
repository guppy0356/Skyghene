import { useMemo } from "react";
import type { ApplicationDetail, ApplicationInterview } from "@api/Application.api";
import {
  toApplicationDetailHeadline,
  toApplicationDetailInterview,
  type ApplicationDetailHeadline,
  type ApplicationDetailInterview,
} from "./ApplicationDetail.view-model";

export interface ApplicationDetailComponentParams {
  detail: ApplicationDetail;
  interviews: ApplicationInterview[];
}

export interface ApplicationDetailComponentState {
  headline: ApplicationDetailHeadline;
  interviewItems: ApplicationDetailInterview[];
}

export function useApplicationDetailComponent({
  detail,
  interviews,
}: ApplicationDetailComponentParams): ApplicationDetailComponentState {
  const headline = useMemo(() => toApplicationDetailHeadline(detail), [detail]);
  const interviewItems = useMemo(
    () => interviews.map(toApplicationDetailInterview),
    [interviews],
  );
  return { headline, interviewItems };
}
