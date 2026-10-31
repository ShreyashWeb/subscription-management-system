export class AppError extends Error {
  public readonly code: "VALIDATION" | "CONFLICT" | "NOT_FOUND" | "FORBIDDEN" | "SERVER";
  public readonly statusCode: number;

  constructor(
    message: string,
    code: "VALIDATION" | "CONFLICT" | "NOT_FOUND" | "FORBIDDEN" | "SERVER" = "SERVER",
    statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION", 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, "NOT_FOUND", 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, "FORBIDDEN", 403);
  }
}

