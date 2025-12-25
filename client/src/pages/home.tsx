import { motion } from "framer-motion";
import { Share2, Zap } from "lucide-react";
import { ScoreCard } from "@/components/ScoreCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CURRENT_USER } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();

  const handleShare = () => {
    const text = `I just checked my stats on NeonFrame!%0A%0ANeynar Score: ${CURRENT_USER.neynarScore}%0AQuotient Score: ${CURRENT_USER.quotientScore}`;
    const url = `https://warpcast.com/~/compose?text=${text}`;
    
    window.open(url, '_blank');

    toast({
      title: "Opening Warpcast",
      description: "Prepare to cast your scores!",
      duration: 3000,
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-20 pt-8 px-4 max-w-md mx-auto min-h-screen">
      {/* Header Profile */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-2"
      >
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-75 animate-pulse"></div>
          <Avatar className="h-16 w-16 border-2 border-background relative">
            <AvatarImage src={CURRENT_USER.pfp} alt={CURRENT_USER.username} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">
            {CURRENT_USER.displayName}
          </h1>
          <p className="text-muted-foreground font-tech text-lg">@{CURRENT_USER.username}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white uppercase tracking-wider">
              FID: {CURRENT_USER.fid}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase tracking-wider">
              Verified
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Score Area */}
      <div className="grid grid-cols-1 gap-4">
        <ScoreCard 
          title="Neynar Score" 
          score={CURRENT_USER.neynarScore} 
          type="neynar" 
        />
        <ScoreCard 
          title="Quotient Score" 
          score={CURRENT_USER.quotientScore} 
          type="quotient" 
        />
      </div>

      {/* Insight Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-2 text-primary font-tech uppercase tracking-wider text-sm">
          <Zap className="w-4 h-4" />
          <span>Performance Insight</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your engagement is in the top <span className="text-white font-bold">5%</span> of Farcaster users. Keep active to maintain your high Quotient score.
        </p>
      </motion.div>

      {/* Share Button */}
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
          Share on Warpcast
        </Button>
      </motion.div>
    </div>
  );
}
