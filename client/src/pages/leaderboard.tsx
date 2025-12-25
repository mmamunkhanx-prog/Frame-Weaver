import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LEADERBOARD_DATA } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";

export default function Leaderboard() {
  return (
    <div className="flex flex-col gap-6 pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-display font-bold text-white neon-text mb-2">Top 10</h1>
        <p className="text-muted-foreground font-tech uppercase tracking-widest text-sm">
          Highest Neynar Scores
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {LEADERBOARD_DATA.sort((a, b) => b.neynarScore - a.neynarScore).map((user, index) => (
          <motion.div
            key={user.fid}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border backdrop-blur-sm transition-all",
              index === 0 
                ? "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]" 
                : "bg-card/40 border-white/5 hover:bg-card/60"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-8 h-8 font-display font-bold text-lg",
              index === 0 ? "text-yellow-500" : 
              index === 1 ? "text-gray-300" :
              index === 2 ? "text-amber-700" : "text-muted-foreground"
            )}>
              {index === 0 ? <Crown className="w-6 h-6" /> : `#${index + 1}`}
            </div>

            <Avatar className={cn("h-10 w-10 border", index === 0 ? "border-yellow-500" : "border-white/10")}>
              <AvatarImage src={user.pfp} />
              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate">{user.displayName}</h3>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>

            <div className="text-right">
              <div className="text-lg font-display font-bold text-primary neon-text">
                {user.neynarScore.toFixed(1)}
              </div>
              <div className="text-[10px] text-muted-foreground font-tech uppercase">Score</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
