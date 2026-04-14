import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../supabaseClient";
import { UserProfile, UserRole } from "../../../shared/types";

const isMissingRelationError = (error?: { code?: string; message?: string } | null) =>
  error?.code === "PGRST205" || error?.message?.includes("schema cache");

const normalizeRole = (value: unknown): UserRole | undefined => {
  if (value === "student" || value === "teacher" || value === "admin") {
    return value;
  }

  return undefined;
};

const mapProfile = (profile: {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
}): UserProfile => ({
  id: profile.id,
  email: profile.email,
  fullName: profile.full_name,
  role: profile.role,
  avatarUrl: profile.avatar_url ?? undefined,
  createdAt: profile.created_at,
});

export const handleProfileSync = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { role, fullName, avatarUrl, email } = req.body;
    const requestedRole = normalizeRole(role);
    const requestedEmail = req.user!.email || email;

    const {
      data: authUserData,
      error: authUserError,
    } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authUserError || !authUserData.user) {
      res.status(500).json({
        error: "Failed to load auth user",
        details: authUserError?.message,
      });
      return;
    }

    const authUser = authUserData.user;
    const authMetadata = authUser.user_metadata ?? {};
    const storedAuthRole = normalizeRole(authMetadata.role);
    const nextEmail = authUser.email || requestedEmail || "unknown@domain.com";

    const nextFullName =
      fullName ||
      req.user?.fullName ||
      (typeof authMetadata.full_name === "string" ? authMetadata.full_name : undefined) ||
      "New User";
    const nextAvatarUrl =
      avatarUrl ??
      req.user?.avatarUrl ??
      (typeof authMetadata.avatar_url === "string" ? authMetadata.avatar_url : null);
    const nextRole = storedAuthRole || requestedRole || "student";

    const {
      data: existingProfile,
      error: existingProfileError,
    } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle();

    if (existingProfileError && !isMissingRelationError(existingProfileError)) {
      res.status(500).json({
        error: "Failed to query profile",
        details: existingProfileError.message,
      });
      return;
    }

    if (existingProfile) {
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            ...authMetadata,
            full_name: existingProfile.full_name,
            avatar_url: existingProfile.avatar_url,
            role: existingProfile.role,
          },
        },
      );

      if (metadataError) {
        res.status(500).json({
          error: "Failed to sync auth metadata",
          details: metadataError.message,
        });
        return;
      }

      res.json({ profile: mapProfile(existingProfile) });
      return;
    }

    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...authMetadata,
        full_name: nextFullName,
        avatar_url: nextAvatarUrl,
        role: nextRole,
      },
    });

    if (metadataError) {
      res.status(500).json({
        error: "Failed to sync auth metadata",
        details: metadataError.message,
      });
      return;
    }

    const { error: upsertError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        email: nextEmail,
        full_name: nextFullName,
        role: nextRole,
        avatar_url: nextAvatarUrl,
      },
      {
        onConflict: "id",
        ignoreDuplicates: true,
      },
    );

    if (upsertError && !isMissingRelationError(upsertError)) {
      res.status(500).json({
        error: "Failed to create profile",
        details: upsertError.message,
      });
      return;
    }

    if (isMissingRelationError(upsertError) || isMissingRelationError(existingProfileError)) {
      res.status(200).json({
        profile: {
          id: userId,
          email: nextEmail,
          fullName: nextFullName,
          role: nextRole,
          avatarUrl: nextAvatarUrl ?? undefined,
          createdAt: authUser.created_at ?? new Date().toISOString(),
        } satisfies UserProfile,
      });
      return;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      res.status(500).json({ error: "Failed to query profile", details: profileError.message });
      return;
    }

    if (!profile) {
      res.status(200).json({
        profile: {
          id: userId,
          email: nextEmail,
          fullName: nextFullName,
          role: nextRole,
          avatarUrl: nextAvatarUrl ?? undefined,
          createdAt: authUser.created_at ?? new Date().toISOString(),
        } satisfies UserProfile,
      });
      return;
    }

    res.status(200).json({ profile: mapProfile(profile) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
