export interface UserData {
  fid: number;
  username: string;
  displayName: string;
  pfp: string;
  neynarScore: number;
  quotientScore: number;
}

// This is a fallback for demo purposes - real data comes from Neynar API
export const CURRENT_USER: UserData = {
  fid: 1234,
  username: "crypto_architect",
  displayName: "Alex Neo",
  pfp: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  neynarScore: 92.5,
  quotientScore: 88.3
};
