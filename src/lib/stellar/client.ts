import {
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
  type Transaction,
} from '@stellar/stellar-sdk';

import { STELLAR_CONFIG } from './config';

const server = new rpc.Server(STELLAR_CONFIG.rpcUrl, { allowHttp: false });
const networkPassphrase =
  STELLAR_CONFIG.network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;

export { server, networkPassphrase, nativeToScVal, scValToNative, xdr };

export function getRpcUrl(): string {
  return STELLAR_CONFIG.rpcUrl;
}

export function getContractId(): string | null {
  return STELLAR_CONFIG.contractId || null;
}

export function getNetworkPassphrase(): string {
  return networkPassphrase;
}

export function getAdminKeypair(): Keypair {
  if (!STELLAR_CONFIG.adminSecret) {
    throw new Error('STELLAR_ADMIN_SECRET no configurado');
  }

  return Keypair.fromSecret(STELLAR_CONFIG.adminSecret);
}

export function getStellarRpc(): rpc.Server {
  return server;
}

export function isStellarConfigured(): boolean {
  return Boolean(STELLAR_CONFIG.adminSecret && STELLAR_CONFIG.contractId);
}

export async function invokeContract(
  method: string,
  args: xdr.ScVal[]
): Promise<{ result: unknown; txHash: string }> {
  if (!isStellarConfigured()) {
    throw new Error('Stellar no configurado para escrituras');
  }

  const contract = new Contract(STELLAR_CONFIG.contractId);
  const adminKeypair = getAdminKeypair();
  const account = await server.getAccount(adminKeypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const preparedTx = (await server.prepareTransaction(tx)) as Transaction;
  preparedTx.sign(adminKeypair);

  const response = await server.sendTransaction(preparedTx);
  if (response.status === 'ERROR') {
    throw new Error(`Stellar tx error: ${JSON.stringify(response.errorResult)}`);
  }

  const hash = response.hash;
  let receipt = await server.getTransaction(hash);
  let attempts = 0;

  while (receipt.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    if (attempts >= 20) {
      throw new Error('Stellar tx timeout');
    }

    attempts += 1;
    await new Promise((resolve) => setTimeout(resolve, 3000));
    receipt = await server.getTransaction(hash);
  }

  if (receipt.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Stellar tx failed: ${receipt.status}`);
  }

  return {
    result: receipt.returnValue ? scValToNative(receipt.returnValue) : null,
    txHash: hash,
  };
}

export async function simulateContract(
  method: string,
  args: xdr.ScVal[]
): Promise<unknown> {
  const contract = new Contract(STELLAR_CONFIG.contractId);
  const sourceKeypair = STELLAR_CONFIG.adminSecret
    ? getAdminKeypair()
    : Keypair.random();
  const account = await server.getAccount(sourceKeypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const simulation = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(simulation)) {
    throw new Error(`Simulate error: ${JSON.stringify(simulation)}`);
  }

  return simulation.result?.retval ? scValToNative(simulation.result.retval) : null;
}
