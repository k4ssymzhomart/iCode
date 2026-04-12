import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  participants: defineTable({
    name: v.string(),
    role: v.union(v.literal("teacher"), v.literal("student")),
    roomId: v.string(),
    status: v.string(),
    isHandRaised: v.boolean(),
    lastSeen: v.number(),
  }).index("by_room", ["roomId"]),
});
