import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Sparkles, AlertCircle, Gift, Clock } from "lucide-react";
import generatedImage from '@assets/generated_images/dark_futuristic_neon_grid_background.png';
import { useState, useEffect } from "react";
import { getNeynarScores, canClaimDegen, claimDegen, getOrCreateUser, mintNft, getNftInfo } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import sdk from "@farcaster/frame-sdk";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fid, setFid] = useState<number | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    async function getContext() {
      try {
        const context = await sdk.context;
        if (context?.user?.fid) {
          setFid(context.user.fid);
        } else {
          setFid(3);
        }
      } catch (error) {
        console.log("Not in Farcaster context, using default FID");
        setFid(3);
      } finally {
        setIsLoadingContext(false);
      }
    }
    getContext();
  }, []);

  const { data: userData } = useQuery({
    queryKey: ['neynar-scores', fid],
    queryFn: () => getNeynarScores(fid!),
    enabled: !!fid,
  });

  const { data: dbUser } = useQuery({
    queryKey: ['db-user', fid],
    queryFn: async () => {
      if (!userData) return null;
      return getOrCreateUser(userData.fid, userData.username, userData.displayName, userData.pfp);
    },
    enabled: !!userData,
  });

  const { data: claimStatus, refetch: refetchClaimStatus } = useQuery({
    queryKey: ['claim-status', dbUser?.id],
    queryFn: () => canClaimDegen(dbUser!.id),
    enabled: !!dbUser,
    refetchInterval: 10000,
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!dbUser || !walletAddress) {
        throw new Error("Wallet not connected");
      }
      return claimDegen(dbUser.id, walletAddress);
    },
    onSuccess: () => {
      toast({
        title: "Reward Claimed!",
        description: "1 $DEGEN has been sent to your wallet.",
        duration: 5000,
      });
      refetchClaimStatus();
    },
    onError: (error: Error) => {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const mintMutation = useMutation({
    mutationFn: async () => {
      if (!dbUser || !walletAddress || !userData) {
        throw new Error("Wallet not connected");
      }
      return mintNft({
        userId: dbUser.id,
        walletAddress,
        neynarScore: userData.neynarScore,
        quotientScore: userData.quotientScore,
        username: userData.username,
        fid: userData.fid,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "NFT Minted!",
        description: `Your score NFT is now on Base. TX: ${data.txHash?.slice(0, 10)}...`,
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Mint Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!claimStatus?.canClaim && claimStatus?.remainingMs) {
      const interval = setInterval(() => {
        const remaining = claimStatus.remainingMs - (Date.now() - new Date(claimStatus.nextClaimTime).getTime() + claimStatus.remainingMs);
        
        if (remaining <= 0) {
          setTimeRemaining("Ready to claim!");
          refetchClaimStatus();
          clearInterval(interval);
        } else {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [claimStatus]);

  const handleConnectWallet = async () => {
    try {
      const result = await sdk.actions.signIn({
        nonce: Date.now().toString(),
        acceptAuthAddress: true,
      });
      
      if (result?.signature) {
        const signatureData = result.signature as { address?: string };
        const custodyAddress = signatureData.address || 
          (userData?.fid ? `0x${userData.fid.toString(16).padStart(40, '0')}` : null);
        
        if (custodyAddress) {
          setWalletAddress(custodyAddress);
          toast({
            title: "Wallet Connected",
            description: `Connected: ${custodyAddress.slice(0, 6)}...${custodyAddress.slice(-4)}`,
          });
          return;
        }
      }
      
      const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${userData?.fid}`, {
        headers: {
          'accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const verifications = data.users?.[0]?.verifications;
        if (verifications && verifications.length > 0) {
          const ethAddress = verifications.find((v: string) => v.startsWith('0x'));
          if (ethAddress) {
            setWalletAddress(ethAddress);
            toast({
              title: "Wallet Found",
              description: `Using verified wallet: ${ethAddress.slice(0, 6)}...${ethAddress.slice(-4)}`,
            });
            return;
          }
        }
      }
      
      toast({
        title: "No Wallet Found",
        description: "Please verify a wallet address on your Farcaster profile.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMint = () => {
    if (!walletAddress) {
      toast({
        title: "Connect Wallet First",
        description: "Please connect your wallet to mint NFTs.",
        variant: "destructive",
      });
      return;
    }

    mintMutation.mutate();
  };

  if (isLoadingContext || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen break-words">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-display font-bold text-white neon-text mb-2">Mint Profile</h1>
        <p className="text-muted-foreground font-tech uppercase tracking-widest text-sm break-words">
          On-Chain Identity
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative aspect-[3/4] w-full max-w-[320px] mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,243,255,0.15)] group"
      >
        <div className="absolute inset-0 bg-[#050505]">
          <img 
            src={generatedImage} 
            alt="Background" 
            className="w-full h-full object-cover opacity-60 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
          <div className="flex justify-between items-start">
            <div className="bg-black/50 backdrop-blur-md rounded-full px-3 py-1 border border-white/10 text-xs font-tech text-white/80">
              #NEYNAR_PASS
            </div>
            <div className="bg-primary/20 backdrop-blur-md rounded-full p-2 border border-primary/30">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/50 shadow-[0_0_20px_rgba(0,243,255,0.3)] mx-auto">
               <img src={userData.pfp} alt="Profile" className="w-full h-full object-cover" />
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-white mb-1 break-words">{userData.displayName}</h2>
              <p className="text-primary font-mono text-sm break-all">@{userData.username}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/5 text-center">
                <div className="text-[10px] uppercase text-muted-foreground font-tech mb-1 break-words">Neynar Score</div>
                <div className="text-xl font-display font-bold text-white">{userData.neynarScore.toFixed(1)}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/5 text-center">
                <div className="text-[10px] uppercase text-muted-foreground font-tech mb-1 break-words">Quotient</div>
                <div className="text-xl font-display font-bold text-white">{userData.quotientScore.toFixed(1)}</div>
              </div>
            </div>
          </div>
          
           <div className="text-center pt-4 border-t border-white/10">
              <p className="text-[10px] font-mono text-white/40 tracking-[0.2em] uppercase break-words">Authenticated via Farcaster</p>
           </div>
        </div>
      </motion.div>

      {!walletAddress ? (
        <Button 
          onClick={handleConnectWallet}
          className="w-full h-14 text-lg font-display font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer"
        >
          <Wallet className="mr-2 w-5 h-5" />
          Connect Wallet
        </Button>
      ) : (
        <div className="bg-card/50 rounded-xl p-3 border border-white/5 text-center">
          <p className="text-xs text-muted-foreground mb-1 break-words">Connected Wallet</p>
          <p className="text-xs font-mono text-primary break-all">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="bg-card/50 rounded-xl p-4 border border-white/5 flex flex-col gap-4">
           <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-sm text-muted-foreground font-tech uppercase break-words">Mint Price</span>
              <span className="text-lg font-bold text-green-400">FREE</span>
           </div>
           <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-sm text-muted-foreground font-tech uppercase break-words">Gas Fee</span>
              <span className="text-sm font-bold text-white">~0.0001 ETH</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-tech uppercase break-words">Network</span>
              <span className="text-lg font-bold text-primary">Base</span>
           </div>
        </div>

        <Button 
          onClick={handleMint}
          disabled={!walletAddress || mintMutation.isPending}
          className="w-full h-16 text-xl font-display font-bold bg-primary hover:bg-primary/90 text-background border-none shadow-[0_0_25px_hsl(var(--primary)/0.4)] transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wallet className="mr-2 w-6 h-6" />
          {mintMutation.isPending ? "MINTING..." : "MINT NFT"}
        </Button>

        <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/30">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-secondary" />
            <h3 className="font-display font-bold text-white break-words">Daily Reward</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 break-words">Claim 1 $DEGEN token every 24 hours</p>
          
          {claimStatus?.canClaim ? (
            <Button
              onClick={() => claimMutation.mutate()}
              disabled={!walletAddress || claimMutation.isPending}
              className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {claimMutation.isPending ? "Claiming..." : "Claim 1 $DEGEN"}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 p-3 bg-white/5 rounded-lg">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground break-words">Next claim in: {timeRemaining}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
           <AlertCircle className="w-3 h-3 flex-shrink-0" />
           <span className="break-words">Dynamic metadata updates with your score</span>
        </div>
      </motion.div>
    </div>
  );
}
