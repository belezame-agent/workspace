---
name: openrouter-balance
description: Check the current OpenRouter credit balance (total, used, remaining). Use when the user asks about their OpenRouter budget, credits, balance, or spending. Automatically resolves the API key from the local OpenClaw config.
---

# OpenRouter Balance

Run `scripts/check_balance.sh` to fetch and display the current balance.

```bash
bash skills/openrouter-balance/scripts/check_balance.sh
```

The script:
1. Auto-resolves the OpenRouter API key from `~/.openclaw/agents/main/agent/auth-profiles.json`
2. Calls `https://openrouter.ai/api/v1/credits`
3. Outputs total credits, amount used, and remaining balance

Optionally pass an API key explicitly:
```bash
bash skills/openrouter-balance/scripts/check_balance.sh sk-or-v1-...
```
