import { motion } from "framer-motion";
import { Share2, Gift, Clock, RefreshCw } from "lucide-react";
import { ScoreCard } from "@/components/ScoreCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { getNeynarScores, getOrCreateUser, canClaimDegen, claimDegen } from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import sdk from "@farcaster/frame-sdk";

export default function Home() {
  const { toast } = useToast();
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
  
  const { data: userData, isLoading, refetch } = useQuery({
    queryKey: ['neynar-scores', fid],
    queryFn: async () => {
      if (!fid) throw new Error("No FID");
      const scores = await getNeynarScores(fid);
      await getOrCreateUser(scores.fid, scores.username, scores.displayName, scores.pfp);
      return scores;
    },
    enabled: !!fid,
    staleTime: 60000,
  });

  const { data: dbUser } = useQuery({
    queryKey: ['db-user-home', fid],
    queryFn: async () => {
      if (!userData) return null;
      return getOrCreateUser(userData.fid, userData.username, userData.displayName, userData.pfp);
    },
    enabled: !!userData,
  });

  const { data: claimStatus, refetch: refetchClaimStatus } = useQuery({
    queryKey: ['claim-status-home', dbUser?.id],
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

  useEffect(() => {
    async function autoConnectWallet() {
      if (!userData?.fid || walletAddress) return;
      
      try {
        const context = await sdk.context;
        const user = context?.user as any;
        
        if (user?.custody_address) {
          setWalletAddress(user.custody_address);
          return;
        }
        
        const connectedAddress = (context as any)?.connectedAddress;
        if (connectedAddress) {
          setWalletAddress(connectedAddress);
          return;
        }

        const response = await fetch(`/api/user-wallet/${userData.fid}`);
        if (response.ok) {
          const data = await response.json();
          if (data.walletAddress) {
            setWalletAddress(data.walletAddress);
            return;
          }
        }
      } catch (error) {
        console.error("Auto wallet connection error:", error);
      }
    }
    
    autoConnectWallet();
  }, [userData?.fid]);

  const handleShare = () => {
    if (!userData) return;
    
    const appUrl = "https://frame-weaver--mamunkhann.replit.app";
    const text = `My Farcaster Scores are in!%0A%0ANeynar: ${Math.round(userData.neynarScore * 100)}%0AQuotient: ${Math.round(userData.quotientScore * 100)}%0A%0ACheck yours here! ${appUrl}`;
    const url = `https://warpcast.com/~/compose?text=${text}`;
    
    window.open(url, '_blank');

    toast({
      title: "Opening Warpcast",
      description: "Share your scores with the world!",
      duration: 3000,
    });
  };

  const handleRefresh = async () => {
    toast({
      title: "Refreshing Scores",
      description: "Fetching latest data from Neynar...",
    });
    
    await refetch();
    
    toast({
      title: "Scores Updated",
      description: "Your latest scores have been loaded.",
    });
  };

  if (isLoadingContext || isLoading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your scores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20 pt-8 px-4 max-w-md mx-auto min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-2"
      >
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-75 animate-pulse"></div>
          <Avatar className="h-16 w-16 border-2 border-background relative">
            <AvatarImage src={userData.pfp} alt={userData.username} />
            <AvatarFallback>{userData.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-display font-bold text-white tracking-wide truncate break-words">
            {userData.displayName}
          </h1>
          <p className="text-muted-foreground font-tech text-lg truncate break-words">@{userData.username}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white uppercase tracking-wider">
              FID: {userData.fid}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase tracking-wider">
              Verified
            </span>
          </div>
        </div>
        <Button
            size="icon"
            variant="outline"
            onClick={handleRefresh}
            className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-primary"
        >
            <RefreshCw className="w-4 h-4" />
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4">
        <ScoreCard 
          title="Neynar Score" 
          score={userData.neynarScore} 
          type="neynar" 
        />
        <ScoreCard 
          title="Quotient Score" 
          score={userData.quotientScore} 
          type="quotient" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-xl bg-secondary/10 border border-secondary/30 break-words"
      >
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button 
          onClick={handleShare}
          className="w-full h-14 text-lg font-display font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity border-none shadow-[0_0_20px_hsl(var(--primary)/0.3)] text-white cursor-pointer"
        >
          <Share2 className="mr-2 w-5 h-5" />
          Share My Score
        </Button>
      </motion.div>
    </div>
  );
}
