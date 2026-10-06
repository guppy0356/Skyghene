import ky, { HTTPError } from "ky";
import { createApiClient, type Fetcher } from "./api.gen";

// ky's status-code retry only runs while it throws, so HTTPError is caught
// *after* the retries and handed back as a response. `error.response` cannot
// be handed back as-is: ky consumed its body to populate `error.data`, so the
// error body is re-serialized into a fresh Response.
const fetcher: Fetcher = {
  fetch: async ({ url, method, urlSearchParams, parameters, requestFormat, overrides }) => {
    try {
      return await ky(url, {
        method,
        searchParams: urlSearchParams,
        ...(requestFormat === "json" && parameters?.body !== undefined
          ? { json: parameters.body }
          : {}),
        ...overrides,
      });
    } catch (error) {
      if (error instanceof HTTPError) {
        const { response } = error;
        const body =
          error.data === undefined
            ? null
            : typeof error.data === "string"
              ? error.data
              : JSON.stringify(error.data);
        return new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
      throw error;
    }
  },
};

// The client resolves paths against an absolute base URL. Input validation
// stays off: request shapes are TS-owned end to end, and zod input parsing
// would rewrite them (a defaulted contract param gets injected into the
// query string).
export const api = createApiClient(fetcher, window.location.origin, {
  validate: "output",
});

export { TypedStatusError } from "./api.gen";
