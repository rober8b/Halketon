# SHARED_WB01 — Demo final
**Owner:** Rober + Leo (ambos)  
**Estado:** ⏳ Pendiente  
**Depende de:** todos los WBs anteriores  
**Tiempo estimado:** 1.5 horas

---

## Objetivo

Preparar la demo para el pitch: seed data, deploy a Vercel, guion de 4 minutos, video de backup y verificación completa del flujo end-to-end.

---

## Pasos

### 1. Seed data

Crear y ejecutar `scripts/seed-demo.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  const { data: ong } = await supabase.from('ongs').upsert({
    phone_number: '5491100000000',
    name: 'Fundación Kits Escolares',
    contact_name: 'María González',
  }, { onConflict: 'phone_number' }).select().single();

  const { data: campaign } = await supabase.from('campaigns').upsert({
    ong_id: ong?.id,
    slug: 'kits-escolares-2026',
    title: '400 kits escolares para el barrio',
    cause: 'Educación',
    description: 'Necesitamos recaudar para entregar 400 kits escolares a chicos del barrio Villa Tranquila antes del inicio de clases.',
    goal_amount: 2_000_000,
    deadline: '2026-07-31',
    impact_per_amount: { '5000': '1 kit', '25000': '5 kits', '50000': '10 kits' },
    status: 'active',
    total_raised: 680_000,
    donors_count: 47,
  }, { onConflict: 'slug' }).select().single();

  await supabase.from('milestones').upsert([
    { campaign_id: campaign?.id, sequence: 1, target_amount: 500_000, description: 'Hito 1: primeros 100 kits', status: 'validated' },
    { campaign_id: campaign?.id, sequence: 2, target_amount: 1_000_000, description: 'Hito 2: 200 kits', status: 'reached' },
    { campaign_id: campaign?.id, sequence: 3, target_amount: 1_500_000, description: 'Hito 3: 300 kits', status: 'pending' },
    { campaign_id: campaign?.id, sequence: 4, target_amount: 2_000_000, description: 'Hito 4: meta completa', status: 'pending' },
  ], { onConflict: 'campaign_id,sequence' });

  await supabase.from('promoters').upsert([
    { campaign_id: campaign?.id, name: 'María G.', referral_code: 'mariag' },
    { campaign_id: campaign?.id, name: 'Juan P.', referral_code: 'juanp' },
    { campaign_id: campaign?.id, name: 'Laura M.', referral_code: 'lauram' },
  ], { onConflict: 'referral_code' });

  await supabase.from('content_assets').upsert([
    { campaign_id: campaign?.id, channel: 'whatsapp', content: '🎒 Sumate a ayudar a 400 chicos con sus útiles escolares. {{PROMOTER_NAME}} te comparte esta campaña:' },
    { campaign_id: campaign?.id, channel: 'instagram', content: 'Cada kit escolar cambia el inicio de clases 💙 Meta: $2.000.000 #educacion #solidaridad #argentina' },
    { campaign_id: campaign?.id, channel: 'linkedin', content: 'Me sumé a apoyar 400 kits escolares para chicos del barrio Villa Tranquila. Te dejo el link:' },
    { campaign_id: campaign?.id, channel: 'email', content: 'Asunto: Una campaña que vale la pena apoyar\n\nHola, te quería compartir esta iniciativa solidaria para útiles escolares.' },
  ], { onConflict: 'campaign_id,channel' });

  for (let i = 0; i < 5; i++) {
    await supabase.from('donations').insert({
      campaign_id: campaign?.id,
      amount: [5000, 10000, 25000, 50000, 5000][i],
      frequency: i === 2 ? 'monthly' : 'one_time',
      referral_code: ['mariag', 'juanp', 'mariag', 'lauram', 'juanp'][i],
      donor_name: `Donante demo ${i + 1}`,
      status: 'completed',
      payment_provider: 'simulated',
    });
  }

  console.log('✅ Seed completo!');
  console.log(`📱 Landing: ${process.env.APP_URL}/c/kits-escolares-2026`);
  console.log(`📊 Dashboard: ${process.env.APP_URL}/dashboard/campaign/${campaign?.id}`);
}

seed().catch(console.error);
```

```bash
npx tsx scripts/seed-demo.ts
```

### 2. Deploy a Vercel

```bash
npm i -g vercel
vercel  # sigue el wizard

# Agregar todas las env vars desde el dashboard de Vercel
# o con: vercel env add VAR_NAME
```

Env vars críticas en Vercel:
```
APP_URL=https://tu-app.vercel.app
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
PHONE_NUMBER_ID=...
KAPSO_API_KEY=...
WABA_ID=...
GEMINI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_CONTRACT_ID=...
STELLAR_ADMIN_SECRET=...
STELLAR_TOKEN_ID=...
STELLAR_ADMIN_PUBLIC=...
```

### 3. Guion de pitch (4 minutos)

```
MINUTO 0:00 — PROBLEMA (30s)
"Las ONGs argentinas tienen causas reales y comunidades activas, pero no tienen
infraestructura para convertir eso en donaciones sostenibles. Los CRMs son caros,
complejos y los equipos los abandonan antes del segundo trimestre."

MINUTO 0:30 — DEMO EN VIVO

0:30 - Abrir WhatsApp en el celular, mostrar pantalla proyectada.
       "Les muestro En Masa Social. La ONG le escribe al agente..."
       [Escribir: "Hola, quiero armar una campaña"]

1:00 - Seguir la conversación guiada (ya está en Supabase si se resetea el estado).
       "El agente hace 5 preguntas en lenguaje natural."

2:00 - "El agente genera la campaña y manda el link. Miren el preview en WhatsApp."
       [Mostrar preview con imagen, título y barra]

2:15 - Abrir el link desde el celular, mostrar la landing.
       "Narrativa generada por IA, milestones claros, impacto por monto."

2:30 - Apretar "Difundir" → mostrar que abre WhatsApp con mensaje pre-armado.
       "Un click. El promotor solo aprieta compartir."

2:45 - Desde otro dispositivo: donar $5.000, mostrar badge "Yo doné".

3:00 - Mostrar dashboard con métricas y ranking de promotores.

3:20 - Mostrar milestone validado con link a Stellar Explorer.
       "Los fondos están en escrow on-chain. Verificable por cualquiera."

MINUTO 3:30 — CIERRE (30s)
"Cero costo para la ONG. Cero curva de aprendizaje: si sabés usar WhatsApp,
sabés usar En Masa Social. Transparencia total: blockchain."
```

### 4. Video de backup

Grabar el flujo completo (1:30min máximo). Subir a YouTube/Drive. Tener link listo para compartir.

### 5. Verificación final pre-pitch

- [ ] Resetear estado de conversación de demo en Supabase (para que el agente empiece de cero)
- [ ] Verificar que el agente responde en el número de WhatsApp de producción
- [ ] Abrir el link de la campaña demo en WhatsApp real y verificar preview
- [ ] Hacer una donación de prueba end-to-end
- [ ] Verificar el dashboard se actualiza
- [ ] Tener Stellar Explorer abierto en una pestaña con el contract ID

---

## Criterio de aceptación

- [ ] Seed data corrió sin errores
- [ ] App deployada en Vercel y accesible
- [ ] Flujo completo funciona en producción (no solo localhost)
- [ ] Demo corre en menos de 4 minutos
- [ ] Video de backup grabado y listo
- [ ] Ambos hicieron rehearsal del pitch

---

## Después de terminar este WB

→ ¡A pitchear! 🚀
