export interface UserData {
  fid: number;
  username: string;
  displayName: string;
  pfp: string;
  neynarScore: number;
  quotientScore: number;
}

export const CURRENT_USER: UserData = {
  fid: 1234,
  username: "crypto_architect",
  displayName: "Alex Neo",
  pfp: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  neynarScore: 92.5,
  quotientScore: 88.3
};

export const LEADERBOARD_DATA: UserData[] = [
  { fid: 1, username: "dwr.eth", displayName: "Dan Romero", pfp: "https://github.com/shadcn.png", neynarScore: 99.9, quotientScore: 98.5 },
  { fid: 2, username: "v", displayName: "Varun", pfp: "https://github.com/shadcn.png", neynarScore: 99.2, quotientScore: 97.1 },
  { fid: 56, username: "vitalik", displayName: "Vitalik Buterin", pfp: "https://github.com/shadcn.png", neynarScore: 98.7, quotientScore: 99.0 },
  { fid: 88, username: "balajis", displayName: "Balaji", pfp: "https://github.com/shadcn.png", neynarScore: 97.5, quotientScore: 96.2 },
  { fid: 412, username: "jessie", displayName: "Jessie", pfp: "https://github.com/shadcn.png", neynarScore: 96.8, quotientScore: 94.5 },
  { fid: 1234, username: "crypto_architect", displayName: "Alex Neo", pfp: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", neynarScore: 92.5, quotientScore: 88.3 },
  { fid: 991, username: "pixels", displayName: "Pixel Art", pfp: "https://github.com/shadcn.png", neynarScore: 91.2, quotientScore: 89.1 },
  { fid: 332, username: "builder", displayName: "Bob", pfp: "https://github.com/shadcn.png", neynarScore: 90.5, quotientScore: 85.4 },
  { fid: 777, username: "lucky", displayName: "Lucky Strike", pfp: "https://github.com/shadcn.png", neynarScore: 89.9, quotientScore: 88.2 },
  { fid: 1024, username: "byte", displayName: "Byte Code", pfp: "https://github.com/shadcn.png", neynarScore: 88.4, quotientScore: 86.7 },
];
