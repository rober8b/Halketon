export type CampaignVisual = {
  emoji: string;
  bgClass: string;
  imageUrl: string;
  alt: string;
};

// Fotos de Unsplash (uso libre con atribución). Si querés reemplazar por
// imágenes propias, dropealas en public/campaigns/ y cambiá las URLs acá.
const CAMPAIGN_VISUALS: Record<string, CampaignVisual> = {
  'comedor-esperanza': {
    emoji: '🍲',
    bgClass: 'bg-[linear-gradient(135deg,#FCE7C8_0%,#F5C9A5_100%)]',
    imageUrl:
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
    alt: 'Voluntarios sirviendo comida caliente en un comedor comunitario',
  },
  'huerta-viva': {
    emoji: '🌱',
    bgClass: 'bg-[linear-gradient(135deg,#D8F0DC_0%,#A8DFB1_100%)]',
    imageUrl:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Plantines y verduras de una huerta comunitaria',
  },
};

const DEFAULT_VISUAL: CampaignVisual = {
  emoji: '🤝',
  bgClass: 'bg-[linear-gradient(135deg,#E0EAFA_0%,#B3D0F5_100%)]',
  imageUrl:
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
  alt: 'Manos sosteniendo apoyo comunitario',
};

export function visualFor(slug: string): CampaignVisual {
  return CAMPAIGN_VISUALS[slug] ?? DEFAULT_VISUAL;
}
