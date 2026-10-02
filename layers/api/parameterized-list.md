# api / parameterized-list

When: a resource whose list endpoint takes query parameters (filter, sort, page), with nothing nested under its records.

## Good

```ts
// src/api/Incident.api.ts
import { api } from "../lib/api-client";
import {
  IncidentSeverity,
  IncidentSort,
  IncidentStatus,
  type get__api_incidents,
  type Incident,
  type IncidentPage,
} from "../lib/api.gen";

export type { Incident, IncidentPage, IncidentSeverity, IncidentSort, IncidentStatus };

// A query-parameter type is generated onto the endpoint, not among the schemas.
export type IncidentListParams = NonNullable<
  get__api_incidents["parameters"]["query"]
>;

// The members, read off the generated zod enums rather than typed out again.
export const INCIDENT_STATUSES: readonly IncidentStatus[] = IncidentStatus.options;
export const INCIDENT_SEVERITIES: readonly IncidentSeverity[] = IncidentSeverity.options;
export const INCIDENT_SORTS: readonly IncidentSort[] = IncidentSort.options;

export const incidentApi = {
  getList: (params: IncidentListParams): Promise<IncidentPage> =>
    api.get("/api/incidents", { query: params }),
  getDetail: (id: string): Promise<Incident> =>
    api.get("/api/incidents/{incidentId}", { path: { incidentId: id } }),
};
```

Why:

- `IncidentListParams` is declared here, beside the response types, because this file's
  `getList` is what takes it. The query key, the container hook's param and the URL
  schema's `satisfies` all import it from here, so one shape runs from the Container to
  the request.
- The type is read off the generated endpoint (`get__api_incidents["parameters"]["query"]`),
  not written by hand, so a parameter renamed in the contract is a type error everywhere
  the params travel.
- `params` goes to the client as `query` untouched. The generated encoder owns the wire
  shape and writes `status: ["open", "resolved"]` as `status=open&status=resolved`.
- The enum arrays come from the generated zod enums' `.options`, renamed here like the
  types, so the URL schema and any checkbox list take their members from `@api`.
- The response is `IncidentPage` as the contract names it. Totals and pages are the
  server's word; nothing here reshapes them for a screen.

## Usage

The code that uses this facade, down to the line where each value is used.

```ts
// src/api/Incident.queries.ts — the params type keys the list and reaches getList unchanged
list: (params: IncidentListParams) =>
  queryOptions({
    queryKey: [...incidentQueries.lists(), params],
    queryFn: () => incidentApi.getList(params),
    placeholderData: keepPreviousData,
  }),

// IncidentList.search.ts — the URL schema is pinned to the same type and reads the members
const incidentListSearchSchema = z.object({
  status: z
    .array(z.enum(INCIDENT_STATUSES))
    .default(incidentListSearchDefaults.status)
    .catch(incidentListSearchDefaults.status),
  // severity, sort and page likewise
}) satisfies z.ZodType<IncidentListParams, unknown>;
```

## Bad: the params type is written by hand

```ts
export interface IncidentListParams {
  status?: string[];
  severity?: string;
  sort?: string;
  page?: number;
}
```

Why: A second copy of the contract that nothing checks, so a renamed or retyped parameter
compiles and is sent wrong. Take the type off the generated endpoint, so the contract
enters the app in this one file.

## Bad: the query string is encoded here

```ts
  getList: (params: IncidentListParams): Promise<IncidentPage> =>
    api.get("/api/incidents", {
      query: { ...params, status: params.status?.join(",") },
    }),
```

Why: The params are reshaped in transit, and the wire format becomes this file's
invention instead of the contract's. Hand the parsed object over as it is; the client's
encoder writes each array element as a repeated key.

## Bad: the enum members are typed out

```ts
export const INCIDENT_STATUSES = ["open", "acknowledged", "resolved"] as const;
```

Why: A status added to the contract never reaches this array, so the filter silently
offers one too few. The generated zod enum already carries the members as `.options`.
