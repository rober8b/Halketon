import { notFound } from 'next/navigation';

import { getCampaignBySlug } from '@/lib/campaigns/queries';
import { DonateForm } from './donate-form';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function DonatePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const campaign = await getCampaignBySlug(slug);

  if (!campaign) {
    notFound();
  }

  return <DonateForm campaign={campaign} refCode={ref ?? null} />;
}
