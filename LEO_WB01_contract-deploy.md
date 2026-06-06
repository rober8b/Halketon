# LEO_WB01 — Deploy contrato Soroban en testnet
**Owner:** Leo  
**Estado:** ⏳ Pendiente  
**Depende de:** ninguno (arranca en paralelo con ROBER_WB01)  
**Tiempo estimado:** 45 minutos  
**Entrega crítica:** contract ID + admin secret → Rober en SYNC 1

---

## Objetivo

Deployar el smart contract `crowdfunding-contract` del repo `leocagli/refinance` en Stellar testnet con un admin keypair propio del equipo. Proveer las tres variables de entorno que Rober necesita para ROBER_WB07.

## Contexto

El contrato ya existe en Rust/Soroban y está listo para deployar. NO hay que modificarlo. Solo compilar, optimizar y deployar en testnet con nuestro propio admin key (el deploy original de leocagli usa su admin, no el nuestro).

Las funciones del contrato que va a usar el backend:
- `add_campaign(campaign_id, creator, title, description, goal, min_donation)`
- `add_milestone(campaign_id, target_amount, description) → u32`
- `add_proof(proof_id, campaign_id, uri, description)` — solo admin
- `validate_milestone_with_proof(campaign_id, milestone_sequence, proof_id)` — solo admin
- `withdraw_milestone_funds(campaign_id, milestone_sequence) → i128`
- `get_campaign(campaign_id) → Campaign`
- `get_campaign_milestones(campaign_id) → Vec<Milestone>`

---

## Pasos

### 1. Instalar Rust y stellar-cli

```bash
# Rust (si no está)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustc --version  # verificar

# Target WASM para Soroban
rustup target add wasm32v1-none

# stellar-cli (versión exacta)
cargo install --locked stellar-cli@23.0.0
stellar --version  # debe decir 23.0.0
```

### 2. Clonar el repo del contrato

```bash
git clone https://github.com/leocagli/refinance.git
cd refinance
```

### 3. Generar admin keypair propio

```bash
stellar keys generate --global enmasa-admin --network testnet --fund

# Guardar el secret key (aparecer en pantalla, solo esta vez)
stellar keys show enmasa-admin  # muestra el secret key → ANOTARLO

# Verificar que se fondeó
stellar keys address enmasa-admin  # muestra el public key
```

**IMPORTANTE:** guardar el secret key en un lugar seguro. Es `STELLAR_ADMIN_SECRET` en el `.env`.

### 4. Obtener token address de XLM nativo en testnet

```bash
stellar contract asset id --asset native --network testnet
# Resultado esperado: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

### 5. Compilar el crowdfunding-contract

```bash
# Desde la raíz del repo refinance/
cargo build --target wasm32v1-none --release

# Verificar que existe el .wasm
ls target/wasm32v1-none/release/crowdfunding_contract.wasm
```

> Si el build falla por versión de rustc, intentar: `rustup update stable && cargo build --target wasm32v1-none --release`

### 6. Optimizar el contrato

```bash
stellar contract optimize \
  --wasm target/wasm32v1-none/release/crowdfunding_contract.wasm

# Verificar que existe el .optimized.wasm
ls target/wasm32v1-none/release/crowdfunding_contract.optimized.wasm
```

### 7. Deployar

```bash
# Guardar el public key del admin
ADMIN_PUBLIC=$(stellar keys address enmasa-admin)
echo "Admin public key: $ADMIN_PUBLIC"

# Deployar (esto puede tardar 1-2 minutos)
stellar contract deploy \
  --wasm target/wasm32v1-none/release/crowdfunding_contract.optimized.wasm \
  --source enmasa-admin \
  --network testnet \
  -- \
  --admin $ADMIN_PUBLIC \
  --token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

**La respuesta es el contract ID** (string que empieza con `C`). ANOTARLO.

### 8. Verificar el deploy

```bash
# Llamar get_campaign con un ID ficticio — debe retornar error CampaignNotFound, NO error de contrato
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source enmasa-admin \
  --network testnet \
  -- get_campaign \
  --campaign_id "test-campaign"
```

Si devuelve algo como `{"Err": {"CampaignNotFound": 4}}` → el contrato está funcionando.

### 9. Crear el archivo .env.stellar para Rober

Crear el archivo `stellar.env.txt` en la raíz del repo **refinance** (NO commitear):

```
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_CONTRACT_ID=<el contract ID que apareció en paso 7>
STELLAR_ADMIN_SECRET=<el secret key del paso 3>
STELLAR_TOKEN_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
STELLAR_ADMIN_PUBLIC=<el public key del paso 7>
```

**Mandar este archivo a Rober por canal privado (WhatsApp del equipo). NO pushearlo al repo.**

---

## Archivos creados/modificados

Este work block NO modifica el repo de `en-masa-social`. Solo genera las credenciales y las manda a Rober.

El contrato `.wasm` queda en el repo `refinance/` local.

---

## Criterio de aceptación

- [ ] `stellar-cli@23.0.0` instalado y funcionando
- [ ] Admin keypair `enmasa-admin` generado y fondeado en testnet
- [ ] Contrato compilado y optimizado sin errores
- [ ] Deploy exitoso: tenés un contract ID (string `C...`)
- [ ] Verificación: `get_campaign "test-campaign"` retorna `CampaignNotFound`, no un error de RPC
- [ ] Variables de entorno enviadas a Rober por canal privado

---

## Si el deploy falla

**Fallback para la demo:** usar el contract ID original de leocagli:
```
STELLAR_CONTRACT_ID=CA2A624HHQVMBQUBA3ZPSZ6L3BOIYIQQHICJ26DJRCHAOL7TT2T226SQ
```
Con este ID solo podés hacer lecturas (`get_campaign`, `get_campaign_milestones`). No podés escribir (no tenés el admin secret). Sirve para mostrar el escrow visualmente pero no para validar milestones on-chain. **Es el fallback, no el objetivo.**

---

## Después de terminar este WB

→ Hacer SYNC 1 con Rober: pasarle el archivo `stellar.env.txt`  
→ Arrancar `LEO_WB02_stellar-lib.md`
