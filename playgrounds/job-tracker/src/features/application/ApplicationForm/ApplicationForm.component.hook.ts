import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ApplicationDetail, CreateApplicationInput } from "@api/Application.api";
import type { Company } from "@api/Company.api";
import { applicationFormSchema, type ApplicationFormValues } from "./ApplicationForm.schema";

export interface ApplicationFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string | undefined;
}

// The company field: a button that opens a searchable list of candidates
export interface ApplicationFormCompanyPicker {
  ref: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  chosenName: string | undefined;
  search: string;
  toggle: () => void;
  changeSearch: (search: string) => void;
  choose: (company: Company) => void;
  error: string | undefined;
}

export interface ApplicationFormComponentParams {
  setCompanyQuery: (q: string) => void;
  addApplication: (input: CreateApplicationInput) => Promise<ApplicationDetail>;
  onSaved: (application: ApplicationDetail) => void;
}

export interface ApplicationFormComponentState {
  companyPicker: ApplicationFormCompanyPicker;
  positionField: ApplicationFormField;
  appliedAtField: ApplicationFormField;
  notesField: ApplicationFormField;
  isValid: boolean;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
}

export function useApplicationFormComponent({
  setCompanyQuery,
  addApplication,
  onSaved,
}: ApplicationFormComponentParams): ApplicationFormComponentState {
  const {
    control,
    handleSubmit: rhfHandleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    mode: "onChange",
    defaultValues: { companyId: "", position: "", appliedAt: "", notes: "" },
  });

  const companyId = useController({ name: "companyId", control });

  const position = useController({ name: "position", control });
  const positionField: ApplicationFormField = {
    value: position.field.value,
    onChange: (value) => position.field.onChange(value),
    onBlur: position.field.onBlur,
    error: position.fieldState.error?.message,
  };

  const appliedAt = useController({ name: "appliedAt", control });
  const appliedAtField: ApplicationFormField = {
    value: appliedAt.field.value,
    onChange: (value) => appliedAt.field.onChange(value),
    onBlur: appliedAt.field.onBlur,
    error: appliedAt.fieldState.error?.message,
  };

  const notes = useController({ name: "notes", control });
  const notesField: ApplicationFormField = {
    value: notes.field.value,
    onChange: (value) => notes.field.onChange(value),
    onBlur: notes.field.onBlur,
    error: notes.fieldState.error?.message,
  };

  // The picker's own UI state. The search box is typed here; the keyword the
  // server is asked for is the Container's, so both are cleared on close.
  const pickerRef = useRef<HTMLDivElement>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [chosenCompanyName, setChosenCompanyName] = useState<string>();

  const closePicker = useCallback(() => {
    setIsPickerOpen(false);
    setCompanySearch("");
    setCompanyQuery("");
  }, [setCompanyQuery]);

  // A press anywhere outside the open picker closes it.
  useEffect(() => {
    if (!isPickerOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) closePicker();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isPickerOpen, closePicker]);

  const companyPicker: ApplicationFormCompanyPicker = {
    ref: pickerRef,
    isOpen: isPickerOpen,
    chosenName: chosenCompanyName,
    search: companySearch,
    toggle: () => (isPickerOpen ? closePicker() : setIsPickerOpen(true)),
    changeSearch: (search) => {
      setCompanySearch(search);
      setCompanyQuery(search);
    },
    choose: (company) => {
      companyId.field.onChange(company.id);
      setChosenCompanyName(company.name);
      closePicker();
    },
    error: companyId.fieldState.error?.message,
  };

  const onSubmit = useCallback(
    async (values: ApplicationFormValues) => {
      const created = await addApplication(values);
      onSaved(created);
    },
    [addApplication, onSaved],
  );

  return {
    companyPicker,
    positionField,
    appliedAtField,
    notesField,
    isValid,
    isSubmitting,
    handleSubmit: rhfHandleSubmit(onSubmit),
  };
}
