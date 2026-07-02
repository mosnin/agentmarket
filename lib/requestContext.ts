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
  email: string;
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
