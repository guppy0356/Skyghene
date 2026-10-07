import { useApplicationFormContainer } from "./ApplicationForm.container.hook";
import { ApplicationFormComponent } from "./ApplicationForm.component";

export function ApplicationFormContainer() {
  const { companies, isCompaniesLoading, setCompanyQuery, addApplication } =
    useApplicationFormContainer();
  return (
    <ApplicationFormComponent
      companies={companies}
      isCompaniesLoading={isCompaniesLoading}
      setCompanyQuery={setCompanyQuery}
      addApplication={addApplication}
    />
  );
}
