import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CURRENT_USER } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Sparkles, CheckCircle2 } from "lucide-react";
import generatedImage from '@assets/generated_images/dark_futuristic_neon_grid_background.png';

export default function Profile() {
  const { toast } = useToast();

  const handleMint = () => {
    toast({
      title: "Minting Initiated",
      description: "Please confirm transaction in your wallet.",
      duration: 3000,
    });
    
    // Simulate success after delay
    setTimeout(() => {
        toast({
            title: "Mint Successful!",
            description: "Your Profile NFT has been minted on Base.",
            variant: "default",
            duration: 3000,
        });
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-display font-bold text-white neon-text mb-2">Mint Profile</h1>
        <p className="text-muted-foreground font-tech uppercase tracking-widest text-sm">
          On-Chain Identity
        </p>
      </div>

      {/* NFT Preview Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative aspect-[3/4] w-full max-w-[320px] mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,243,255,0.15)] group"
      >
        {/* NFT Background */}
        <div className="absolute inset-0 bg-[#050505]">
          <img 
            src={generatedImage} 
            alt="Background" 
            className="w-full h-full object-cover opacity-60 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Content Overlay */}
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
               <img src={CURRENT_USER.pfp} alt="Profile" className="w-full h-full object-cover" />
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-white mb-1">{CURRENT_USER.displayName}</h2>
              <p className="text-primary font-mono text-sm">@{CURRENT_USER.username}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/5 text-center">
                <div className="text-[10px] uppercase text-muted-foreground font-tech mb-1">Neynar Score</div>
                <div className="text-xl font-display font-bold text-white">{CURRENT_USER.neynarScore}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/5 text-center">
                <div className="text-[10px] uppercase text-muted-foreground font-tech mb-1">Quotient</div>
                <div className="text-xl font-display font-bold text-white">{CURRENT_USER.quotientScore}</div>
              </div>
            </div>
          </div>
          
           <div className="text-center pt-4 border-t border-white/10">
              <p className="text-[10px] font-mono text-white/40 tracking-[0.2em] uppercase">Authenticated via Farcaster</p>
           </div>
        </div>
      </motion.div>

      {/* Mint Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="bg-card/50 rounded-xl p-4 border border-white/5 flex justify-between items-center">
          <div className="flex flex-col">
             <span className="text-sm text-muted-foreground font-tech uppercase">Price</span>
             <span className="text-lg font-bold text-white">0.00005 ETH</span>
          </div>
          <div className="flex flex-col text-right">
             <span className="text-sm text-muted-foreground font-tech uppercase">Network</span>
             <span className="text-lg font-bold text-primary">Base</span>
          </div>
        </div>

        <Button 
          onClick={handleMint}
          className="w-full h-16 text-xl font-display font-bold bg-primary hover:bg-primary/90 text-background border-none shadow-[0_0_25px_hsl(var(--primary)/0.4)] transition-all hover:scale-[1.02]"
        >
          <Wallet className="mr-2 w-6 h-6" />
          MINT NFT
        </Button>
        
        <p className="text-center text-xs text-muted-foreground">
          Unlimited Minting Allowed • Dynamic Metadata
        </p>
      </motion.div>
    </div>
  );
}
