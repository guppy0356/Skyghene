import { api } from "../lib/api-client";
import {
  ApplicationSort,
  ApplicationStatus,
  type ApplicationDetail,
  type ApplicationPage,
  type ApplicationSummary,
  type CreateApplicationInput,
  type get_ListApplications,
  type Interview as ApplicationInterview,
  type UpdateApplicationInput,
} from "../lib/api.gen";

export type {
  ApplicationSummary,
  ApplicationDetail,
  ApplicationPage,
  ApplicationStatus,
  ApplicationSort,
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationInterview,
};

// A query-parameter type is generated onto the endpoint, not among the schemas.
export type ApplicationListParams = NonNullable<get_ListApplications["parameters"]["query"]>;

// The members, read off the generated zod enums rather than typed out again.
export const APPLICATION_STATUSES: readonly ApplicationStatus[] = ApplicationStatus.options;
export const APPLICATION_SORTS: readonly ApplicationSort[] = ApplicationSort.options;

export const applicationApi = {
  getList: (params: ApplicationListParams): Promise<ApplicationPage> =>
    api.get("/api/applications", { query: params }),
  getDetail: (id: string): Promise<ApplicationDetail> =>
    api.get("/api/applications/{applicationId}", { path: { applicationId: id } }),
  create: (input: CreateApplicationInput): Promise<ApplicationDetail> =>
    api.post("/api/applications", { body: input }),
  update: (id: string, input: UpdateApplicationInput): Promise<ApplicationDetail> =>
    api.patch("/api/applications/{applicationId}", { path: { applicationId: id }, body: input }),
  delete: (id: string): Promise<void> =>
    api.delete("/api/applications/{applicationId}", { path: { applicationId: id } }),
  getInterviews: (id: string): Promise<ApplicationInterview[]> =>
    api.get("/api/applications/{applicationId}/interviews", { path: { applicationId: id } }),
};
