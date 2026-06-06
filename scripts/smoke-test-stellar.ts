import {
  getCampaign,
  getExplorerContractUrl,
  getExplorerTxUrl,
} from '../src/lib/stellar/index';
import {
  MOCK_AAVE_ROUTE,
  MOCK_BLEND_ROUTE,
  MOCK_ESCROW_CAMPAIGN,
  STELLAR_FRIEND_BOT_TX_HASH,
} from '../src/lib/stellar/mock-escrow';

async function main() {
  const simulatedCampaign = await getCampaign('test-campaign');

  console.log(
    JSON.stringify(
      {
        smokeTest: 'ok',
        readOnlyContractCheck: simulatedCampaign,
        fallbackContractExplorer: getExplorerContractUrl(),
        friendbotFundingExplorer: getExplorerTxUrl(STELLAR_FRIEND_BOT_TX_HASH),
        escrowExample: MOCK_ESCROW_CAMPAIGN,
        routeToBlend: MOCK_BLEND_ROUTE,
        routeToAaveViaAllbridge: MOCK_AAVE_ROUTE,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
