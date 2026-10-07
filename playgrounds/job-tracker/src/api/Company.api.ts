import { api } from "../lib/api-client";
import type { Company, get_SearchCompanies } from "../lib/api.gen";

export type { Company };

// A query-parameter type is generated onto the endpoint, not among the schemas.
export type CompanyListParams = NonNullable<get_SearchCompanies["parameters"]["query"]>;

export const companyApi = {
  getList: (params: CompanyListParams): Promise<Company[]> =>
    api.get("/api/companies", { query: params }),
};
