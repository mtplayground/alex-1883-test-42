import type { NextFunction, Request, Response } from "express";

function errorCode(error: Error): unknown {
  if ("code" in error) {
    return error.code;
  }

  return undefined;
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      code: errorCode(error),
      message: error.message,
      stack: error.stack
    };
  }

  return {
    name: "UnknownError",
    message: String(error)
  };
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: "not_found",
      message: `Route ${req.method} ${req.originalUrl} was not found.`
    }
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Unhandled request error", serializeError(err));

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(500).json({
    error: {
      code: "internal_server_error",
      message: "An unexpected server error occurred."
    }
  });
}
