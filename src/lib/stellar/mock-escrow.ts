import { getExplorerContractUrl, getExplorerTxUrl, STELLAR_CONFIG } from './config';

export const STELLAR_FRIEND_BOT_TX_HASH =
  'b2f21a49e436cafd67ea3760160ddd916d8648cea79c9050a7607e0e358bca5c';

export const MOCK_ESCROW_CAMPAIGN = {
  contractId: STELLAR_CONFIG.contractId,
  adminPublic: STELLAR_CONFIG.adminPublic,
  tokenId: STELLAR_CONFIG.tokenId,
  stellarCampaignId: 'demo-comedor-esperanza',
  status: 'funded-pending-milestone',
  balances: {
    escrowXlm: '2500.0000000',
    releasedXlm: '0.0000000',
    pendingMilestoneXlm: '800.0000000',
  },
  milestones: [
    {
      sequence: 1,
      description: 'Compra de alimentos secos y verduras.',
      targetAmountStroops: '8000000000',
      proofId: 'proof-demo-001',
      status: 'pending-validation',
    },
    {
      sequence: 2,
      description: 'Cobertura de meriendas y viandas durante cuatro semanas.',
      targetAmountStroops: '17000000000',
      proofId: null,
      status: 'queued',
    },
  ],
  explorer: {
    contract: getExplorerContractUrl(),
    fundingTx: getExplorerTxUrl(STELLAR_FRIEND_BOT_TX_HASH),
  },
} as const;

export const MOCK_BLEND_ROUTE = {
  protocol: 'Blend',
  network: 'Stellar',
  asset: 'XLM o activo equivalente tokenizado',
  mode: 'native-on-chain',
  note:
    'Blend corre nativamente sobre Stellar. La via mas limpia es retirar del escrow validado y depositar en un pool Blend sin bridge intermedio.',
} as const;

export const MOCK_AAVE_ROUTE = {
  protocol: 'Aave',
  bridge: 'Allbridge Core',
  sourceNetwork: 'Stellar',
  sourceAsset: 'USDC en Stellar',
  destinationNetworks: ['Ethereum', 'Arbitrum', 'Base', 'Optimism', 'Polygon'],
  mode: 'cross-chain',
  note:
    'Para Aave no hay acceso nativo desde Stellar. Hay que convertir el retiro a USDC en Stellar, cruzarlo con Allbridge Core y luego depositarlo en una red EVM soportada por Aave.',
} as const;
