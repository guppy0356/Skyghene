import { http as mswHttp, HttpResponse, type HttpHandler, type JsonBodyType } from "msw";
import { EndpointByMethod } from "../lib/api.gen";

// Handlers typed against src/openapi.yaml through the generated module: the
// path is the contract's own literal, params come from its path parameters,
// and response(status) accepts only the statuses the contract declares. The
// zod schema of the chosen status also runs over the body at runtime, so a
// mock drifting in a way the types cannot see fails loudly.

type Method = "get" | "post" | "patch" | "delete";
type Paths<M extends Method> = Extract<keyof EndpointByMethod[M], string>;
type EndpointOf<M extends Method, P extends Paths<M>> = EndpointByMethod[M][P];

type PathParamsOf<E> = E extends { parameters: { path: infer P } } ? P : Record<string, never>;
type BodyOf<E> = E extends { parameters: { body: infer B } } ? B : never;
type ResponsesOf<E> = E extends { responses: infer R } ? R : never;
type StatusOf<E> = Extract<keyof ResponsesOf<E>, number>;

// A bodyless status (declared with no content) is `unknown` in the contract
// and offers `.empty()` alone; a body-bearing one offers `.json(body)`.
type Responder<E> = <S extends StatusOf<E>>(
  status: S,
) => unknown extends ResponsesOf<E>[S]
  ? { empty: () => Response }
  : { json: (body: ResponsesOf<E>[S]) => Response };

type TypedRequest<B> = [B] extends [never]
  ? Request
  : Omit<Request, "json"> & { json: () => Promise<B> };

type Resolver<E> = (info: {
  request: TypedRequest<BodyOf<E>>;
  params: PathParamsOf<E>;
  response: Responder<E>;
}) => Response | Promise<Response>;

interface RuntimeEndpoint {
  responses: Record<number, { parse: (value: unknown) => unknown }>;
}

function define<M extends Method>(method: M) {
  return <P extends Paths<M>>(path: P, resolver: Resolver<EndpointOf<M, P>>): HttpHandler => {
    const endpoint = (EndpointByMethod[method] as Record<string, RuntimeEndpoint>)[path];
    const response = (status: number) => ({
      empty: () => new HttpResponse(null, { status }),
      json: (body: unknown) =>
        HttpResponse.json(endpoint.responses[status].parse(body) as JsonBodyType, { status }),
    });
    // The contract writes `{param}`; msw matches `:param`.
    const mswPath = path.replace(/\{(\w+)\}/g, ":$1");
    return (mswHttp[method] as typeof mswHttp.get)(mswPath, (info) =>
      resolver({
        request: info.request as never,
        params: info.params as never,
        response: response as never,
      }),
    );
  };
}

export const http = {
  get: define("get"),
  post: define("post"),
  patch: define("patch"),
  delete: define("delete"),
};
