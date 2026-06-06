import { Keypair, Networks, rpc } from '@stellar/stellar-sdk';

export type StellarNetwork = 'testnet' | 'mainnet';

function getNetwork(): StellarNetwork {
  const net = process.env.STELLAR_NETWORK ?? 'testnet';
  return net === 'mainnet' ? 'mainnet' : 'testnet';
}

export function getNetworkPassphrase(): string {
  return getNetwork() === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
}

export function getRpcUrl(): string {
  return process.env.STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org';
}

export function getContractId(): string | null {
  return process.env.STELLAR_CONTRACT_ID || null;
}

export function getAdminKeypair(): Keypair {
  const secret = process.env.STELLAR_ADMIN_SECRET;
  if (!secret) throw new Error('STELLAR_ADMIN_SECRET no configurado');
  return Keypair.fromSecret(secret);
}

export function getStellarRpc(): rpc.Server {
  return new rpc.Server(getRpcUrl(), { allowHttp: false });
}

export function isStellarConfigured(): boolean {
  return !!(
    process.env.STELLAR_CONTRACT_ID &&
    process.env.STELLAR_ADMIN_SECRET
  );
}
