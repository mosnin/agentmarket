import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Request-scoped principal for the programmable agent API.
 *
 * A bearer token can be mapped to a specific user via `API_BEARER_TOKENS`
 * (`token=email` syntax). The API guard stashes the resolved principal here so
 * `getCurrentUser` runs the request AS that user — subject to the same
 * authorization — instead of the shared service operator. Server-only (Node
 * async_hooks); never imported by client or edge (middleware) code.
 */
export interface RequestPrincipal {
  /** The user this request acts as, resolved from a `token=email` mapping. */
  email?: string;
  /**
   * Set when a request is authenticated as the trusted service operator via a
   * valid bearer token that has NO user mapping. This is what distinguishes an
   * *authenticated* API call (allowed to run as the service identity) from an
   * *unauthenticated* web request (which must never be treated as privileged).
   */
  serviceOperator?: boolean;
}

const storage = new AsyncLocalStorage<RequestPrincipal | undefined>();

/**
 * Bind the principal for the remainder of the current request's async context.
 * Route handlers are isolated async contexts, so this scopes per request.
 */
export function setRequestPrincipal(principal: RequestPrincipal): void {
  storage.enterWith(principal);
}

/** Run `fn` with a bound principal, cleared afterwards (used in tests). */
export function runWithPrincipal<T>(
  principal: RequestPrincipal,
  fn: () => T,
): T {
  return storage.run(principal, fn);
}

export function getRequestPrincipal(): RequestPrincipal | undefined {
  return storage.getStore();
}
