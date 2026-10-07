import { queryOptions } from "@tanstack/react-query";
import { companyApi, type CompanyListParams } from "./Company.api";

// Nothing writes to companies, so there is no lists() prefix to invalidate at.
// No keepPreviousData: the one reader is a typeahead that shows "Searching…" for each new term.
export const companyQueries = {
  list: (params: CompanyListParams) =>
    queryOptions({
      queryKey: ["companies", "list", params],
      queryFn: () => companyApi.getList(params),
    }),
};
