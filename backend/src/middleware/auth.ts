import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../supabaseClient";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: "student" | "teacher" | "admin";
    fullName?: string;
    avatarUrl?: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Unauthorized", details: error?.message });
    return;
  }

  const metadata = data.user.user_metadata ?? {};
  const role =
    metadata.role === "student" ||
    metadata.role === "teacher" ||
    metadata.role === "admin"
      ? metadata.role
      : undefined;

  req.user = {
    id: data.user.id,
    email: data.user.email,
    role,
    fullName:
      typeof metadata.full_name === "string" && metadata.full_name.trim()
        ? metadata.full_name
        : undefined,
    avatarUrl:
      typeof metadata.avatar_url === "string" && metadata.avatar_url.trim()
        ? metadata.avatar_url
        : undefined,
  };
  next();
};
