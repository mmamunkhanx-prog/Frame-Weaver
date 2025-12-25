import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fid: integer("fid").notNull().unique(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  pfp: text("pfp").notNull(),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const nfts = pgTable("nfts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tokenId: text("token_id").notNull(),
  mintedAt: timestamp("minted_at").defaultNow().notNull(),
  transactionHash: text("transaction_hash"),
  neynarScore: text("neynar_score").notNull(),
  quotientScore: text("quotient_score").notNull(),
});

export const degenClaims = pgTable("degen_claims", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
  transactionHash: text("transaction_hash"),
  amount: text("amount").notNull().default("1"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertNftSchema = createInsertSchema(nfts).omit({
  id: true,
  mintedAt: true,
});

export const insertDegenClaimSchema = createInsertSchema(degenClaims).omit({
  id: true,
  claimedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type NFT = typeof nfts.$inferSelect;
export type InsertNFT = z.infer<typeof insertNftSchema>;
export type DegenClaim = typeof degenClaims.$inferSelect;
export type InsertDegenClaim = z.infer<typeof insertDegenClaimSchema>;
