# EN MASA SOCIAL — Contexto para Claude Code
> Halketon Solidaria 2026 · Track 2 — Donantes y sostenibilidad económica

## Qué es este proyecto

**En Masa Social** es una plataforma para que ONGs argentinas lancen campañas de donación virales sin equipo técnico ni costo de licencias.

**Diferencial central:** un agente de IA que vive en WhatsApp. La ONG escribe al agente, le cuenta la causa, y en 5 turnos tiene una campaña completa generada, con kit viral y link listo para difundir. Los fondos quedan en escrow on-chain (Stellar/Soroban) con liberación por milestones verificables.

## Stack (no negociable)

| Capa | Tech |
|---|---|
| Framework | Next.js 15 App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui + paleta de ReFinance_beneficiary |
| DB | Supabase Postgres |
| Storage | Supabase Storage |
| LLM | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| WhatsApp | Kapso API (`gokapso/whatsapp-cloud-inbox` como base) |
| Blockchain | Stellar SDK JS + contrato Soroban (`leocagli/refinance`) |
| Deploy | Vercel |

**Prohibido:** OpenAI, Claude API, Vite, React Router, cualquier servicio pago.

## Repos base

- **Frontend UI** (`ReFinance_beneficiary`): componentes React/Vite que se MIGRAN a Next.js. Paleta: `refinance-blue: '#4A90E2'`, `terracotta-50…900`.
- **Smart contract** (`refinance`): Soroban en Rust. Contract deployado en testnet por Leo (ver `workblocks/LEO_WB01_contract-deploy.md`). **No modificar el contrato.**
- **Base del repo** (`whatsapp-cloud-inbox`): este repo es el fork base. Ya tiene Next.js 15, Kapso client, WhatsApp inbox UI.

## Estructura de carpetas del repo

```
src/
├── app/
│   ├── (inbox)/          # YA EXISTE — inbox WhatsApp de Kapso (no tocar)
│   ├── (public)/         # Landing pública de campaña, donate, thanks
│   ├── (dashboard)/      # Vista de la ONG: métricas, kit, promotores, milestones
│   └── api/              # Webhooks, agent, campaign, donate, promoter, milestone
├── components/
│   ├── campaign/         # Migrados de ReFinance + nuevos
│   ├── viral-kit/        # ShareButton, ChannelCard, PromoterLinkCard
│   └── ui/               # shadcn (ya existe)
├── lib/
│   ├── agent/            # State machine, prompts, Gemini wrapper, tools
│   ├── viral-kit/        # Generator de contenido, share URL helpers
│   ├── stellar/          # Client, contract wrappers, config — OWNER: LEO
│   └── supabase/         # Client + schema.sql
└── types/                # campaign, donation, promoter, conversation
```

## Variables de entorno requeridas

```
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

# Stellar (cargadas por Leo en LEO_WB01)
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_CONTRACT_ID=
STELLAR_ADMIN_SECRET=
STELLAR_TOKEN_ID=

# App
APP_URL=http://localhost:4000
```

## Equipo y ownership

| Dev | Rol | Work blocks |
|---|---|---|
| **Rober** | Full-stack, WhatsApp, IA, Frontend | ROBER_WB01 → ROBER_WB07 |
| **Leo** | DeFi, Blockchain, Stellar | LEO_WB01, LEO_WB02 (+ ayuda en resto cuando termina) |

## Orden de ejecución y dependencias

```
T+0    Rober: ROBER_WB01 (setup)       Leo: LEO_WB01 (deploy contrato)
                    ↓                              ↓
T+45   ── SYNC 1: Leo pasa contract ID + secrets a Rober ──
                    ↓
T+45   Rober: ROBER_WB02 (agente)      Leo: LEO_WB02 (lib/stellar en Next.js)
                    ↓                              ↓
T+2:45 Rober: ROBER_WB03 (campaign)    Leo: ROBER_WB04 (frontend público)
                    ↓                              ↓
T+4:45 Rober: ROBER_WB05 (dashboard)   Leo: ROBER_WB06 (donaciones)
                    ↓                              ↓
T+6:15 Rober: ROBER_WB07 (Stellar)  ← DEPENDE de LEO_WB02 completo
                    ↓
T+7:45 SHARED_WB01 (demo final — ambos)
```

## Comportamiento esperado de Claude Code

- **Approval-gated:** antes de cada cambio, explicar qué va a hacer y esperar ok del dev.
- **Diagnóstico primero:** leer el código existente antes de escribir nada nuevo.
- **Un archivo a la vez:** no tocar múltiples archivos sin confirmar.
- **TypeScript estricto:** cero `any`. Zod para validar inputs de API routes.
- **Error handling:** todas las calls externas (Gemini, Stellar, Kapso, Supabase) en try/catch con fallback claro.
- **Idioma:** todo el texto user-facing en español rioplatense. Errores también.
- **No inventar features** que no estén en el work block activo.

## Lo que NO hay que hacer

- No auth de usuarios (la ONG se identifica por número de WhatsApp)
- No pagos reales (MP sandbox o simulado)
- No OpenAI ni Claude API
- No modificar el smart contract Rust
- No mantener la app Vite/React Router separada
- No exponer secrets en frontend
- No prometer yield/DeFi staking en el pitch
- No usar el NFT contract (roadmap)

---
*Para ejecutar un work block: "Lee CLAUDE.md y ejecutá workblocks/[WB_FILE].md"*
