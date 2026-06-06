# En Masa Social

Plataforma para que ONGs argentinas lancen campañas de donación virales — sin equipo técnico, sin costo de licencias.

> Halketon Solidaria 2026 · Track 2 — Donantes y sostenibilidad económica

---

## Cómo funciona

1. La ONG manda un WhatsApp al agente de IA y le cuenta su causa
2. En 5 turnos de conversación, el agente genera la campaña completa: título, descripción, milestones de impacto y kit viral listo para compartir
3. Los fondos van a un escrow on-chain (Stellar/Soroban) y se liberan por milestones verificables
4. Los promotores comparten el link con su código de referido y el dashboard muestra el alcance en tiempo real

---

## Stack

| Capa | Tech |
|---|---|
| Framework | Next.js 15 App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Base de datos | Supabase Postgres |
| Storage | Supabase Storage |
| IA | Google Gemini 2.5 Flash |
| WhatsApp | Kapso API |
| Blockchain | Stellar SDK JS + contrato Soroban |
| Deploy | Vercel |

---

## Estructura del repo

```
src/
├── app/
│   ├── (inbox)/          # Inbox WhatsApp (Kapso — no tocar)
│   ├── (public)/         # Landing pública de campaña, donación, gracias
│   ├── (dashboard)/      # Vista ONG: métricas, kit viral, promotores, milestones
│   └── api/              # Webhooks, agente, campaña, donación, promotor, milestone
├── components/
│   ├── campaign/
│   ├── viral-kit/
│   └── ui/               # shadcn
├── lib/
│   ├── agent/            # State machine, prompts, Gemini, tools
│   ├── viral-kit/        # Generador de contenido y share URLs
│   ├── stellar/          # Cliente Stellar + wrappers del contrato (owner: Leo)
│   └── supabase/         # Cliente + schema.sql
└── types/                # campaign, donation, promoter, conversation
```

---

## Setup local

### 1. Clonar e instalar

```bash
git clone https://github.com/rober8b/Halketon.git
cd Halketon
npm install
```

### 2. Variables de entorno

Copiar `.env.example` a `.env` y completar:

```bash
cp .env.example .env
```

```env
# Kapso / WhatsApp
PHONE_NUMBER_ID=
KAPSO_API_KEY=
WABA_ID=

# Gemini
GEMINI_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stellar (Leo los agrega en SYNC 1)
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_CONTRACT_ID=
STELLAR_ADMIN_SECRET=
STELLAR_TOKEN_ID=

# App
APP_URL=http://localhost:4000
```

### 3. Crear las tablas en Supabase

Abrir el SQL Editor en el dashboard de Supabase y ejecutar `src/lib/supabase/schema.sql`.

### 4. Correr

```bash
npm run dev
```

Abrir http://localhost:4000 — debería verse el inbox de WhatsApp de Kapso.

---

## Work blocks

Cada feature está definida en un work block. Para ejecutar uno con Claude Code:

```
"Lee CLAUDE.md y ejecutá [NOMBRE_DEL_WB].md"
```

| Work Block | Owner | Depende de | Estado |
|---|---|---|---|
| `LEO_WB01_contract-deploy` | Leo | — | ⏳ |
| `LEO_WB02_stellar-lib` | Leo | LEO_WB01 | ⏳ |
| `ROBER_WB01_repo-setup` | Rober | — | ⏳ |
| `ROBER_WB02_agent-core` | Rober | ROBER_WB01 | ⏳ |
| `ROBER_WB03_campaign-generation` | Rober | ROBER_WB02 | ⏳ |
| `ROBER_WB04_frontend-public` | Leo (ayuda) | ROBER_WB03 | ⏳ |
| `ROBER_WB05_frontend-dashboard` | Leo (ayuda) | ROBER_WB04 | ⏳ |
| `ROBER_WB06_donations` | Leo (ayuda) | ROBER_WB04 | ⏳ |
| `ROBER_WB07_stellar-integration` | Rober | LEO_WB02 + ROBER_WB03 | ⏳ |
| `SHARED_WB01_demo-final` | Ambos | todo lo anterior | ⏳ |

Actualizar el estado a ✅ cuando termines cada WB.

### Sync points obligatorios

- **SYNC 1** (T+45min): Leo → Rober: contract ID, admin secret, token ID
- **SYNC 2** (T+4:45h): Rober → Leo: confirmar endpoints de API listos
- **SYNC 3** (T+7:45h): smoke test end-to-end juntos

---

## Equipo

| Dev | Rol |
|---|---|
| **Rober** | Full-stack, WhatsApp, IA, Frontend |
| **Leo** | DeFi, Blockchain, Stellar |

---

## Stellar Smoke Test y proofs

### Estado actual

- Wallet testnet creada y fondeada:
  `GAF5X2HJDLINJXWY77T6D3NM6VBZKYXCVT2CHMCB5PBI6SADSABUYSRY`
- Funding proof en Stellar Explorer:
  [tx friendbot](https://stellar.expert/explorer/testnet/tx/b2f21a49e436cafd67ea3760160ddd916d8648cea79c9050a7607e0e358bca5c)
- Contract explorer usado para smoke test de lectura:
  [contract fallback](https://stellar.expert/explorer/testnet/contract/CA2A624HHQVMBQUBA3ZPSZ6L3BOIYIQQHICJ26DJRCHAOL7TT2T226SQ)

### Smoke test

El smoke test actual valida dos cosas:

1. La cuenta admin local tiene fondos en Stellar testnet.
2. La libreria `src/lib/stellar/` puede consultar el contrato fallback y resolver `getCampaign('test-campaign')` con `null` en lugar de romper.

Ejecutar:

```bash
npx tsx scripts/smoke-test-stellar.ts
```

Salida esperada:

```json
{
  "smokeTest": "ok",
  "readOnlyContractCheck": null
}
```

### Mock de escrow

Para la demo dejamos un ejemplo de escrow vinculado al `contractId` actual en:

- `src/lib/stellar/mock-escrow.ts`

Ese mock representa:

- `stellarCampaignId`: `demo-comedor-esperanza`
- `escrowXlm`: `2500.0000000`
- milestone 1 pendiente de validacion con `proofId`: `proof-demo-001`
- milestone 2 en cola

La intencion es mostrar el estado esperado del contrato aunque el deploy propio del equipo siga pendiente por la instalacion de `stellar-cli`.

### Ruteo de fondos: Blend vs Aave

#### Opcion recomendada: Blend

Blend corre nativamente sobre Stellar. Para una demo realista, la secuencia mas limpia seria:

1. validar milestone en el contrato escrow
2. retirar fondos liberados
3. depositarlos en un pool de Blend sin bridge intermedio

Eso evita complejidad cross-chain y mantiene toda la trazabilidad en Stellar.

#### Opcion alternativa: Aave via Allbridge Core

Si se quisiera usar Aave, la ruta correcta no es directa desde Stellar:

1. retirar del escrow
2. convertir el retiro a `USDC` en Stellar
3. cruzar `USDC` con Allbridge Core hacia una red EVM
4. depositar ese `USDC` bridged en Aave

Para la demo actual esto queda documentado como flujo tecnico, no como smoke test ejecutado, porque requiere:

- contrato escrow propio deployado con admin del equipo
- liquidez real o entorno bridge utilizable
- cuenta destino en una red soportada por Aave

### Limitacion abierta

No hubo deploy real del contrato propio del equipo en esta maquina porque `cargo install --locked stellar-cli@23.0.0` fallo por TLS/revocation contra `crates.io`.

Hasta resolver eso, el repo usa:

- wallet propia del equipo en testnet
- `STELLAR_TOKEN_ID` nativo correcto
- `STELLAR_CONTRACT_ID` fallback documentado en `LEO_WB01_contract-deploy.md`
