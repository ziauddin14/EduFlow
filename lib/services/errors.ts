export class NotFoundError extends Error {
  constructor(message = "Resource not found.") {
    super(message);
  }
}

export class ConflictError extends Error {}
