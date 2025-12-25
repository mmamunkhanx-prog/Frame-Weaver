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
        "signature": "MHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw"
      },
      "frame": {
        "version": "1",
        "name": "NeonFrame",
        "iconUrl": `${baseUrl}/favicon.png`,
        "homeUrl": baseUrl,
        "imageUrl": `${baseUrl}/opengraph.jpg`,
        "buttonTitle": "Check My Score",
        "splashImageUrl": `${baseUrl}/opengraph.jpg`,
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
      const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
        headers: {
          'accept': 'application/json',
          'api_key': apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract scores from the response
      const userData = data.users?.[0];
      
      if (!userData) {
        return res.status(404).json({ error: "User not found on Neynar" });
      }
      
      res.json({
        fid: userData.fid,
        username: userData.username,
        displayName: userData.display_name,
        pfp: userData.pfp_url,
        neynarScore: userData.experimental?.neynar_user_score || 0,
        // Quotient score might be in a different field or need separate API call
        quotientScore: userData.experimental?.quotient_score || 0,
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
