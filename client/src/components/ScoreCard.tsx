import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  title: string;
  score: number;
  type: "neynar" | "quotient";
  className?: string;
}

export function ScoreCard({ title, score, type, className }: ScoreCardProps) {
  const isNeynar = type === "neynar";
  const colorClass = isNeynar ? "text-primary" : "text-secondary";
  const borderClass = isNeynar ? "border-primary/30" : "border-secondary/30";
  const bgGradient = isNeynar 
    ? "bg-gradient-to-br from-primary/10 to-transparent" 
    : "bg-gradient-to-br from-secondary/10 to-transparent";

  const displayValue = Math.round(score * 100);
  const percentage = Math.min(displayValue, 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 border backdrop-blur-sm",
        borderClass,
        bgGradient,
        className
      )}
    >
      <div className="relative z-10 flex justify-between items-end">
        <div>
          <h3 className="text-sm font-tech uppercase tracking-widest text-muted-foreground mb-1">
            {title}
          </h3>
          <div className={cn("text-4xl font-display font-bold tabular-nums neon-text", colorClass)}>
            {displayValue}<span className="text-lg opacity-50">/100</span>
          </div>
        </div>
        
        <div className="h-12 w-12 rounded-full border-4 border-white/5 flex items-center justify-center relative">
           <svg className="absolute inset-0 rotate-[-90deg]" viewBox="0 0 100 100">
             <circle 
               cx="50" cy="50" r="40" 
               fill="transparent" 
               stroke="currentColor" 
               strokeWidth="8"
               className={cn("opacity-20", colorClass)}
             />
             <circle 
               cx="50" cy="50" r="40" 
               fill="transparent" 
               stroke="currentColor" 
               strokeWidth="8"
               strokeDasharray={`${percentage * 2.51} 251`}
               strokeLinecap="round"
               className={cn(colorClass)}
             />
           </svg>
        </div>
      </div>

      <div className={cn(
        "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none",
        isNeynar ? "bg-primary" : "bg-secondary"
      )} />
    </motion.div>
  );
}
