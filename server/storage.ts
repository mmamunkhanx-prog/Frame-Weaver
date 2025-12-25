import { eq, desc, and, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";
import type { User, InsertUser, NFT, InsertNFT, DegenClaim, InsertDegenClaim } from "@shared/schema";

export interface IStorage {
  // User operations
  getUserByFid(fid: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(fid: number, walletAddress: string): Promise<User | undefined>;
  
  // NFT operations
  createNft(nft: InsertNFT): Promise<NFT>;
  getNftsByUserId(userId: number): Promise<NFT[]>;
  
  // Degen claim operations
  createDegenClaim(claim: InsertDegenClaim): Promise<DegenClaim>;
  getLastClaimByUserId(userId: number): Promise<DegenClaim | undefined>;
  canClaimDegen(userId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.db = drizzle(pool, { schema });
  }

  async getUserByFid(fid: number): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.fid, fid))
      .limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db
      .insert(schema.users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserWallet(fid: number, walletAddress: string): Promise<User | undefined> {
    const [user] = await this.db
      .update(schema.users)
      .set({ walletAddress })
      .where(eq(schema.users.fid, fid))
      .returning();
    return user;
  }

  async createNft(insertNft: InsertNFT): Promise<NFT> {
    const [nft] = await this.db
      .insert(schema.nfts)
      .values(insertNft)
      .returning();
    return nft;
  }

  async getNftsByUserId(userId: number): Promise<NFT[]> {
    return await this.db
      .select()
      .from(schema.nfts)
      .where(eq(schema.nfts.userId, userId))
      .orderBy(desc(schema.nfts.mintedAt));
  }

  async createDegenClaim(insertClaim: InsertDegenClaim): Promise<DegenClaim> {
    const [claim] = await this.db
      .insert(schema.degenClaims)
      .values(insertClaim)
      .returning();
    return claim;
  }

  async getLastClaimByUserId(userId: number): Promise<DegenClaim | undefined> {
    const [claim] = await this.db
      .select()
      .from(schema.degenClaims)
      .where(eq(schema.degenClaims.userId, userId))
      .orderBy(desc(schema.degenClaims.claimedAt))
      .limit(1);
    return claim;
  }

  async canClaimDegen(userId: number): Promise<boolean> {
    const lastClaim = await this.getLastClaimByUserId(userId);
    
    if (!lastClaim) {
      return true; // Never claimed before
    }
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return lastClaim.claimedAt < twentyFourHoursAgo;
  }
}

export const storage = new DatabaseStorage();
