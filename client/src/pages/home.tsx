import { motion } from "framer-motion";
import { Share2, Zap, RefreshCw } from "lucide-react";
import { ScoreCard } from "@/components/ScoreCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { getNeynarScores, getOrCreateUser } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import sdk from "@farcaster/frame-sdk";

export default function Home() {
  const { toast } = useToast();
  const [fid, setFid] = useState<number | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  
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

  const handleShare = () => {
    if (!userData) return;
    
    const text = `My Farcaster Scores are in!%0A%0ANeynar: ${userData.neynarScore.toFixed(1)}%0AQuotient: ${userData.quotientScore.toFixed(1)}%0A%0ACheck yours here!`;
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
        className="p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm break-words"
      >
        <div className="flex items-center gap-2 mb-2 text-primary font-tech uppercase tracking-wider text-sm">
          <Zap className="w-4 h-4 flex-shrink-0" />
          <span>Performance Insight</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed break-words">
          Your engagement score places you among Farcaster's active users. Keep building to improve your Quotient score.
        </p>
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
