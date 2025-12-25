import { motion } from "framer-motion";
import { Share2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import generatedImage from '@assets/generated_images/dark_futuristic_neon_grid_background.png';
import { CURRENT_USER } from "@/lib/mockData";

export default function Gallery() {
  const { toast } = useToast();

  const handleShare = (tokenId: string) => {
    const text = `Check out my Minted Profile NFT on NeonFrame! Token #${tokenId}`;
    // Using a placeholder image URL for the share intent since we can't upload local assets
    const embedUrl = "https://neonframe.app/nft-preview.png"; 
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(embedUrl)}`;
    
    window.open(url, '_blank');

    toast({
      title: "Opening Warpcast",
      description: "Share your NFT with your followers!",
      duration: 3000,
    });
  };

  // Mock data for minted NFTs
  const MINTED_NFTS = [
    { id: "1042", date: "2024-03-10", image: generatedImage },
    { id: "892", date: "2024-02-28", image: generatedImage },
    { id: "156", date: "2024-01-15", image: generatedImage },
  ];

  return (
    <div className="flex flex-col gap-6 pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-display font-bold text-white neon-text mb-2">My Gallery</h1>
        <p className="text-muted-foreground font-tech uppercase tracking-widest text-sm">
          Your Minted Profiles
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {MINTED_NFTS.map((nft, index) => (
          <motion.div
            key={nft.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card/30 rounded-2xl p-4 border border-white/5 backdrop-blur-sm"
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-4 border border-white/5">
                {/* Visual Simulation of the NFT content */}
               <div className="absolute inset-0 bg-[#050505]">
                  <img 
                    src={nft.image} 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-60 mix-blend-screen"
                  />
               </div>
               <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <img src={CURRENT_USER.pfp} className="w-16 h-16 rounded-xl border-2 border-primary/50 mb-2" />
                  <div className="text-center">
                    <div className="font-display font-bold text-white text-lg">{CURRENT_USER.displayName}</div>
                    <div className="font-tech text-primary text-xs">@{CURRENT_USER.username}</div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-white font-mono">
                      Neynar: {CURRENT_USER.neynarScore}
                    </div>
                    <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-white font-mono">
                      Qt: {CURRENT_USER.quotientScore}
                    </div>
                  </div>
               </div>
               
               <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-white border border-white/10">
                 #{nft.id}
               </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground font-mono">
                Minted: {nft.date}
              </div>
              <Button 
                size="sm"
                variant="outline"
                className="bg-white/5 border-primary/20 hover:bg-primary/10 text-primary hover:text-primary break-all"
                onClick={() => handleShare(nft.id)}
              >
                <Share2 className="w-3 h-3 mr-2" />
                Share to Feed
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
