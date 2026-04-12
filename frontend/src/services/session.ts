import { JoinSessionRequest, JoinSessionResponse } from "../../../shared/types";
import { supabase } from "../lib/supabase";

export const sessionService = {
  /**
   * Joins a classroom session via the backend API.
   * Requires the user to be authenticated in Supabase Auth.
   */
  async joinSession(request: JoinSessionRequest): Promise<JoinSessionResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, appState: "unauthorized" };
    }

    try {
      const response = await fetch("/api/classroom/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(request)
      });
      
      return await response.json();
    } catch (err) {
      console.error("Failed to join session via API:", err);
      // Fallback response parsing or mock fallback handling
      return { success: false, error: "Network error connecting to backend." };
    }
  }
};
