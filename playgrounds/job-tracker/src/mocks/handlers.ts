import { delay } from "msw";
import type { ApplicationDetail, ApplicationStatus, Company, Interview } from "../lib/api.gen";
import { http } from "./typed-http";

// Dev seed: what you see in the browser while building. Never a test fixture —
// tests register their own responses on the test worker.

const companies: Company[] = [
  { id: "c1", name: "Acme" },
  { id: "c2", name: "Globex" },
  { id: "c3", name: "Initech" },
  { id: "c4", name: "Umbrella" },
  { id: "c5", name: "Hooli" },
  { id: "c6", name: "Stark Industries" },
  { id: "c7", name: "Wayne Enterprises" },
  { id: "c8", name: "Wonka" },
];

const STATUSES: ApplicationStatus[] = ["applied", "screening", "interviewing", "offer", "rejected"];
const POSITIONS = ["Frontend Engineer", "Product Engineer", "Staff Engineer", "Design Engineer", "Platform Engineer"];

let applications: ApplicationDetail[] = Array.from({ length: 23 }, (_, i) => {
  const company = companies[i % companies.length];
  const day = String(1 + ((i * 7) % 28)).padStart(2, "0");
  const month = i < 12 ? "09" : "08";
  return {
    id: `a${i + 1}`,
    companyId: company.id,
    companyName: company.name,
    position: POSITIONS[i % POSITIONS.length],
    status: STATUSES[(i * 3) % STATUSES.length],
    appliedAt: `2026-${month}-${day}`,
    ...(i % 3 === 0 ? { salary: "¥8,000,000 – ¥10,000,000" } : {}),
    notes: i % 4 === 0 ? "Referred by a former colleague.\nTake-home due next Friday." : "",
  };
});

const interviews: Record<string, Interview[]> = {
  a1: [
    { id: "i1", kind: "phone", scheduledAt: "2026-09-08T09:30:00Z", interviewer: "Dana" },
    { id: "i2", kind: "video", scheduledAt: "2026-10-14T10:00:00Z", interviewer: "Lee" },
  ],
  a3: [{ id: "i3", kind: "onsite", scheduledAt: "2026-10-20T13:00:00Z", interviewer: "Morgan" }],
};

let nextId = applications.length + 1;
const PAGE_SIZE = 10;

const toSummary = ({ id, companyName, position, status, appliedAt }: ApplicationDetail) => ({
  id,
  companyName,
  position,
  status,
  appliedAt,
});

export const handlers = [
  http.get("/api/applications", async ({ request, response }) => {
    await delay(600);
    const url = new URL(request.url);
    const statuses = url.searchParams.getAll("status");
    const sort = url.searchParams.get("sort") ?? "-appliedAt";
    const page = Number(url.searchParams.get("page") ?? "1");

    const filtered = applications
      .filter((a) => statuses.length === 0 || statuses.includes(a.status))
      .sort((a, b) =>
        sort === "company"
          ? a.companyName.localeCompare(b.companyName)
          : sort === "appliedAt"
            ? a.appliedAt.localeCompare(b.appliedAt)
            : b.appliedAt.localeCompare(a.appliedAt),
      );
    const start = (page - 1) * PAGE_SIZE;
    return response(200).json({
      items: filtered.slice(start, start + PAGE_SIZE).map(toSummary),
      total: filtered.length,
      pageSize: PAGE_SIZE,
    });
  }),

  http.post("/api/applications", async ({ request, response }) => {
    await delay(400);
    const body = await request.json();
    const company = companies.find((c) => c.id === body.companyId);
    const created: ApplicationDetail = {
      id: `a${nextId++}`,
      companyId: body.companyId,
      companyName: company?.name ?? "Unknown company",
      position: body.position,
      status: "applied",
      appliedAt: body.appliedAt,
      ...(body.salary ? { salary: body.salary } : {}),
      notes: body.notes ?? "",
    };
    applications = [created, ...applications];
    return response(201).json(created);
  }),

  http.get("/api/applications/{applicationId}", async ({ params, response }) => {
    await delay(400);
    const found = applications.find((a) => a.id === params.applicationId);
    return found ? response(200).json(found) : response(404).empty();
  }),

  http.patch("/api/applications/{applicationId}", async ({ params, request, response }) => {
    await delay(400);
    const body = await request.json();
    const index = applications.findIndex((a) => a.id === params.applicationId);
    if (index === -1) return response(404).empty();
    applications[index] = { ...applications[index], status: body.status };
    return response(200).json(applications[index]);
  }),

  http.delete("/api/applications/{applicationId}", async ({ params, response }) => {
    await delay(400);
    if (!applications.some((a) => a.id === params.applicationId)) return response(404).empty();
    applications = applications.filter((a) => a.id !== params.applicationId);
    return response(204).empty();
  }),

  http.get("/api/applications/{applicationId}/interviews", async ({ params, response }) => {
    await delay(600);
    if (!applications.some((a) => a.id === params.applicationId)) return response(404).empty();
    return response(200).json(interviews[params.applicationId] ?? []);
  }),

  http.get("/api/companies", async ({ request, response }) => {
    await delay(300);
    const q = (new URL(request.url).searchParams.get("q") ?? "").toLowerCase();
    return response(200).json(companies.filter((c) => c.name.toLowerCase().includes(q)));
  }),
];
