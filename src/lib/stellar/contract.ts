import { nativeToScVal, type xdr } from '@stellar/stellar-sdk';

import {
  invokeContract,
  isStellarConfigured,
  simulateContract,
} from './client';
import {
  getExplorerContractUrl,
  getExplorerTxUrl,
  getStellarFallbackReason,
  STELLAR_CONFIG,
} from './config';

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

function toStringArg(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: 'string' });
}

function toAddressArg(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: 'address' });
}

function toI128Arg(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: 'i128' });
}

function toU32Arg(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: 'u32' });
}

export async function addCampaign(params: {
  campaignId: string;
  title: string;
  description: string;
  goal: bigint;
  minDonation?: bigint;
}): Promise<{ txHash: string; explorerUrl: string }> {
  const args: xdr.ScVal[] = [
    toStringArg(params.campaignId),
    toAddressArg(STELLAR_CONFIG.adminPublic),
    toStringArg(params.title),
    toStringArg(params.description),
    toI128Arg(params.goal),
    toI128Arg(params.minDonation ?? BigInt(10_000_000)),
  ];

  const { txHash } = await invokeContract('add_campaign', args);
  return { txHash, explorerUrl: getExplorerTxUrl(txHash) };
}

export async function addMilestone(params: {
  campaignId: string;
  targetAmount: bigint;
  description: string;
}): Promise<{ sequence: number; txHash: string }> {
  const args: xdr.ScVal[] = [
    toStringArg(params.campaignId),
    toI128Arg(params.targetAmount),
    toStringArg(params.description),
  ];

  const { result, txHash } = await invokeContract('add_milestone', args);
  return { sequence: Number(result), txHash };
}

export async function addProof(params: {
  proofId: string;
  campaignId: string;
  uri: string;
  description: string;
}): Promise<{ txHash: string; explorerUrl: string }> {
  const args: xdr.ScVal[] = [
    toStringArg(params.proofId),
    toStringArg(params.campaignId),
    toStringArg(params.uri),
    toStringArg(params.description),
  ];

  const { txHash } = await invokeContract('add_proof', args);
  return { txHash, explorerUrl: getExplorerTxUrl(txHash) };
}

export async function validateMilestoneWithProof(params: {
  campaignId: string;
  milestoneSequence: number;
  proofId: string;
}): Promise<{ txHash: string; explorerUrl: string }> {
  const args: xdr.ScVal[] = [
    toStringArg(params.campaignId),
    toU32Arg(params.milestoneSequence),
    toStringArg(params.proofId),
  ];

  const { txHash } = await invokeContract('validate_milestone_with_proof', args);
  return { txHash, explorerUrl: getExplorerTxUrl(txHash) };
}

export async function withdrawMilestoneFunds(params: {
  campaignId: string;
  milestoneSequence: number;
}): Promise<{ amount: bigint; txHash: string }> {
  const args: xdr.ScVal[] = [
    toStringArg(params.campaignId),
    toU32Arg(params.milestoneSequence),
  ];

  const { result, txHash } = await invokeContract('withdraw_milestone_funds', args);
  return { amount: BigInt(String(result ?? 0)), txHash };
}

export async function getCampaign(campaignId: string): Promise<StellarCampaign | null> {
  try {
    const result = await simulateContract('get_campaign', [toStringArg(campaignId)]);
    return (result as StellarCampaign | null) ?? null;
  } catch {
    return null;
  }
}

export async function getCampaignMilestones(
  campaignId: string
): Promise<StellarMilestone[]> {
  try {
    const result = await simulateContract('get_campaign_milestones', [
      toStringArg(campaignId),
    ]);
    return (result as StellarMilestone[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Backward-compatible entrypoint used by current app code.
 * Until the contract is deployed with this team's admin, we return a graceful stub.
 */
export async function createCampaignOnChain(params: {
  title: string;
  goalAmount: number;
  deadlineTimestamp: number;
}): Promise<{ stellarCampaignId: string; txHash: string }> {
  if (!isStellarConfigured() || !process.env.STELLAR_CONTRACT_ID) {
    console.warn(
      `[stellar] createCampaignOnChain fallback: ${getStellarFallbackReason() ?? 'config incompleta'}`
    );
    return { stellarCampaignId: '', txHash: '' };
  }

  console.warn(
    `[stellar] createCampaignOnChain pendiente de deploy/admin real. Contract actual: ${STELLAR_CONFIG.contractId}`
  );
  void params.deadlineTimestamp;
  return { stellarCampaignId: '', txHash: '' };
}

export async function donateOnChain(params: {
  stellarCampaignId: string;
  amount: number;
  donorPublicKey?: string;
}): Promise<string> {
  if (!isStellarConfigured() || !process.env.STELLAR_CONTRACT_ID) {
    console.warn(
      `[stellar] donateOnChain fallback: ${getStellarFallbackReason() ?? 'config incompleta'}`
    );
    return '';
  }

  console.warn(
    `[stellar] donateOnChain pendiente de deploy/admin real para campaign ${params.stellarCampaignId}`
  );
  void params.amount;
  void params.donorPublicKey;
  return '';
}

export async function validateMilestoneOnChain(params: {
  stellarCampaignId: string;
  milestoneSequence: number;
}): Promise<string> {
  if (!isStellarConfigured() || !process.env.STELLAR_CONTRACT_ID) {
    console.warn(
      `[stellar] validateMilestoneOnChain fallback: ${getStellarFallbackReason() ?? 'config incompleta'}`
    );
    return '';
  }

  console.warn(
    `[stellar] validateMilestoneOnChain pendiente de deploy/admin real para campaign ${params.stellarCampaignId}`
  );
  void params.milestoneSequence;
  return '';
}

export { getExplorerContractUrl };
