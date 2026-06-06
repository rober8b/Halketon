import type { CampaignWithRelations } from '@/types/campaign';

const mockCampaigns: CampaignWithRelations[] = [
  {
    id: 'camp_001',
    slug: 'comedor-esperanza',
    title: 'Comedor Esperanza',
    cause: 'Alimentacion comunitaria',
    description:
      'Una campana para sostener viandas semanales, comprar insumos y financiar la ampliacion del comedor barrial.',
    goal_amount: 1200000,
    min_donation: 10000,
    deadline: '30 de septiembre de 2026',
    status: 'active',
    total_raised: 784000,
    donors_count: 152,
    impact_per_amount: {
      '10000': 'Un almuerzo completo para una familia.',
      '30000': 'Tres viandas y frutas para un fin de semana.',
      '60000': 'Compra semanal de mercaderia basica.',
      '120000': 'Cobertura de una jornada comunitaria entera.',
    },
    og_image_url: null,
    milestones: [
      {
        id: 'mil_001',
        sequence: 1,
        target_amount: 250000,
        description: 'Compra de alimentos secos y verduras de la primera semana.',
        status: 'validated',
        proof_description: 'Factura de compra y fotos de la entrega comunitaria.',
        proof_url: '#',
        validated_at: '2026-05-28T14:30:00Z',
      },
      {
        id: 'mil_002',
        sequence: 2,
        target_amount: 600000,
        description: 'Cobertura de meriendas y viandas durante cuatro semanas.',
        status: 'reached',
        proof_description: null,
        proof_url: null,
        validated_at: null,
      },
      {
        id: 'mil_003',
        sequence: 3,
        target_amount: 1200000,
        description: 'Apertura de una segunda linea de cocina comunitaria.',
        status: 'pending',
        proof_description: null,
        proof_url: null,
        validated_at: null,
      },
    ],
    content_assets: [
      {
        id: 'asset_001',
        channel: 'whatsapp',
        audience: 'Donantes cercanos',
        content:
          'Estoy ayudando a Comedor Esperanza. Con $10.000 ya cubris un almuerzo completo. Sumate aca: /c/comedor-esperanza',
        version: 3,
      },
      {
        id: 'asset_002',
        channel: 'instagram',
        audience: 'Historias y posteos',
        content:
          'Hoy una mesa llena cambia la semana de un barrio entero. Comedor Esperanza necesita apoyo para sostener viandas y merienda.',
        version: 2,
      },
      {
        id: 'asset_003',
        channel: 'linkedin',
        audience: 'Redes institucionales',
        content:
          'Buscamos aliados para ampliar una red de apoyo alimentario con trazabilidad de hitos y reporte publico de impacto.',
        version: 1,
      },
      {
        id: 'asset_004',
        channel: 'email',
        audience: 'Comunidad y empresas',
        content:
          'Asunto: Comedor Esperanza necesita tu ayuda\n\nQueremos invitarte a financiar viandas, insumos y la expansion de la cocina comunitaria.',
        version: 1,
      },
    ],
    promoters: [
      {
        id: 'pro_001',
        name: 'Sofia R.',
        type: 'volunteer',
        referral_code: 'SOFIA10',
        clicks: 182,
        donations: 23,
        total_raised: 268000,
      },
      {
        id: 'pro_002',
        name: 'Red Joven',
        type: 'partner',
        referral_code: 'REDJOVEN',
        clicks: 136,
        donations: 14,
        total_raised: 176000,
      },
      {
        id: 'pro_003',
        name: 'Municipio Barrial',
        type: 'staff',
        referral_code: 'MUNI2026',
        clicks: 94,
        donations: 11,
        total_raised: 108000,
      },
    ],
    lead_contact: 'Mariana Gomez',
    location: 'Rosario, Santa Fe',
    summary:
      'La campana combina WhatsApp, landing publica, kit viral y liberacion por hitos verificables.',
    updated_at: '2026-06-05T18:20:00Z',
    created_at: '2026-05-20T12:00:00Z',
  },
  {
    id: 'camp_002',
    slug: 'huerta-viva',
    title: 'Huerta Viva',
    cause: 'Huerta comunitaria',
    description:
      'Un fondo para herramientas, semillas y capacitacion para ampliar una huerta que abastece a familias del barrio.',
    goal_amount: 900000,
    min_donation: 8000,
    deadline: '15 de octubre de 2026',
    status: 'active',
    total_raised: 522000,
    donors_count: 98,
    impact_per_amount: {
      '8000': 'Un kit de semillas para una temporada.',
      '25000': 'Herramientas basicas para una cuadrilla.',
      '50000': 'Capacitacion de un grupo de voluntarios.',
      '100000': 'Compra de materiales para ampliar canteros.',
    },
    og_image_url: null,
    milestones: [
      {
        id: 'mil_101',
        sequence: 1,
        target_amount: 200000,
        description: 'Compra de insumos y semillas para la temporada.',
        status: 'validated',
        proof_description: 'Fotos de compras y registro de entrega.',
        proof_url: '#',
        validated_at: '2026-05-21T10:00:00Z',
      },
      {
        id: 'mil_102',
        sequence: 2,
        target_amount: 500000,
        description: 'Construccion de nuevos canteros y riego simple.',
        status: 'reached',
        proof_description: null,
        proof_url: null,
        validated_at: null,
      },
      {
        id: 'mil_103',
        sequence: 3,
        target_amount: 900000,
        description: 'Talleres abiertos y distribucion barrial de cosecha.',
        status: 'pending',
        proof_description: null,
        proof_url: null,
        validated_at: null,
      },
    ],
    content_assets: [
      {
        id: 'asset_101',
        channel: 'whatsapp',
        audience: 'Red de vecinos',
        content:
          'Con 8 mil pesos ya sumas semillas para una temporada. Huerta Viva comparte avances y evidencia publica en cada hito.',
        version: 2,
      },
      {
        id: 'asset_102',
        channel: 'instagram',
        audience: 'Historias visuales',
        content:
          'Sembrar tambien es sostener a una comunidad. Huerta Viva ya lleva cosechas y ahora quiere expandirse.',
        version: 2,
      },
      {
        id: 'asset_103',
        channel: 'linkedin',
        audience: 'Aliados corporativos',
        content:
          'Buscamos apoyo para infraestructura simple, trazable y de impacto directo para un proyecto de alimentacion local.',
        version: 1,
      },
      {
        id: 'asset_104',
        channel: 'email',
        audience: 'Donantes institucionales',
        content:
          'Asunto: Sumate a Huerta Viva\n\nNecesitamos semillas, herramientas y horas de trabajo para seguir expandiendo la huerta.',
        version: 1,
      },
    ],
    promoters: [
      {
        id: 'pro_101',
        name: 'Cooperativa Norte',
        type: 'partner',
        referral_code: 'NORTE24',
        clicks: 122,
        donations: 17,
        total_raised: 198000,
      },
      {
        id: 'pro_102',
        name: 'Luz Vecinal',
        type: 'volunteer',
        referral_code: 'LUZVEC',
        clicks: 88,
        donations: 9,
        total_raised: 117000,
      },
    ],
    lead_contact: 'Joaquin Perez',
    location: 'CABA, Buenos Aires',
    summary:
      'Proyecto de alimentacion y autonomizacion comunitaria con seguimiento de hitos y evidencia.',
    updated_at: '2026-06-04T11:45:00Z',
    created_at: '2026-05-18T15:30:00Z',
  },
];

export function listMockCampaigns(): CampaignWithRelations[] {
  return mockCampaigns;
}

export function getMockCampaignBySlug(slug: string): CampaignWithRelations | undefined {
  return mockCampaigns.find((campaign) => campaign.slug === slug);
}

export function getMockCampaignById(id: string): CampaignWithRelations | undefined {
  return mockCampaigns.find((campaign) => campaign.id === id);
}
