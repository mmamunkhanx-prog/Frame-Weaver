import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// $DEGEN token contract address on Base
const DEGEN_TOKEN_ADDRESS = '0x4ed4E862860beD51a9570b96d89aF5E1B0Effed4' as const;

// ERC20 ABI for transfer function
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  }
] as const;

class DegenService {
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
        console.warn('DegenService: ' + this.initError);
        return;
      }

      // Remove 0x prefix if present and add it back
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

      console.log('DegenService initialized successfully');
    } catch (error) {
      this.initError = 'Failed to initialize wallet: ' + (error as Error).message;
      console.error('DegenService initialization error:', error);
    }
  }

  isConfigured(): boolean {
    this.initialize();
    return this.account !== null && this.initError === null;
  }

  async sendDegen(toAddress: string, amount: string = '1'): Promise<{ hash: string; success: boolean }> {
    this.initialize();
    
    if (!this.isConfigured()) {
      throw new Error(this.initError || 'DegenService not configured');
    }

    try {
      // Convert amount to wei (DEGEN has 18 decimals)
      const amountInWei = parseEther(amount);

      // Execute the transfer
      const hash = await this.walletClient.writeContract({
        address: DEGEN_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [toAddress as `0x${string}`, amountInWei],
      });

      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1
      });

      return {
        hash,
        success: receipt.status === 'success'
      };
    } catch (error) {
      console.error('Error sending DEGEN:', error);
      throw new Error('Failed to send DEGEN tokens');
    }
  }

  async getBalance(): Promise<string> {
    this.initialize();
    
    if (!this.isConfigured()) {
      return '0';
    }

    try {
      const balance = await this.publicClient.readContract({
        address: DEGEN_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [this.account.address],
      });

      return formatEther(balance as bigint);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  getAdminAddress(): string | null {
    this.initialize();
    return this.account?.address || null;
  }
}

export const degenService = new DegenService();
