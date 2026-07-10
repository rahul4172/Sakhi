import { ethers } from 'ethers';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-cbc';
const getEncryptionKey = () => {
  const secret = process.env.ENCRYPTION_KEY || 'sakhi_secure_encryption_key_32_characters';
  return crypto.scryptSync(secret, 'sakhi_salt', 32);
};

export class BlockchainService {
  private provider: ethers.Provider | null = null;
  private distributorWallet: ethers.Wallet | null = null;
  private abi: any[] = [];
  private bytecode: string = '';

  constructor() {
    this.init();
  }

  private init() {
    const rpcUrl = process.env.RPC_URL || 'https://sepolia.base.org';
    const distributorKey = process.env.DISTRIBUTOR_PRIVATE_KEY;
    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (!encryptionKey) {
      console.warn('WARNING: ENCRYPTION_KEY is not set. Using fallback key. User wallets may not be secure in production.');
    }

    try {
      const jsonPath = path.resolve(__dirname, '../contracts/SakhiToken.json');
      if (fs.existsSync(jsonPath)) {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        this.abi = data.abi;
        this.bytecode = data.bytecode;
      }
    } catch (e) {
      console.warn('Contracts not compiled yet. Blockchain operations will fail until smart contract is compiled.');
    }

    if (!distributorKey) {
      console.log('BlockchainService initialized with NO active provider (balance will show 0).');
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.distributorWallet = new ethers.Wallet(distributorKey, this.provider);
      console.log(`BlockchainService connected to provider: ${rpcUrl} (Distributor: ${this.distributorWallet.address})`);
    } catch (error) {
      console.error('Failed to connect to blockchain provider:', error);
    }
  }

  encryptKey(privateKey: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptKey(encryptedKey: string): string {
    const key = getEncryptionKey();
    const parts = encryptedKey.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  generateUserWallet(): { address: string; encryptedPrivateKey: string } {
    const wallet = ethers.Wallet.createRandom();
    const encryptedPrivateKey = this.encryptKey(wallet.privateKey);
    return {
      address: wallet.address,
      encryptedPrivateKey
    };
  }

  async getSakhiBalance(walletAddress: string): Promise<number> {
    // No blockchain provider configured — use DB as source of truth
    if (!this.provider || !process.env.TOKEN_CONTRACT_ADDRESS) {
      try {
        const Profile = require('../models/Profile').default;
        const profile = await Profile.findOne({ walletAddress });
        return profile?.tokenBalance ?? 0;
      } catch (error) {
        console.error('Error fetching fallback balance:', error);
        return 0;
      }
    }

    try {
      const contractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
      const contract = new ethers.Contract(contractAddress, this.abi, this.provider);
      const balance = await contract.balanceOf(walletAddress);
      return Number(ethers.formatEther(balance));
    } catch (error) {
      console.error(`Error fetching balance for ${walletAddress}:`, error);
      return 0;
    }
  }

  async deploySakhiTokenContract(): Promise<string> {
    if (!this.distributorWallet) {
      throw new Error('Distributor key not set. Cannot deploy smart contract.');
    }

    try {
      if (this.abi.length === 0 || !this.bytecode) {
        throw new Error('Contract ABI/Bytecode not loaded. Run compilation first.');
      }

      console.log('Deploying SakhiToken smart contract...');
      const factory = new ethers.ContractFactory(this.abi, this.bytecode, this.distributorWallet);
      const contract = await factory.deploy();
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      console.log(`SakhiToken smart contract deployed at: ${address}`);
      return address;
    } catch (error) {
      console.error('Contract deployment failed:', error);
      throw error;
    }
  }

  async earnTokens(
    userAddress: string,
    amount: number,
    description: string
  ): Promise<{ transactionHash: string; status: 'success' | 'failed'; error?: string }> {
    if (!this.distributorWallet || !this.provider) {
      // Fallback to local verified database transaction ledger
      const localHash = '0xlocalTx' + crypto.randomBytes(32).toString('hex');
      return {
        transactionHash: localHash,
        status: 'success'
      };
    }

    try {
      const contractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('TOKEN_CONTRACT_ADDRESS not configured in environment variables');
      }

      const contract = new ethers.Contract(contractAddress, this.abi, this.distributorWallet);
      
      console.log(`Sending on-chain mint tx: ${amount} SAKHI -> ${userAddress}`);
      const tx = await contract.mint(userAddress, ethers.parseEther(amount.toString()));
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        status: 'success'
      };
    } catch (error: any) {
      console.error(`Blockchain earn transaction failed for ${userAddress}:`, error);
      return {
        transactionHash: error.transactionHash || '',
        status: 'failed',
        error: error.message || 'On-chain transaction execution error'
      };
    }
  }

  async redeemTokens(
    userAddress: string,
    amount: number,
    description: string
  ): Promise<{ transactionHash: string; status: 'success' | 'failed'; error?: string }> {
    if (!this.distributorWallet || !this.provider) {
      // Fallback to local verified database transaction ledger
      const localHash = '0xlocalRedeem' + crypto.randomBytes(32).toString('hex');
      return {
        transactionHash: localHash,
        status: 'success'
      };
    }

    try {
      const contractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('TOKEN_CONTRACT_ADDRESS not configured in environment variables');
      }

      const contract = new ethers.Contract(contractAddress, this.abi, this.distributorWallet);

      console.log(`Sending on-chain burn tx: ${amount} SAKHI from ${userAddress}`);
      const tx = await contract.burn(userAddress, ethers.parseEther(amount.toString()));
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        status: 'success'
      };
    } catch (error: any) {
      console.error(`Blockchain redeem transaction failed for ${userAddress}:`, error);
      return {
        transactionHash: error.transactionHash || '',
        status: 'failed',
        error: error.message || 'On-chain transaction execution error'
      };
    }
  }

  getMode() {
    return this.distributorWallet ? 'base-sepolia' : 'not-configured';
  }
}

export const blockchainService = new BlockchainService();
