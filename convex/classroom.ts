import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query: Teacher Dashboard uses this to get the live list of students
export const getClassroomState = query({
  handler: async (ctx) => {
    // Return only students for the dashboard
    return await ctx.db
      .query("participants")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();
  },
});

// Mutation: Join the classroom (called by both Teacher and Student on mount)
export const joinClassroom = mutation({
  args: { 
    name: v.string(),
    roomId: v.string(),
    role: v.union(v.literal("teacher"), v.literal("student")) 
  },
  handler: async (ctx, args) => {
    // Check if participant exists for this room
    const existing = await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();

    if (existing) {
      // Update existence
      await ctx.db.patch(existing._id, {
        name: args.name,
        role: args.role,
        status: "online",
        lastSeen: Date.now(),
      });
      return existing._id;
    }

    // Create new participant
    return await ctx.db.insert("participants", {
      name: args.name,
      roomId: args.roomId,
      role: args.role,
      status: "online",
      isHandRaised: false, // Default to false
      lastSeen: Date.now(),
    });
  },
});

// Mutation: Student raises (or lowers) hand
export const raiseHand = mutation({
  args: { 
    roomId: v.string(), 
    raised: v.boolean() 
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    
    if (participant) {
      await ctx.db.patch(participant._id, { isHandRaised: args.raised });
    }
  },
});