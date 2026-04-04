import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table (simplified for this demo)
  users: defineTable({
    name: v.string(),
    role: v.union(v.literal("teacher"), v.literal("student")),
  }),
  
  // Participants table: The "Source of Truth" for the Teacher Dashboard
  participants: defineTable({
    name: v.string(),
    role: v.union(v.literal("teacher"), v.literal("student")),
    roomId: v.string(), // e.g., "room-student-123"
    status: v.string(), // "online", "idle", "offline"
    isHandRaised: v.boolean(),
    lastSeen: v.number(),
  })
  .index("by_room", ["roomId"]), // To quickly find a student by their room
});