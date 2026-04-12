import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../supabaseClient";
import { UserProfile } from "../../../shared/types";

export const handleProfileSync = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { role, fullName, avatarUrl, email } = req.body;

    // First check if profile already exists
    const { data: existingProfile, error: selectError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (selectError && selectError.code !== "PGRST116") { // Not row not found
      res.status(500).json({ error: "Failed to query profile", details: selectError.message });
      return;
    }

    if (existingProfile) {
      // Return existing profile. 
      // We don't overwrite roles on subsequent logins to prevent privilege escalation.
      const mappedProfile: UserProfile = {
        id: existingProfile.id,
        email: existingProfile.email,
        fullName: existingProfile.full_name,
        role: existingProfile.role,
        avatarUrl: existingProfile.avatar_url,
        createdAt: existingProfile.created_at,
      };
      res.json({ profile: mappedProfile });
      return;
    }

    // Profile doesn't exist, create it.
    // Validate or default role to student to prevent unrecoverable logins if cache drops
    let finalRole = role;
    if (!finalRole || (finalRole !== "student" && finalRole !== "teacher")) {
      finalRole = "student";
    }

    const fallbackEmail = req.user!.email || email || "unknown@domain.com";

    const newProfile = {
      id: userId,
      email: fallbackEmail,
      full_name: fullName || "New User",
      role: finalRole,
      avatar_url: avatarUrl || null,
    };

    const { data: insertedProfile, error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert(newProfile)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505" || insertError.message?.includes("duplicate")) {
         const { data: concurrentProfile } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
         if (concurrentProfile) {
            const mappedProfile: UserProfile = {
              id: concurrentProfile.id,
              email: concurrentProfile.email,
              fullName: concurrentProfile.full_name,
              role: concurrentProfile.role,
              avatarUrl: concurrentProfile.avatar_url,
              createdAt: concurrentProfile.created_at,
            };
            res.status(200).json({ profile: mappedProfile });
            return;
         }
      }
      res.status(500).json({ error: "Failed to create profile", details: insertError.message });
      return;
    }

    const mappedProfile: UserProfile = {
      id: insertedProfile.id,
      email: insertedProfile.email,
      fullName: insertedProfile.full_name,
      role: insertedProfile.role,
      avatarUrl: insertedProfile.avatar_url,
      createdAt: insertedProfile.created_at,
    };

    res.status(201).json({ profile: mappedProfile });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
