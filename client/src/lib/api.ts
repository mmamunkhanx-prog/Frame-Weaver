import type { User, NFT, DegenClaim } from "@shared/schema";

export async function getOrCreateUser(fid: number, username: string, displayName: string, pfp: string): Promise<User> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fid, username, displayName, pfp })
  });
  
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
}

export async function updateUserWallet(fid: number, walletAddress: string): Promise<User> {
  const res = await fetch(`/api/users/${fid}/wallet`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });
  
  if (!res.ok) throw new Error('Failed to update wallet');
  return res.json();
}

export async function getNeynarScores(fid: number) {
  const res = await fetch(`/api/neynar/scores/${fid}`);
  
  if (!res.ok) throw new Error('Failed to fetch scores');
  return res.json();
}

export async function createNft(nftData: {
  userId: number;
  tokenId: string;
  transactionHash?: string;
  neynarScore: string;
  quotientScore: string;
}): Promise<NFT> {
  const res = await fetch('/api/nfts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nftData)
  });
  
  if (!res.ok) throw new Error('Failed to create NFT');
  return res.json();
}

export async function getUserNfts(userId: number): Promise<NFT[]> {
  const res = await fetch(`/api/nfts/user/${userId}`);
  
  if (!res.ok) throw new Error('Failed to fetch NFTs');
  return res.json();
}

export async function canClaimDegen(userId: number) {
  const res = await fetch(`/api/degen/can-claim/${userId}`);
  
  if (!res.ok) throw new Error('Failed to check claim status');
  return res.json();
}

export async function claimDegen(userId: number, walletAddress: string) {
  const res = await fetch('/api/degen/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, walletAddress })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to claim DEGEN');
  }
  
  return res.json();
}

export async function getNftInfo() {
  const res = await fetch('/api/nfts/info');
  
  if (!res.ok) throw new Error('Failed to get NFT info');
  return res.json();
}

export async function mintNft(data: {
  userId: number;
  walletAddress: string;
  neynarScore: number;
  quotientScore: number;
  username: string;
  fid: number;
}) {
  const res = await fetch('/api/nfts/mint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to mint NFT');
  }
  
  return res.json();
}
