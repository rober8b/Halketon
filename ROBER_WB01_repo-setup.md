# ROBER_WB01 — Setup del repo base
**Owner:** Rober  
**Estado:** ⏳ Pendiente  
**Depende de:** ninguno (arranca en paralelo con LEO_WB01)  
**Tiempo estimado:** 30 minutos

---

## Objetivo

Forkear `whatsapp-cloud-inbox`, instalar dependencias extras, crear el schema de Supabase, configurar el `.env` base y verificar que el inbox de WhatsApp funciona. Al terminar, el repo está listo para que los siguientes work blocks construyan encima.

---

## Pasos

### 1. Fork y setup del repo base

```bash
# Fork de whatsapp-cloud-inbox como base del proyecto
gh repo fork gokapso/whatsapp-cloud-inbox --clone --remote
mv whatsapp-cloud-inbox en-masa-social
cd en-masa-social

# Renombrar el remote origin al fork propio
git remote rename origin upstream
git remote add origin https://github.com/<tu-usuario>/en-masa-social.git

# Instalar dependencias extras sobre las que ya tiene el repo
npm install @supabase/supabase-js @google/generative-ai @stellar/stellar-sdk zod @vercel/og
npm install -D @types/node tsx
```

### 2. Copiar archivos del contexto del proyecto al repo

```bash
# Traer CLAUDE.md y workblocks al repo
# (ya deberían estar si clonaste el repo con estos archivos)
# Si no están, crearlos manualmente copiando el contenido de este proyecto
```

### 3. Migrar paleta de colores de ReFinance_beneficiary

En `tailwind.config.ts` (o `tailwind.config.js`), agregar dentro de `theme.extend.colors`:

```typescript
'refinance-blue': '#4A90E2',
'terracotta': {
  50: '#FDF8F6',
  100: '#F2E8E5',
  200: '#EADDCA',
  300: '#E0C3A7',
  400: '#D4A574',
  500: '#C68E5A',
  600: '#B76E3F',
  700: '#8B5A3F',
  800: '#6F4E37',
  900: '#5A3E2E',
},
```

### 4. Configurar Supabase

**4a.** Crear proyecto en https://supabase.com (free tier). Anotar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `SUPABASE_SERVICE_ROLE_KEY` (en Settings > API)

**4b.** Crear el archivo `src/lib/supabase/schema.sql` con este contenido:

```sql
CREATE TABLE ongs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  name text,
  contact_name text,
  stellar_address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ong_id uuid REFERENCES ongs(id) NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  cause text NOT NULL,
  description text NOT NULL,
  goal_amount bigint NOT NULL,
  min_donation bigint DEFAULT 100000,
  deadline date,
  impact_per_amount jsonb,
  status text DEFAULT 'draft',
  stellar_campaign_id text,
  og_image_url text,
  total_raised bigint DEFAULT 0,
  donors_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) NOT NULL,
  sequence int NOT NULL,
  target_amount bigint NOT NULL,
  description text NOT NULL,
  stellar_sequence int,
  proof_url text,
  proof_description text,
  status text DEFAULT 'pending',
  validated_at timestamptz,
  stellar_validate_tx text,
  UNIQUE (campaign_id, sequence)
);

CREATE TABLE content_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) NOT NULL,
  channel text NOT NULL,
  audience text,
  content text NOT NULL,
  version int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE promoters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'volunteer',
  referral_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) NOT NULL,
  referral_code text,
  channel text,
  user_agent text,
  ip_hash text,
  timestamp timestamptz DEFAULT now()
);

CREATE TABLE donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) NOT NULL,
  amount bigint NOT NULL,
  frequency text DEFAULT 'one_time',
  referral_code text,
  donor_email text,
  donor_name text,
  donor_phone text,
  status text DEFAULT 'pending',
  payment_provider text,
  payment_id text,
  stellar_tx_hash text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE impact_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) NOT NULL,
  milestone_id uuid REFERENCES milestones(id),
  content text NOT NULL,
  evidence_urls text[],
  sent_to_donors_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE conversation_state (
  phone_number text PRIMARY KEY,
  ong_id uuid REFERENCES ongs(id),
  current_step text NOT NULL DEFAULT 'greeting',
  collected_data jsonb NOT NULL DEFAULT '{}',
  campaign_id uuid REFERENCES campaigns(id),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_clicks_campaign ON click_events(campaign_id, referral_code);
CREATE INDEX idx_donations_campaign ON donations(campaign_id, status);
```

**4c.** Ejecutar el schema en Supabase: ir a SQL Editor en el dashboard y pegar todo el contenido de `schema.sql`.

### 5. Crear `src/lib/supabase/client.ts`

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente público (frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente con service role (backend/API routes únicamente — no usar en componentes de React)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

### 6. Configurar `.env`

Copiar `.env.example` a `.env` y llenar:

```bash
cp .env.example .env
```

```
# Kapso / WhatsApp (de app.kapso.ai)
PHONE_NUMBER_ID=
KAPSO_API_KEY=
WABA_ID=

# Gemini (de aistudio.google.com)
GEMINI_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stellar (Leo los agrega en SYNC 1 — dejar vacíos por ahora)
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_CONTRACT_ID=
STELLAR_ADMIN_SECRET=
STELLAR_TOKEN_ID=
STELLAR_ADMIN_PUBLIC=

# App
APP_URL=http://localhost:4000
```

### 7. Verificar que el inbox base funciona

```bash
npm run dev
```

Abrir http://localhost:4000 → debería verse el inbox de WhatsApp de Kapso. Si aparece error de env vars, completar las de Kapso primero.

### 8. Actualizar `.env.example` en el repo

Asegurarse que `.env.example` tiene todas las variables sin valores (para que Leo y futuros devs sepan qué configurar):

```bash
# También agregar al .gitignore (verificar que `.env` está ignorado)
grep "\.env" .gitignore || echo ".env" >> .gitignore
```

---

## Archivos creados/modificados

- `tailwind.config.ts` — paleta de ReFinance agregada
- `src/lib/supabase/schema.sql` — schema completo
- `src/lib/supabase/client.ts` — cliente Supabase (público + admin)
- `.env` — variables configuradas (no se commitea)
- `.env.example` — template actualizado
- `package.json` — dependencias extras

---

## Criterio de aceptación

- [ ] `npm run dev` arranca sin errores en http://localhost:4000
- [ ] El inbox de WhatsApp se ve en la UI
- [ ] El schema de Supabase está ejecutado (las tablas se ven en el dashboard de Supabase)
- [ ] Podés conectarte a Supabase desde una API route de test

---

## Después de terminar este WB

→ Push al repo: `feat: setup base, Supabase schema, paleta ReFinance`  
→ **SYNC 1 con Leo:** pedirle el `stellar.env.txt` con las 5 variables de Stellar  
→ Agregar esas 5 variables al `.env` local  
→ Arrancar ROBER_WB02
