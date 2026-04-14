import { Response } from "express";
import { HttpError } from "./classroom";

export const sendControllerError = (response: Response, error: unknown) => {
  if (error instanceof HttpError) {
    response.status(error.status).json({
      success: false,
      error: error.message,
      appState: error.appState,
    });
    return;
  }

  response.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : "Internal server error",
  });
};
