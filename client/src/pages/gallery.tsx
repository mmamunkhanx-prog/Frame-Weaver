import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import generatedImage from '@assets/generated_images/dark_futuristic_neon_grid_background.png';
import { getNeynarScores, getUserNfts, getOrCreateUser } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import sdk from "@farcaster/frame-sdk";

export default function Gallery() {
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

  const { data: nfts = [], isLoading } = useQuery({
    queryKey: ['user-nfts', dbUser?.id],
    queryFn: () => getUserNfts(dbUser!.id),
    enabled: !!dbUser,
  });

  const handleShare = (tokenId: string) => {
    const appUrl = "https://frame-weaver--mamunkhann.replit.app";
    const text = `Check out my Minted Profile NFT on NeonFrame! Token #${tokenId}\n\nMint yours here! ${appUrl}`;
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');

    toast({
      title: "Opening Warpcast",
      description: "Share your NFT with your followers!",
      duration: 3000,
    });
  };

  if (isLoadingContext || isLoading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading gallery...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-display font-bold text-white neon-text mb-2 break-words">My Gallery</h1>
        <p className="text-muted-foreground font-tech uppercase tracking-widest text-sm break-words">
          Your Minted Profiles
        </p>
      </div>

      {nfts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2 break-words">No NFTs minted yet</p>
          <p className="text-sm text-muted-foreground break-words">Visit the Profile tab to mint your first NFT!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {nfts.map((nft, index) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card/30 rounded-2xl p-4 border border-white/5 backdrop-blur-sm"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-4 border border-white/5">
                <div className="absolute inset-0 bg-[#050505]">
                  <img 
                    src={generatedImage} 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-60 mix-blend-screen"
                  />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <img src={userData.pfp} className="w-16 h-16 rounded-xl border-2 border-primary/50 mb-2" alt="Profile" />
                  <div className="text-center">
                    <div className="font-display font-bold text-white text-lg break-words">{userData.displayName}</div>
                    <div className="font-tech text-primary text-xs break-words">@{userData.username}</div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-white font-mono break-words">
                      Neynar: {nft.neynarScore}
                    </div>
                    <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-white font-mono break-words">
                      Qt: {nft.quotientScore}
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-white border border-white/10 break-words">
                  #{nft.tokenId}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground font-mono break-words">
                  Minted: {new Date(nft.mintedAt).toLocaleDateString()}
                </div>
                <Button 
                  size="sm"
                  variant="outline"
                  className="bg-white/5 border-primary/20 hover:bg-primary/10 text-primary hover:text-primary break-words"
                  onClick={() => handleShare(nft.tokenId)}
                >
                  <Share2 className="w-3 h-3 mr-2" />
                  Share to Feed
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
