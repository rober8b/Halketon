import { Keypair, TransactionBuilder, Networks, BASE_FEE, Operation, rpc as StellarRpc } from '@stellar/stellar-sdk';
import { isStellarConfigured, getAdminKeypair, getRpcUrl, getContractId, getNetworkPassphrase } from './client';

// ─────────────────────────────────────────────────────────────────────────────
// LEO: Cuando tengas el contrato deployado, reemplazá cada función stub por la
// llamada real usando tu client generado con `stellar contract bindings typescript`.
// Los nombres de función asumidos:
//   create_campaign(admin, title, goal_amount, deadline_timestamp) → u32 (campaign_id)
//   donate(campaign_id, donor, amount) → void
//   validate_milestone(campaign_id, milestone_sequence) → void
// ─────────────────────────────────────────────────────────────────────────────

async function submitTx(signedXdr: string): Promise<string> {
  const server = new StellarRpc.Server(getRpcUrl(), { allowHttp: false });
  const sent = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, getNetworkPassphrase())
  );
  return sent.hash;
}

/**
 * Registra una campaña en el contrato Soroban al publicarla.
 * Retorna el campaign_id on-chain (string) y el tx hash.
 */
export async function createCampaignOnChain(params: {
  title: string;
  goalAmount: number;
  deadlineTimestamp: number;
}): Promise<{ stellarCampaignId: string; txHash: string }> {
  if (!isStellarConfigured()) {
    console.warn('[stellar] Contrato no configurado — skip createCampaignOnChain');
    return { stellarCampaignId: '', txHash: '' };
  }

  // LEO: reemplazá este bloque con la llamada real al contrato
  // Ejemplo con client generado:
  //   const tx = await refinanceClient.create_campaign({
  //     admin: getAdminKeypair().publicKey(),
  //     title: params.title,
  //     goal_amount: BigInt(params.goalAmount),
  //     deadline: BigInt(params.deadlineTimestamp),
  //   });
  //   const { result } = await tx.signAndSend({ signTransaction });
  //   return { stellarCampaignId: String(result), txHash: tx.hash ?? '' };

  console.warn('[stellar] createCampaignOnChain: stub — LEO_WB02 pendiente');
  return { stellarCampaignId: '', txHash: '' };
}

/**
 * Registra una donación en el contrato Soroban.
 * Retorna el tx hash.
 */
export async function donateOnChain(params: {
  stellarCampaignId: string;
  amount: number;
  donorPublicKey?: string;
}): Promise<string> {
  if (!isStellarConfigured()) {
    console.warn('[stellar] Contrato no configurado — skip donateOnChain');
    return '';
  }

  // LEO: reemplazá este bloque con la llamada real al contrato
  // Ejemplo:
  //   const keypair = getAdminKeypair();
  //   const tx = await refinanceClient.donate({
  //     campaign_id: Number(params.stellarCampaignId),
  //     donor: params.donorPublicKey ?? keypair.publicKey(),
  //     amount: BigInt(params.amount),
  //   });
  //   const { hash } = await tx.signAndSend({ signTransaction });
  //   return hash ?? '';

  console.warn('[stellar] donateOnChain: stub — LEO_WB02 pendiente');
  return '';
}

/**
 * Valida un milestone en el contrato Soroban (libera fondos del escrow).
 * Retorna el tx hash.
 */
export async function validateMilestoneOnChain(params: {
  stellarCampaignId: string;
  milestoneSequence: number;
}): Promise<string> {
  if (!isStellarConfigured()) {
    console.warn('[stellar] Contrato no configurado — skip validateMilestoneOnChain');
    return '';
  }

  // LEO: reemplazá este bloque con la llamada real al contrato
  // Ejemplo:
  //   const tx = await refinanceClient.validate_milestone({
  //     campaign_id: Number(params.stellarCampaignId),
  //     milestone_sequence: params.milestoneSequence,
  //   });
  //   const { hash } = await tx.signAndSend({ signTransaction });
  //   return hash ?? '';

  console.warn('[stellar] validateMilestoneOnChain: stub — LEO_WB02 pendiente');
  return '';
}
