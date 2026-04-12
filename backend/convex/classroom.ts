import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getClassroomState = query({
  handler: async (ctx) =>
    ctx.db
      .query("participants")
      .filter((queryBuilder) => queryBuilder.eq(queryBuilder.field("role"), "student"))
      .collect(),
});

export const joinClassroom = mutation({
  args: {
    name: v.string(),
    roomId: v.string(),
    role: v.union(v.literal("teacher"), v.literal("student")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("participants")
      .withIndex("by_room", (queryBuilder) =>
        queryBuilder.eq("roomId", args.roomId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        role: args.role,
        status: "online",
        lastSeen: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("participants", {
      name: args.name,
      roomId: args.roomId,
      role: args.role,
      status: "online",
      isHandRaised: false,
      lastSeen: Date.now(),
    });
  },
});

export const raiseHand = mutation({
  args: {
    roomId: v.string(),
    raised: v.boolean(),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_room", (queryBuilder) =>
        queryBuilder.eq("roomId", args.roomId),
      )
      .first();

    if (participant) {
      await ctx.db.patch(participant._id, { isHandRaised: args.raised });
    }
  },
});
