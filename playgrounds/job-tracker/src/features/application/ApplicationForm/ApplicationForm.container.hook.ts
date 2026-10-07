import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applicationApi,
  type ApplicationDetail,
  type CreateApplicationInput,
} from "@api/Application.api";
import { applicationQueries } from "@api/Application.queries";
import type { Company } from "@api/Company.api";
import { companyQueries } from "@api/Company.queries";

export interface ApplicationFormContainerState {
  companies: Company[];
  isCompaniesLoading: boolean;
  setCompanyQuery: (q: string) => void;
  addApplication: (input: CreateApplicationInput) => Promise<ApplicationDetail>;
}

export function useApplicationFormContainer(): ApplicationFormContainerState {
  const queryClient = useQueryClient();
  // query input deliberately kept out of the URL: the typeahead keyword
  const [companyQuery, setCompanyQuery] = useState("");
  const companiesQuery = useQuery({
    ...companyQueries.list({ q: companyQuery }),
    enabled: companyQuery !== "",
  });

  const addMutation = useMutation({
    mutationFn: (input: CreateApplicationInput) => applicationApi.create(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: applicationQueries.lists() });
    },
  });

  const addApplication = useCallback(
    (input: CreateApplicationInput) => addMutation.mutateAsync(input),
    [addMutation.mutateAsync],
  );

  return {
    companies: companiesQuery.data ?? [],
    isCompaniesLoading: companiesQuery.isLoading,
    setCompanyQuery,
    addApplication,
  };
}
