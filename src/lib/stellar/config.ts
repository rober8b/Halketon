export const STELLAR_CONFIG = {
  network: (process.env.STELLAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet') as
    | 'testnet'
    | 'mainnet',
  rpcUrl: process.env.STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  contractId:
    process.env.STELLAR_CONTRACT_ID ??
    'CA2A624HHQVMBQUBA3ZPSZ6L3BOIYIQQHICJ26DJRCHAOL7TT2T226SQ',
  adminSecret: process.env.STELLAR_ADMIN_SECRET ?? '',
  adminPublic: process.env.STELLAR_ADMIN_PUBLIC ?? '',
  tokenId:
    process.env.STELLAR_TOKEN_ID ??
    'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  explorerBase:
    process.env.STELLAR_NETWORK === 'mainnet'
      ? 'https://stellar.expert/explorer/public'
      : 'https://stellar.expert/explorer/testnet',
} as const;

export function getExplorerTxUrl(txHash: string): string {
  return `${STELLAR_CONFIG.explorerBase}/tx/${txHash}`;
}

export function getExplorerContractUrl(): string {
  return `${STELLAR_CONFIG.explorerBase}/contract/${STELLAR_CONFIG.contractId}`;
}

export function getStellarFallbackReason(): string | null {
  if (!process.env.STELLAR_CONTRACT_ID) {
    return 'Usando contract ID fallback de LEO_WB01 hasta completar el deploy real.';
  }

  return null;
}
