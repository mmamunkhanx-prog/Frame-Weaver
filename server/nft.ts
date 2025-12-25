import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const NFT_CONTRACT_ADDRESS = '0x5F6287187781Bb591dEA8d8F40Fe791E13f78FC2' as `0x${string}`;
const NATIVE_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as `0x${string}`;

const NFT_DROP_ABI = [
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_receiver', type: 'address' },
      { name: '_quantity', type: 'uint256' },
      { name: '_currency', type: 'address' },
      { name: '_pricePerToken', type: 'uint256' },
      { name: '_allowlistProof', type: 'tuple', components: [
        { name: 'proof', type: 'bytes32[]' },
        { name: 'quantityLimitPerWallet', type: 'uint256' },
        { name: 'pricePerToken', type: 'uint256' },
        { name: 'currency', type: 'address' }
      ]},
      { name: '_data', type: 'bytes' }
    ],
    outputs: []
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'nextTokenIdToClaim',
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
      console.log('Claiming NFT for:', toAddress);
      console.log('Contract:', NFT_CONTRACT_ADDRESS);

      const allowlistProof = {
        proof: [] as `0x${string}`[],
        quantityLimitPerWallet: BigInt(0),
        pricePerToken: BigInt(0),
        currency: NATIVE_TOKEN
      };

      const { request } = await this.publicClient.simulateContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_DROP_ABI,
        functionName: 'claim',
        args: [
          toAddress as `0x${string}`,
          BigInt(1),
          NATIVE_TOKEN,
          BigInt(0),
          allowlistProof,
          '0x' as `0x${string}`
        ],
        account: this.account,
        value: BigInt(0),
      });

      const txHash = await this.walletClient.writeContract(request);
      
      console.log('NFT claim transaction sent:', txHash);

      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash: txHash,
        timeout: 60_000,
      });

      console.log('NFT claim confirmed in block:', receipt.blockNumber);

      let tokenId = '1';
      try {
        const supply = await this.publicClient.readContract({
          address: NFT_CONTRACT_ADDRESS,
          abi: NFT_DROP_ABI,
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
