# Work Blocks — En Masa Social

## Cómo usar esto

1. Abrí Claude Code en el repo
2. Decile: `"Lee CLAUDE.md y ejecutá workblocks/[NOMBRE_DEL_WB].md. Antes de cada cambio explicame qué vas a hacer y esperá mi ok."`
3. Ejecutá un work block por sesión de Claude Code
4. Pusheá al terminar
5. Avisale al otro dev (Rober/Leo) cuando terminaste los blocks que te afectan

## Estado de los work blocks

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

Actualizá el estado a ✅ cuando terminés cada WB.

## Sync points obligatorios

- **SYNC 1** (T+45min): Leo → Rober: contract ID, admin secret, token ID
- **SYNC 2** (T+4:45h): Rober → Leo: confirmar endpoints de API listos
- **SYNC 3** (T+7:45h): smoke test end-to-end juntos
