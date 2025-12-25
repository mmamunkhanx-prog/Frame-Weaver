import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const NFT_CONTRACT_ADDRESS = '0xc48556A734DF31b1788295D859ad4e602ea02a23' as `0x${string}`;

const NFT_COLLECTION_ABI = [
  {
    name: 'mintTo',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_uri', type: 'string' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'nextTokenIdToMint',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

class NftService {
  private walletClient: any = null;
  private publicClient: any = null;
  private account: any = null;
  private initialized = false;
  private initError: string | null = null;

  private initialize() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      if (!process.env.ADMIN_WALLET_PRIVATE_KEY) {
        this.initError = 'ADMIN_WALLET_PRIVATE_KEY not configured';
        console.warn('NftService: ' + this.initError);
        return;
      }

      const privateKey = process.env.ADMIN_WALLET_PRIVATE_KEY.startsWith('0x') 
        ? process.env.ADMIN_WALLET_PRIVATE_KEY as `0x${string}`
        : `0x${process.env.ADMIN_WALLET_PRIVATE_KEY}` as `0x${string}`;

      this.account = privateKeyToAccount(privateKey);

      this.walletClient = createWalletClient({
        account: this.account,
        chain: base,
        transport: http()
      });

      this.publicClient = createPublicClient({
        chain: base,
        transport: http()
      });

      console.log('NftService initialized with address:', this.account.address);
    } catch (error) {
      this.initError = 'Failed to initialize wallet: ' + (error as Error).message;
      console.error('NftService initialization error:', error);
    }
  }

  isConfigured(): boolean {
    this.initialize();
    return this.account !== null && this.initError === null;
  }

  getAdminAddress(): string | null {
    this.initialize();
    return this.account?.address || null;
  }

  async getEthBalance(): Promise<string> {
    this.initialize();
    
    if (!this.isConfigured()) {
      return '0';
    }

    try {
      const balance = await this.publicClient.getBalance({
        address: this.account.address,
      });

      return formatEther(balance);
    } catch (error) {
      console.error('Error getting ETH balance:', error);
      return '0';
    }
  }

  private generateMetadataUri(metadata: {
    name: string;
    description: string;
    neynarScore: number;
    quotientScore: number;
    username: string;
    fid: number;
  }): string {
    const metadataJson = {
      name: metadata.name,
      description: metadata.description,
      image: "https://neonframe.replit.app/nft-image.png",
      attributes: [
        { trait_type: 'Neynar Score', value: Math.round(metadata.neynarScore * 100).toString() },
        { trait_type: 'Quotient Score', value: Math.round(metadata.quotientScore * 100).toString() },
        { trait_type: 'Username', value: metadata.username },
        { trait_type: 'FID', value: metadata.fid.toString() },
        { trait_type: 'Minted On', value: new Date().toISOString().split('T')[0] }
      ],
      external_url: `https://warpcast.com/${metadata.username}`,
    };
    
    const base64 = Buffer.from(JSON.stringify(metadataJson)).toString('base64');
    return `data:application/json;base64,${base64}`;
  }

  async mintNft(
    toAddress: string,
    metadata: {
      name: string;
      description: string;
      neynarScore: number;
      quotientScore: number;
      username: string;
      fid: number;
    }
  ): Promise<{ success: boolean; txHash?: string; tokenId?: string; error?: string }> {
    this.initialize();

    if (!this.isConfigured()) {
      return { 
        success: false, 
        error: 'NFT minting not configured - admin wallet required' 
      };
    }

    try {
      const metadataUri = this.generateMetadataUri(metadata);
      
      console.log('Minting NFT to:', toAddress);
      console.log('Contract:', NFT_CONTRACT_ADDRESS);

      const { request } = await this.publicClient.simulateContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_COLLECTION_ABI,
        functionName: 'mintTo',
        args: [
          toAddress as `0x${string}`,
          metadataUri
        ],
        account: this.account,
      });

      const txHash = await this.walletClient.writeContract(request);
      
      console.log('NFT mint transaction sent:', txHash);

      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash: txHash,
        timeout: 60_000,
      });

      console.log('NFT mint confirmed in block:', receipt.blockNumber);

      let tokenId = '1';
      try {
        const supply = await this.publicClient.readContract({
          address: NFT_CONTRACT_ADDRESS,
          abi: NFT_COLLECTION_ABI,
          functionName: 'totalSupply',
        });
        tokenId = supply.toString();
      } catch (e) {
        console.log('Could not get total supply');
      }

      return {
        success: true,
        txHash: txHash,
        tokenId: tokenId,
      };

    } catch (error) {
      console.error('Error minting NFT:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  getMintPrice(): string {
    return '0';
  }

  getTotalMintCost(): string {
    return '~0.0001 ETH (gas only)';
  }

  getContractAddress(): string {
    return NFT_CONTRACT_ADDRESS;
  }
}

export const nftService = new NftService();
