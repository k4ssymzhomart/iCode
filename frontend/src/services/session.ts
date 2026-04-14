import { JoinSessionRequest, JoinSessionResponse } from "../../../shared/types";
import { classroomService } from "./classroom";

export const sessionService = {
  /**
   * Joins a classroom session via the backend API.
   * Requires the user to be authenticated in Supabase Auth.
   */
  async joinSession(request: JoinSessionRequest): Promise<JoinSessionResponse> {
    try {
      return await classroomService.joinSession(request);
    } catch (err) {
      console.error("Failed to join session via API:", err);
      return { success: false, error: "Network error connecting to backend." };
    }
  }
};
