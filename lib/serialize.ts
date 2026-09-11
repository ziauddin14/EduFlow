/**
 * Converts Mongoose lean() results (ObjectId, Date, etc.) into plain
 * JSON-safe values so Server Components can pass them as props to
 * Client Components without a "only plain objects" serialization error.
 */
export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
