export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends HttpError {
  constructor(entity, id) {
    super(404, `${entity} ${id} not found`);
  }
}

export class ValidationError extends HttpError {
  constructor(message) {
    super(400, message);
  }
}
