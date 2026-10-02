# api / api-client

When: once per app, `src/lib/api-client.ts`, the client every `{Resource}.api.ts` calls through.

## Good

```ts
// src/lib/api-client.ts
import ky, { HTTPError } from "ky";
import { createApiClient, type Fetcher } from "./api.gen";

// ky's status-code retry only runs while it throws, so HTTPError is caught
// after the retries and handed back as a response. error.response cannot be
// handed back as it is: ky consumed its body to populate error.data, so the
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

// Input validation stays off: request shapes are TS-owned end to end, and zod
// input parsing would rewrite them (a defaulted contract param gets injected
// into the query string).
export const api = createApiClient(fetcher, window.location.origin, {
  validate: "output",
});

export { TypedStatusError } from "./api.gen";
```

Why:

- `createApiClient` comes from the generated `api.gen.ts`, so the binding from each
  endpoint to its response schema is generated, not passed by hand at each call site.
- `validate: "output"` parses every success response against the contract and leaves
  requests alone. Input validation would apply contract defaults and change the query
  string.
- ky is only the transport: it keeps its documented retry and timeout, and call sites
  never see it. Throwing stays on, because ky's status retry runs only inside it.
- `HTTPError` is turned back into a `Response` with the body rebuilt from `error.data`.
  The generated client then throws its own `TypedStatusError` for any non-2xx.
- `TypedStatusError` is re-exported here, so container hooks import the error from the
  same module as the client and never touch `api.gen.ts`.

## Usage

The code that uses this module, down to the line where each value is used.

```ts
// src/api/Todo.api.ts — every request goes through api
export const todoApi = {
  getDetail: (id: string): Promise<Todo> =>
    api.get("/api/todos/{todoId}", { path: { todoId: id } }),
};

// TodoDetail.container.hook.ts — the error class is read here and nowhere else
export function useTodoDetailContainer({ todoId }: TodoDetailContainerParams): TodoDetailContainerState {
  const { data, isPending, isRefetching, error } = useQuery(todoQueries.detail(todoId));
  return {
    detail: data,
    isPending,
    isRefetching,
    isNotFound: error instanceof TypedStatusError && error.status === 404,
  };
}
```

## Bad: requests are validated too

```ts
export const api = createApiClient(fetcher, window.location.origin, {
  validate: "both",
});
```

Why: Input parsing applies the contract's defaults, so a `default: 1` page is injected
into every list request. Request shapes are already checked by TypeScript; validate
`"output"` only.

## Bad: ky is told not to throw

```ts
      return await ky(url, {
        method,
        searchParams: urlSearchParams,
        throwHttpErrors: false,
        ...overrides,
      });
```

Why: ky's status-code retry sits inside its throwing branch, so every retry is silently
lost. Keep throwing on and catch `HTTPError` after the retries.

## Bad: the error response is handed back as it is

```ts
    } catch (error) {
      if (error instanceof HTTPError) return error.response;
      throw error;
    }
```

Why: ky has already read that body into `error.data`, so the generated client gets a
consumed stream when it builds `TypedStatusError`. Rebuild a fresh `Response` from
`error.data`.
