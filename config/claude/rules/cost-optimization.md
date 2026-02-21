# Gadget Platform Operations Cost Optimization Reference

Use this reference when analyzing customer app platform credit usage, projecting costs, or advising on optimization strategies.

## Platform Credit Ratios

Source of truth: `packages/api/src/services/billing/metrics.ts` (lines 562-633).

| Operation | Display Name | Default Ratio | Notes |
|---|---|---|---|
| `webhook_action_dispatch` | Webhook action runs | 2.0 | Per webhook-triggered action execution |
| `sync_or_scheduled_action_dispatch` | Sync/scheduled action runs | 2.0 | Per sync or scheduled-triggered action execution |
| `background_action_dispatch` | Background action runs | 2.0 | Per background action execution |
| `background_action_enqueue` | Background action enqueues | 2.0 | Per `api.enqueue()` call |
| `connection_action_filtered` | Filter & idempotency checks | 0.2 | When action is skipped (mutually exclusive with dispatch) |
| `payload_enrichment` | Payload enrichments | 1.0 | Shopify payload enrichment calls |
| `request` | Requests | 0.1 | HTTP/GraphQL requests |
| `database_read` | Database reads | 0.05 | |
| `database_write` | Database writes | 0.5 | |
| `search_read` | Search reads | 0.2 | OpenSearch/vector search |
| `search_write` | Search writes | 0.02 | |
| `session_operation` | Session operations | 0.05 | |
| `file_download` | File downloads | 1.0 | |

Ratios can be overridden per billing account via `entitlements.platformCreditOverrides`.

## Sync Idempotency: Filter vs Action Run (Mutually Exclusive)

Source: `packages/api/src/services/connections/shopify/ShopifyPayloadProcessor.ts`, `shouldRunAction` method (lines 363-573).

When a sync (or webhook) processes a record, Gadget checks `shopifyUpdatedAt`:

- **`shopifyUpdatedAt` is newer** -> action RUNS -> billed as action dispatch (2.0 credits), NOT as filter
- **`shopifyUpdatedAt` is equal or older (no force)** -> action SKIPPED -> billed as filter check (0.2 credits), NOT as dispatch
- **Force mode** (`force=true`): equal timestamps also trigger the action to run

**Key insight**: Filter & idempotency checks and action dispatches are **mutually exclusive billing line items** for the same action evaluation. You never pay for both on the same record.

This means:
- A nightly sync over models with no changes costs only 0.2 credits per model per shop (trivial)
- The filter check is doing its job — it's 10x cheaper than running the action
- High "filter & idempotency" volume is a sign the system is *working correctly*, not a problem
- Customers often misread filter checks as ~50% of costs because they're ~50% of raw volume, but at 0.2x vs 2.0x they're typically only 4-5% of actual credit spend

## Common Cost Patterns

### Background Action Cascade (Expensive)

Pattern: Model action (2.0) -> `api.enqueue()` (2.0) -> BG action run (2.0) = **6.0 credits minimum per change**

This is the single most impactful pattern to optimize. Moving the BG action's work inline into the parent action's `onSuccess` eliminates the enqueue + BG run, reducing cost from ~6.0 to ~2.0 credits per change (~67% reduction for that flow).

### Webhook vs Sync Action Dispatch Semantics

Source: `packages/api/src/services/connections/shopify/ShopifyPayloadProcessor.ts` (`enqueueBackgroundExecution`) and `packages/api/src/services/connections/shopify/webhooks.ts`.

**Webhook-triggered actions ARE background actions** with platform-controlled retries:
- Production: up to 10 total attempts (9 retries) — `PRODUCTION_WEBHOOK_MAX_ATTEMPTS`
- Development: 2 total attempts — `DEVELOPMENT_WEBHOOK_MAX_ATTEMPTS`
- Retry policy: exponential backoff, factor 2, starting 2s, randomized
- Constants in `packages/api/src/services/connections/utils.ts`
- The action's own `options.retries` is NOT consulted — retries are platform-controlled
- Each webhook element is enqueued as a `"shopify-webhook-element"` BG action with deterministic ID (`shopify-webhook-{shopId}-{topic}-{webhookId}`)

**Sync-triggered actions are NOT background actions:**
- They run inline within the sync Temporal activity via `processor.planAndExecute()`
- No per-record retry mechanism (sync-level retries only)
- Source: `packages/api/src/services/connections/shopify/ShopSyncResourceHelper.ts`

### Inline vs BG Action: Retry/Idempotency Tradeoffs

**BG action `create` retries are NOT idempotent:**
- If `run()` succeeds (record created, transaction committed) but `onSuccess()` fails -> action is retried
- Retry runs `run()` again with fresh record -> `save(record)` creates a DUPLICATE row
- Any side effects in `onSuccess()` (HTTP calls, usage events) also re-fire

**Inline approach (in parent's `onSuccess`) reduces but does NOT eliminate duplication risk:**
- Webhook-triggered parent actions ARE background actions with retries (up to 10 in prod)
- If parent `onSuccess()` fails after creating an audit log inline, retry re-runs both `run()` and `onSuccess()` -> duplicate audit log
- However, the current BG approach has TWO layers of retry duplication risk:
  1. Parent webhook action retries (up to 10x) -> re-enqueues the BG action (no dedup `id` on `api.enqueue()`)
  2. BG audit log action retries (per `retries` option) -> re-creates the record
- Inline reduces this to ONE layer (parent retries only)
- Sync-triggered parent actions do NOT have this risk (no per-record retries)

**To truly fix duplication, add an idempotency guard:**
- Use a deterministic ID or dedup key when creating records (e.g., check for existing audit log before creating)
- Or use `api.enqueue()` with a deterministic `id` and `onDuplicateID: "ignore"` if keeping BG approach

### Initial Sync Spikes

New Shopify installs trigger a full sync of all historical data. A large store can generate millions of sync-triggered actions in a single day. These are one-time costs that don't recur. Always check for initial syncs when investigating sudden cost spikes.

### Nightly Sync Scope

Check `scheduledShopifySync` (or equivalent) for models being synced. Common optimizations:
- Billing/metadata models with no changes cost only 0.2 credits/model/shop (filter check) — removing them saves negligible credits
- Sync-only models (no webhook topic, e.g. `shopifyFile`) MUST stay in explicit sync — reconciliation won't cover them
- Models already covered by webhooks AND reconciliation get triple-synced if also in nightly sync — but the cost is only 0.2 credits when `shopifyUpdatedAt` hasn't changed

### `includeFields` Webhook Optimization

`includeFields` on Shopify webhook triggers limits which field changes generate webhooks. This is already an optimization — confirm it's in use before suggesting it. Only configured per model action in the action's `options.triggers.shopify.includeFields`.

## Pricing Reference (as of Feb 2026)

| Plan | Base Price | Included Credits | Overage |
|---|---|---|---|
| Hobby (Free) | $0/month | 100K | N/A (hard limit) |
| Pro | $35/month | 1M | $1 per 100K |
| Premium | $350/month | 5M | $1 per 100K |

## Investigation Workflow

1. **Get 7-day chart data**: Use `examineChart` with `PlatformOperationsOverTime` (breakdown by `Source type` and `Source`). Split into 3d+3d+1d windows to avoid 254-row truncation.
2. **Check for spikes**: Look for initial sync events (new store installs) — use logs filtered by environment ID and `sync` trigger type.
3. **Calculate credit cost**: Multiply raw operation counts by their ratios. Filter checks (0.2x) are always the biggest volume but smallest credit contributor.
4. **Project monthly**: Extrapolate 7-day steady-state (excluding spikes) to 30 days. Add spike cost separately as one-time.
5. **Identify top cost drivers**: Usually action dispatches (webhook/sync/BG at 2.0x each) and BG action enqueues (2.0x) dominate.
6. **Look for cascade patterns**: Model action -> enqueue -> BG action = 6.0 credits. These are the best optimization targets.
