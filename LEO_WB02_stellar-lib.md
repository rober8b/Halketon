# LEO_WB02 — lib/stellar/ en el repo Next.js
**Owner:** Leo  
**Estado:** ⏳ Pendiente  
**Depende de:** LEO_WB01 (necesita contract ID y admin secret en `.env`)  
**Tiempo estimado:** 1.5 horas  

---

## Objetivo

Implementar la capa de abstracción de Stellar dentro del repo `en-masa-social` (Next.js). Crear `src/lib/stellar/` con tres archivos: config, client y contract wrappers. Rober va a usar estos wrappers en ROBER_WB07 sin saber nada de Stellar SDK.

---

## Contexto

El repo Next.js ya tiene las variables de entorno de Stellar (que Leo pasó en SYNC 1). Esta librería expone funciones tipadas que el backend de Next.js puede llamar. Toda la complejidad de Stellar (keypairs, XDR, RPC, invocaciones) queda encapsulada acá.

---

## Pasos

### 1. Instalar Stellar SDK

```bash
# Desde la raíz del repo en-masa-social
npm install @stellar/stellar-sdk
```

### 2. Crear `src/lib/stellar/config.ts`

```typescript
// src/lib/stellar/config.ts
export const STELLAR_CONFIG = {
  network: process.env.STELLAR_NETWORK as 'testnet' | 'mainnet',
  rpcUrl: process.env.STELLAR_RPC_URL!,
  contractId: process.env.STELLAR_CONTRACT_ID!,
  adminSecret: process.env.STELLAR_ADMIN_SECRET!,
  tokenId: process.env.STELLAR_TOKEN_ID!,
  adminPublic: process.env.STELLAR_ADMIN_PUBLIC!,
  explorerBase: 'https://stellar.expert/explorer/testnet',
} as const;

export function getExplorerTxUrl(txHash: string): string {
  return `${STELLAR_CONFIG.explorerBase}/tx/${txHash}`;
}

export function getExplorerContractUrl(): string {
  return `${STELLAR_CONFIG.explorerBase}/contract/${STELLAR_CONFIG.contractId}`;
}
```

### 3. Crear `src/lib/stellar/client.ts`

```typescript
// src/lib/stellar/client.ts
import {
  SorobanRpc,
  Keypair,
  Networks,
  Transaction,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from './config';

const server = new SorobanRpc.Server(STELLAR_CONFIG.rpcUrl, { allowHttp: false });
const adminKeypair = Keypair.fromSecret(STELLAR_CONFIG.adminSecret);
const networkPassphrase = STELLAR_CONFIG.network === 'testnet'
  ? Networks.TESTNET
  : Networks.PUBLIC;

export { server, adminKeypair, networkPassphrase, nativeToScVal, scValToNative, xdr };

/**
 * Invoca una función del contrato y espera confirmación.
 * Firma siempre con el admin keypair.
 */
export async function invokeContract(
  method: string,
  args: xdr.ScVal[]
): Promise<{ result: unknown; txHash: string }> {
  const contract = new Contract(STELLAR_CONFIG.contractId);
  const account = await server.getAccount(adminKeypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  (preparedTx as Transaction).sign(adminKeypair);

  const response = await server.sendTransaction(preparedTx);
  if (response.status === 'ERROR') {
    throw new Error(`Stellar tx error: ${JSON.stringify(response.errorResult)}`);
  }

  // Poll hasta confirmación
  const hash = response.hash;
  let getResponse = await server.getTransaction(hash);
  let attempts = 0;
  while (getResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
    if (attempts++ > 20) throw new Error('Stellar tx timeout');
    await new Promise(r => setTimeout(r, 3000));
    getResponse = await server.getTransaction(hash);
  }

  if (getResponse.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Stellar tx failed: ${getResponse.status}`);
  }

  return {
    result: getResponse.returnValue ? scValToNative(getResponse.returnValue) : null,
    txHash: hash,
  };
}

/**
 * Consulta de solo lectura (no firma, no fee).
 */
export async function simulateContract(
  method: string,
  args: xdr.ScVal[]
): Promise<unknown> {
  const contract = new Contract(STELLAR_CONFIG.contractId);
  const account = await server.getAccount(adminKeypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulate error: ${JSON.stringify(sim)}`);
  }

  if (sim.result?.retval) return scValToNative(sim.result.retval);
  return null;
}
```

### 4. Crear `src/lib/stellar/contract.ts`

```typescript
// src/lib/stellar/contract.ts
// Wrappers tipados de las funciones del crowdfunding-contract.
// Rober llama estas funciones desde el backend — no necesita saber nada de Stellar SDK.

import { nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { invokeContract, simulateContract } from './client';
import { getExplorerTxUrl, getExplorerContractUrl, STELLAR_CONFIG } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StellarCampaign {
  id: string;
  creator: string;
  title: string;
  description: string;
  goal: bigint;
  minDonation: bigint;
  totalRaised: bigint;
  supporters: number;
  milestonesCount: number;
  currentMilestone: number;
  withdrawableAmount: bigint;
}

export interface StellarMilestone {
  campaignId: string;
  sequence: number;
  targetAmount: bigint;
  description: string;
  completed: boolean;
  proofId: string | null;
  completedAt: bigint | null;
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

/**
 * Crea una campaña on-chain.
 * @param campaignId - el slug de la campaña (ej: "kits-escolares-2026")
 * @param goal - monto objetivo en stroops (1 XLM = 10_000_000 stroops)
 */
export async function addCampaign(params: {
  campaignId: string;
  title: string;
  description: string;
  goal: bigint;
  minDonation?: bigint;
}): Promise<{ txHash: string; explorerUrl: string }> {
  const args: xdr.ScVal[] = [
    nativeToScVal(params.campaignId, { type: 'string' }),
    nativeToScVal(STELLAR_CONFIG.adminPublic, { type: 'address' }),
    nativeToScVal(params.title, { type: 'string' }),
    nativeToScVal(params.description, { type: 'string' }),
    nativeToScVal(params.goal, { type: 'i128' }),
    nativeToScVal(params.minDonation ?? BigInt(10_000_000), { type: 'i128' }),
  ];

  const { txHash } = await invokeContract('add_campaign', args);
  return { txHash, explorerUrl: getExplorerTxUrl(txHash) };
}

/**
 * Agrega un milestone a una campaña.
 * Retorna el sequence number del milestone creado.
 */
export async function addMilestone(params: {
  campaignId: string;
  targetAmount: bigint;
  description: string;
}): Promise<{ sequence: number; txHash: string }> {
  const args: xdr.ScVal[] = [
    nativeToScVal(params.campaignId, { type: 'string' }),
    nativeToScVal(params.targetAmount, { type: 'i128' }),
    nativeToScVal(params.description, { type: 'string' }),
  ];

  const { result, txHash } = await invokeContract('add_milestone', args);
  return { sequence: result as number, txHash };
}

/**
 * Registra evidencia (proof) para un milestone.
 * uri: URL pública del archivo en Supabase Storage.
 */
export async function addProof(params: {
  proofId: string;
  campaignId: string;
  uri: string;
  description: string;
}): Promise<{ txHash: string; explorerUrl: string }> {
  const args: xdr.ScVal[] = [
    nativeToScVal(params.proofId, { type: 'string' }),
    nativeToScVal(params.campaignId, { type: 'string' }),
    nativeToScVal(params.uri, { type: 'string' }),
    nativeToScVal(params.description, { type: 'string' }),
  ];

  const { txHash } = await invokeContract('add_proof', args);
  return { txHash, explorerUrl: getExplorerTxUrl(txHash) };
}

/**
 * Valida un milestone con la proof registrada.
 * Esto habilita el retiro de fondos de ese milestone.
 */
export async function validateMilestoneWithProof(params: {
  campaignId: string;
  milestoneSequence: number;
  proofId: string;
}): Promise<{ txHash: string; explorerUrl: string }> {
  const args: xdr.ScVal[] = [
    nativeToScVal(params.campaignId, { type: 'string' }),
    nativeToScVal(params.milestoneSequence, { type: 'u32' }),
    nativeToScVal(params.proofId, { type: 'string' }),
  ];

  const { txHash } = await invokeContract('validate_milestone_with_proof', args);
  return { txHash, explorerUrl: getExplorerTxUrl(txHash) };
}

/**
 * Retira fondos de un milestone validado.
 * Retorna el monto retirado en stroops.
 */
export async function withdrawMilestoneFunds(params: {
  campaignId: string;
  milestoneSequence: number;
}): Promise<{ amount: bigint; txHash: string }> {
  const args: xdr.ScVal[] = [
    nativeToScVal(params.campaignId, { type: 'string' }),
    nativeToScVal(params.milestoneSequence, { type: 'u32' }),
  ];

  const { result, txHash } = await invokeContract('withdraw_milestone_funds', args);
  return { amount: result as bigint, txHash };
}

// ─── Read-only ────────────────────────────────────────────────────────────────

export async function getCampaign(campaignId: string): Promise<StellarCampaign | null> {
  try {
    const result = await simulateContract('get_campaign', [
      nativeToScVal(campaignId, { type: 'string' }),
    ]);
    return result as StellarCampaign;
  } catch {
    return null;
  }
}

export async function getCampaignMilestones(campaignId: string): Promise<StellarMilestone[]> {
  try {
    const result = await simulateContract('get_campaign_milestones', [
      nativeToScVal(campaignId, { type: 'string' }),
    ]);
    return (result as StellarMilestone[]) ?? [];
  } catch {
    return [];
  }
}

export { getExplorerContractUrl };
```

### 5. Crear `src/lib/stellar/index.ts`

```typescript
// src/lib/stellar/index.ts
export * from './config';
export * from './contract';
// No re-exportar client.ts (uso interno solamente)
```

### 6. Test de humo de la librería

Crear un script temporal `scripts/test-stellar.ts`:

```typescript
// scripts/test-stellar.ts
import { getCampaign } from '../src/lib/stellar';

async function main() {
  console.log('Testing Stellar connection...');
  const campaign = await getCampaign('test-nonexistent');
  console.log('Result (should be null):', campaign);
  console.log('✅ Stellar lib funcionando');
}

main().catch(console.error);
```

Ejecutar:
```bash
npx tsx scripts/test-stellar.ts
```

Si devuelve `null` (no error), la lib funciona.

---

## Archivos creados/modificados

- `src/lib/stellar/config.ts` — configuración y helpers de URLs
- `src/lib/stellar/client.ts` — Stellar SDK wrapper (invokeContract, simulateContract)
- `src/lib/stellar/contract.ts` — funciones tipadas del crowdfunding-contract
- `src/lib/stellar/index.ts` — exports
- `scripts/test-stellar.ts` — test temporal (puede eliminarse después)

---

## Criterio de aceptación

- [ ] `npm install @stellar/stellar-sdk` corrió sin errores
- [ ] Los 4 archivos de `src/lib/stellar/` creados y tipados correctamente
- [ ] `npx tsx scripts/test-stellar.ts` retorna `null` sin errores
- [ ] No hay errores de TypeScript en la librería

---

## Después de terminar este WB

→ Push al repo con commit: `feat: lib/stellar - Stellar SDK wrappers para crowdfunding-contract`  
→ Avisar a Rober que puede arrancar ROBER_WB07  
→ Si hay tiempo, agarrar ROBER_WB04 o ROBER_WB05 para ayudar en frontend
