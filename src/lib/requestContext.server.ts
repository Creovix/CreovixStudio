type RuntimeContext = {
  waitUntil?: (promise: Promise<unknown>) => void;
};

const requestContexts = new WeakMap<Request, RuntimeContext>();

export function registerRequestContext(request: Request, context: unknown): () => void {
  if (context && typeof context === "object") {
    requestContexts.set(request, context as RuntimeContext);
  }
  return () => requestContexts.delete(request);
}

/** Keeps long-running webhook work alive after the HTTP acknowledgement is sent. */
export function deferRequestWork(request: Request, work: Promise<unknown>): void {
  const context = requestContexts.get(request);
  if (typeof context?.waitUntil === "function") {
    context.waitUntil(work);
    return;
  }
  void work.catch((error) => console.error("[background-work] failed", error));
}