import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ApplicationDetail } from "@api/Application.api";
import type { ApplicationFormContainerState } from "./ApplicationForm.container.hook";
import { useApplicationFormComponent } from "./ApplicationForm.component.hook";

export function ApplicationFormComponent({
  companies,
  isCompaniesLoading,
  setCompanyQuery,
  addApplication,
}: ApplicationFormContainerState) {
  const navigate = useNavigate();
  const onSaved = useCallback(
    (application: ApplicationDetail) =>
      navigate({
        to: "/applications/$applicationId",
        params: { applicationId: application.id },
      }),
    [navigate],
  );
  const {
    companyPicker,
    positionField,
    appliedAtField,
    notesField,
    isValid,
    isSubmitting,
    handleSubmit,
  } = useApplicationFormComponent({ setCompanyQuery, addApplication, onSaved });

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">New application</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <span className="text-sm font-medium">Company</span>
          <div ref={companyPicker.ref} className="relative mt-1">
            <button
              type="button"
              aria-expanded={companyPicker.isOpen}
              onClick={companyPicker.toggle}
              className="w-full rounded border px-3 py-2 text-left"
            >
              {companyPicker.chosenName ?? "Choose a company"}
            </button>
            {companyPicker.isOpen && (
              <div className="absolute z-10 mt-1 w-full space-y-1 rounded border bg-white p-2 shadow">
                <input
                  type="search"
                  aria-label="Search companies"
                  placeholder="Search companies"
                  autoFocus
                  value={companyPicker.search}
                  onChange={(e) => companyPicker.changeSearch(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                />
                {companyPicker.search === "" ? (
                  <p className="px-3 py-1.5 text-sm text-gray-600">Type to search</p>
                ) : isCompaniesLoading ? (
                  <p className="px-3 py-1.5 text-sm text-gray-600">Searching…</p>
                ) : companies.length === 0 ? (
                  <p className="px-3 py-1.5 text-sm text-gray-600">No companies match</p>
                ) : (
                  <ul className="max-h-60 overflow-auto">
                    {companies.map((company) => (
                      <li key={company.id}>
                        <button
                          type="button"
                          onClick={() => companyPicker.choose(company)}
                          className="w-full rounded px-3 py-1.5 text-left hover:bg-gray-100"
                        >
                          {company.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
        {companyPicker.error && <p className="text-sm text-red-600">{companyPicker.error}</p>}
        <label className="block">
          <span className="text-sm font-medium">Position</span>
          <input
            type="text"
            value={positionField.value}
            onChange={(e) => positionField.onChange(e.target.value)}
            onBlur={positionField.onBlur}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        {positionField.error && <p className="text-sm text-red-600">{positionField.error}</p>}
        <label className="block">
          <span className="text-sm font-medium">Applied on</span>
          <input
            type="date"
            value={appliedAtField.value}
            onChange={(e) => appliedAtField.onChange(e.target.value)}
            onBlur={appliedAtField.onBlur}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        {appliedAtField.error && <p className="text-sm text-red-600">{appliedAtField.error}</p>}
        <label className="block">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            rows={4}
            value={notesField.value}
            onChange={(e) => notesField.onChange(e.target.value)}
            onBlur={notesField.onBlur}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Save application"}
        </button>
      </form>
    </section>
  );
}
