import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../supabaseClient";
import { sendControllerError } from "../lib/responses";

export const handleSubmitFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { gender, ageGroup, country, bugDescription, description, imageUrl } = req.body;

    const { error } = await supabaseAdmin.from("feedback").insert({
      student_id: userId,
      gender: gender || null,
      age_group: ageGroup || null,
      country: country || null,
      bug_description: bugDescription || null,
      description: description || null,
      image_url: imageUrl || null,
    });

    if (error) {
      if (error.code === "42P01") {
        // Relation does not exist - this means the user hasn't run the SQL script yet
        res.status(500).json({ error: "Database table not found. Please run feedback.sql." });
        return;
      }
      res.status(500).json({ error: "Failed to submit feedback", details: error.message });
      return;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    sendControllerError(res, err);
  }
};
