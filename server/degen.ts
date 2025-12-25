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

export class DegenService {
  private walletClient;
  private publicClient;
  private account;

  constructor() {
    if (!process.env.ADMIN_WALLET_PRIVATE_KEY) {
      throw new Error('ADMIN_WALLET_PRIVATE_KEY not configured');
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
  }

  async sendDegen(toAddress: string, amount: string = '1'): Promise<{ hash: string; success: boolean }> {
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

  getAdminAddress(): string {
    return this.account.address;
  }
}

export const degenService = new DegenService();
