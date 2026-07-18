# Token event contract

Token accounting uses provider/tool-reported values only. Unknown values are `null`, never inferred from text or reconstructed from categories unless the provider explicitly defines that equality.

## Event fields

```json
{
  "timestamp": "<ISO 8601 with timezone>",
  "event": "token_usage",
  "session_id": "<session or null>",
  "ticket_id": "<ticket or null>",
  "sprint": "<sprint or null>",
  "agent": "<reported agent/tool or null>",
  "provider": "<provider or null>",
  "model": "<reported model ID or null>",
  "purpose": "<purpose>",
  "input_tokens": null,
  "output_tokens": null,
  "reasoning_tokens": null,
  "cache_read_tokens": null,
  "cache_write_tokens": null,
  "reported_total_tokens": null,
  "cost_usd": null,
  "source": "tool-reported"
}
```

Purpose is one of:

- `planning`
- `environment`
- `implementation`
- `review`
- `rework`
- `measurement`
- `documentation`
- `retro`
- `unattributed`

Preserve provider-reported categories separately. Raw token totals from different providers are not directly comparable productivity units because tokenization, caching, reasoning accounting, and billing differ. Aggregate and compare efficiency only inside compatible provider/accounting populations, with coverage disclosed.

Token metrics are diagnostic. They never override correctness, verification, research validity, or useful review.
