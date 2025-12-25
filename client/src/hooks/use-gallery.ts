import { useState, useEffect } from 'react';
import generatedImage from '@assets/generated_images/dark_futuristic_neon_grid_background.png';

export interface NFT {
  id: string;
  date: string;
  image: string;
}

const STORAGE_KEY = 'neonframe_gallery';

export function useGallery() {
  const [nfts, setNfts] = useState<NFT[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setNfts(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse gallery data", e);
      }
    }
  }, []);

  const addNft = () => {
    const newNft: NFT = {
      id: Math.floor(Math.random() * 10000).toString(),
      date: new Date().toISOString().split('T')[0],
      image: generatedImage
    };

    const updated = [newNft, ...nfts];
    setNfts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newNft;
  };

  return { nfts, addNft };
}
