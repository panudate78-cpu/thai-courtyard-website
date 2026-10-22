type ErrorNode = {
  message?: string;
  code?: string;
  detail?: string;
  hint?: string;
  table?: string;
  schema?: string;
  routine?: string;
  cause?: unknown;
};

function asNode(error: unknown): ErrorNode | null {
  if (!error || typeof error !== "object") return null;
  return error as ErrorNode;
}

/** Walk Drizzle's `Failed query` wrapper and the underlying node-postgres error. */
export function describeDatabaseError(error: unknown): string {
  const lines: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;
  for (let depth = 0; current && depth < 6 && !seen.has(current); depth += 1) {
    seen.add(current);
    const node = asNode(current);
    if (!node) break;
    const headline = [node.code ? `Postgres ${node.code}` : null, node.message].filter(Boolean).join(": ");
    if (headline) lines.push(headline);
    if (node.detail) lines.push(`detail: ${node.detail}`);
    if (node.hint) lines.push(`hint: ${node.hint}`);
    if (node.table) lines.push(`table: ${node.table}`);
    if (node.schema) lines.push(`schema: ${node.schema}`);
    current = node.cause;
  }
  return lines.join("\n") || "Database query failed";
}

/** Rethrow so Next.js shows the PostgreSQL message, not only Drizzle's "Failed query". */
export function toDatabaseError(error: unknown): Error {
  if (error instanceof Error && error.message.startsWith("Postgres ")) return error;
  const wrapped = new Error(describeDatabaseError(error));
  wrapped.name = "DatabaseError";
  wrapped.cause = error;
  return wrapped;
}

export async function withDatabaseError<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    throw toDatabaseError(error);
  }
}
