import type { CollectedData, ContentAssetDraft } from './types';

export const GREETING_PROMPT = `¡Hola! Soy el asistente de *Refinance* 🌱

Te ayudo a crear tu campaña de donación en menos de 5 minutos, sin necesidad de equipo técnico.

Primero contame: ¿cuál es el nombre de tu organización y cómo te llamás?`;

export const COLLECT_CAUSE_PROMPT = (ong_name: string) =>
  `Genial, *${ong_name}*! Ahora contame sobre la campaña:

¿Cuál es la causa que quieren apoyar? Describila en pocas líneas — qué problema existe, a quiénes ayuda y por qué importa ahora.`;

export const COLLECT_GOAL_PROMPT = () =>
  `Muy bien, ya tengo la causa. Ahora necesito dos datos más:

1️⃣ *¿Cuánto necesitan recaudar?* (en pesos argentinos, ej: 500000)
2️⃣ *¿Cuándo es la fecha límite de la campaña?* (ej: 30/08/2026)

Respondé con los dos datos, uno por línea.`;

export const COLLECT_MILESTONES_PROMPT = (goal_amount: number) =>
  `Perfecto. Ahora definamos los *hitos de impacto* — qué van a lograr a medida que lleguen las donaciones.

Necesito 3 hitos con este formato (uno por línea):
\`MONTO: descripción de lo que se logra\`

Por ejemplo:
\`100000: Compramos materiales para 50 familias\`
\`250000: Capacitamos a 20 voluntarios\`
\`${goal_amount}: Completamos el proyecto\`

¡Usá números redondos!`;

export const GENERATING_PROMPT = () =>
  `Genial, tengo todo lo que necesito. 🎉

Estoy generando tu campaña con inteligencia artificial... dame un momento.`;

export const CAMPAIGN_CONFIRM_PROMPT = (
  data: CollectedData,
  campaignUrl: string
) => `✅ *Tu campaña está lista*

📌 *Título:* ${data.title}
🎯 *Meta:* $${data.goal_amount?.toLocaleString('es-AR')}
📅 *Fecha límite:* ${data.deadline}

*Descripción:*
${data.description}

🔗 *Link de campaña:*
${campaignUrl}

¿Confirmás que todo está bien? Respondé *SÍ* para publicarla o *NO* para cancelar.`;

export const DONE_PROMPT = (campaignUrl: string) =>
  `🚀 *¡Campaña publicada!*

Ya podés compartir este link para empezar a recibir donaciones:
${campaignUrl}

Desde el dashboard podés ver las métricas, el kit viral completo y el estado de cada milestone.

¡Mucha suerte con la campaña! 💪`;

export function buildCampaignGenerationPrompt(data: CollectedData): string {
  return `Sos un experto en fundraising para ONGs argentinas. Generá una campaña de donación completa en JSON.

DATOS RECOPILADOS:
- ONG: ${data.ong_name}
- Causa: ${data.cause}
- Meta: $${data.goal_amount} ARS
- Deadline: ${data.deadline}
- Milestones: ${JSON.stringify(data.milestones)}

GENERÁ este JSON exacto (sin markdown, solo el objeto):
{
  "title": "Título emotivo de la campaña (máx 60 chars)",
  "description": "Descripción completa de 150-200 palabras que explique el problema, la solución y el impacto. Tono cercano, en español rioplatense.",
  "impact_per_amount": {
    "1000": "descripción del impacto de $1.000",
    "5000": "descripción del impacto de $5.000",
    "10000": "descripción del impacto de $10.000"
  },
  "content_assets": [
    {
      "channel": "whatsapp",
      "audience": "amigos y familia",
      "content": "Mensaje para reenviar por WhatsApp (máx 300 chars, con emojis, sin saltos innecesarios)"
    },
    {
      "channel": "instagram",
      "audience": "seguidores generales",
      "content": "Caption para Instagram (150-200 chars + hashtags relevantes)"
    },
    {
      "channel": "twitter",
      "audience": "público general",
      "content": "Tweet (máx 280 chars, con 2-3 hashtags)"
    }
  ]
}`;
}

export interface GeneratedCampaign {
  title: string;
  description: string;
  impact_per_amount: Record<string, string>;
  content_assets: ContentAssetDraft[];
}
