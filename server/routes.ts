import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertNftSchema, insertDegenClaimSchema } from "@shared/schema";
import { degenService } from "./degen";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Farcaster domain manifest for Warpcast verification
  app.get("/.well-known/farcaster.json", (req, res) => {
    const baseUrl = "https://frame-weaver--mamunkhann.replit.app";
    
    res.json({
      "accountAssociation": {
        "header": "eyJmaWQiOjI5Mjk3NywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweEE1ZjY1YTk5YzA5NzZBRjU3MTcyQzkyNjZENDA4ODg5N0MyYjQzNDEifQ",
        "payload": "eyJkb21haW4iOiJmcmFtZS13ZWF2ZXItLW1hbXVua2hhbm4ucmVwbGl0LmFwcCJ9",
        "signature": "Bfu6bWPTqNLzXie2nAxdPuwSN+5CadnByjBJhd09l6p6XEV7EvxMHJU+5sdfG9obPoXz2U5az009QaXTXFVdbBs="
      },
      "frame": {
        "version": "1",
        "name": "Check Neynar Quotient Score",
        "iconUrl": `${baseUrl}/logo.png`,
        "homeUrl": baseUrl,
        "imageUrl": `${baseUrl}/logo.png`,
        "buttonTitle": "Check My Score",
        "splashImageUrl": `${baseUrl}/logo.png`,
        "splashBackgroundColor": "#12141d",
        "webhookUrl": `${baseUrl}/api/webhook`
      }
    });
  });

  // Frame webhook endpoint
  app.post("/api/webhook", (req, res) => {
    console.log("Frame webhook received:", req.body);
    res.json({ success: true });
  });

  // Frame POST handler
  app.post("/api/frame", async (req, res) => {
    try {
      const { untrustedData } = req.body;
      const fid = untrustedData?.fid;
      
      console.log("Frame action received:", { fid, buttonIndex: untrustedData?.buttonIndex });
      
      // Return a frame response
      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://taskpay.group/image.png" />
          <meta property="fc:frame:button:1" content="Open App" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="https://taskpay.group" />
        </head>
        </html>
      `);
    } catch (error) {
      console.error("Frame error:", error);
      res.status(500).json({ error: "Frame error" });
    }
  });

  // Get or create user by FID
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      let user = await storage.getUserByFid(userData.fid);
      
      if (!user) {
        user = await storage.createUser(userData);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error creating/getting user:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  // Update user wallet
  app.patch("/api/users/:fid/wallet", async (req, res) => {
    try {
      const fid = parseInt(req.params.fid);
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }
      
      const user = await storage.updateUserWallet(fid, walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating wallet:", error);
      res.status(500).json({ error: "Failed to update wallet" });
    }
  });

  // Get Neynar scores (proxied through backend for API key security)
  app.get("/api/neynar/scores/:fid", async (req, res) => {
    try {
      const fid = req.params.fid;
      const apiKey = process.env.NEYNAR_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "Neynar API key not configured" });
      }
      
      // Fetch user data from Neynar API
      const neynarResponse = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
        headers: {
          'accept': 'application/json',
          'api_key': apiKey
        }
      });
      
      if (!neynarResponse.ok) {
        throw new Error(`Neynar API error: ${neynarResponse.statusText}`);
      }
      
      const neynarData = await neynarResponse.json();
      const userData = neynarData.users?.[0];
      
      if (!userData) {
        return res.status(404).json({ error: "User not found on Neynar" });
      }
      
      const neynarScore = userData.experimental?.neynar_user_score || 0;
      const followerCount = userData.follower_count || 0;
      const followingCount = userData.following_count || 0;
      
      // Calculate account age in days
      let accountAgeDays = 0;
      if (userData.profile?.bio?.mentioned_profiles) {
        // Fallback: estimate based on FID (lower FID = older account)
        accountAgeDays = Math.min(365 * 2, Math.max(30, (1000000 - parseInt(fid)) / 1000));
      }
      
      // Calculate Quotient Score using weighted formula:
      // 50% Neynar Score (already 0-1)
      // 30% Follower count (log-scaled, capped)
      // 20% Account engagement ratio
      
      const neynarNorm = Math.min(Math.max(neynarScore, 0), 1);
      const followersNorm = Math.min(Math.log10(followerCount + 1) / 5, 1);
      const engagementRatio = followerCount > 0 
        ? Math.min(followingCount / followerCount, 1) 
        : 0;
      const engagementNorm = 1 - (engagementRatio * 0.5); // Lower ratio = better
      
      // Calculate raw quotient score (0-1 scale like original Quotient.social)
      const quotientScoreRaw = neynarNorm * 0.5 + followersNorm * 0.3 + engagementNorm * 0.2;
      const quotientScore = Math.round(quotientScoreRaw * 1000) / 1000; // 3 decimal places
      
      res.json({
        fid: userData.fid,
        username: userData.username,
        displayName: userData.display_name,
        pfp: userData.pfp_url,
        neynarScore: neynarScore,
        quotientScore: Math.min(Math.max(quotientScore, 0), 1),
        followerCount,
        followingCount,
      });
    } catch (error) {
      console.error("Error fetching Neynar scores:", error);
      res.status(500).json({ error: "Failed to fetch scores" });
    }
  });

  // Create NFT record
  app.post("/api/nfts", async (req, res) => {
    try {
      const nftData = insertNftSchema.parse(req.body);
      const nft = await storage.createNft(nftData);
      res.json(nft);
    } catch (error) {
      console.error("Error creating NFT:", error);
      res.status(400).json({ error: "Invalid NFT data" });
    }
  });

  // Get user's NFTs
  app.get("/api/nfts/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const nfts = await storage.getNftsByUserId(userId);
      res.json(nfts);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      res.status(500).json({ error: "Failed to fetch NFTs" });
    }
  });

  // Check if user can claim DEGEN
  app.get("/api/degen/can-claim/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const canClaim = await storage.canClaimDegen(userId);
      
      if (!canClaim) {
        const lastClaim = await storage.getLastClaimByUserId(userId);
        const nextClaimTime = lastClaim 
          ? new Date(lastClaim.claimedAt.getTime() + 24 * 60 * 60 * 1000)
          : new Date();
        
        return res.json({
          canClaim: false,
          nextClaimTime: nextClaimTime.toISOString(),
          remainingMs: nextClaimTime.getTime() - Date.now()
        });
      }
      
      res.json({ canClaim: true });
    } catch (error) {
      console.error("Error checking claim eligibility:", error);
      res.status(500).json({ error: "Failed to check eligibility" });
    }
  });

  // Claim DEGEN reward
  app.post("/api/degen/claim", async (req, res) => {
    try {
      const { userId, walletAddress } = req.body;
      
      if (!userId || !walletAddress) {
        return res.status(400).json({ error: "User ID and wallet address required" });
      }
      
      // Check if DEGEN service is configured
      if (!degenService.isConfigured()) {
        return res.status(503).json({ error: "Reward service temporarily unavailable" });
      }
      
      const canClaim = await storage.canClaimDegen(userId);
      
      if (!canClaim) {
        return res.status(429).json({ error: "Already claimed within 24 hours" });
      }
      
      // Send actual DEGEN tokens from admin wallet
      console.log(`Sending 1 DEGEN to ${walletAddress} from admin wallet`);
      const { hash, success } = await degenService.sendDegen(walletAddress, "1");
      
      if (!success) {
        throw new Error("Transaction failed");
      }
      
      // Record the claim in database
      const claim = await storage.createDegenClaim({
        userId,
        transactionHash: hash,
        amount: "1"
      });
      
      res.json({
        success: true,
        claim,
        transactionHash: hash,
        message: "1 DEGEN sent successfully"
      });
    } catch (error) {
      console.error("Error claiming DEGEN:", error);
      res.status(500).json({ error: "Failed to claim DEGEN" });
    }
  });

  return httpServer;
}
