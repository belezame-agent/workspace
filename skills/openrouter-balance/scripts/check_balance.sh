#!/usr/bin/env bash
# check_balance.sh - Fetch OpenRouter credit balance
# Usage: ./check_balance.sh [api_key]

API_KEY="${1:-}"

# Try to resolve key from OpenClaw config if not provided
if [ -z "$API_KEY" ]; then
  CONFIG="$HOME/.openclaw/agents/main/agent/auth-profiles.json"
  if [ -f "$CONFIG" ]; then
    API_KEY=$(python3 -c "
import json, sys
with open('$CONFIG') as f:
    d = json.load(f)
profiles = d.get('profiles', {})
for k, v in profiles.items():
    if 'openrouter' in k.lower():
        print(v.get('key', ''))
        break
" 2>/dev/null)
  fi
fi

if [ -z "$API_KEY" ]; then
  echo "ERROR: No OpenRouter API key found." >&2
  exit 1
fi

RESPONSE=$(curl -sf https://openrouter.ai/api/v1/credits \
  -H "Authorization: Bearer $API_KEY" 2>&1)

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to reach OpenRouter API." >&2
  exit 1
fi

# Parse and display
python3 -c "
import json, sys
data = json.loads('''$RESPONSE''')
d = data.get('data', data)
total = float(d.get('total_credits', 0))
used  = float(d.get('total_usage', 0))
remaining = total - used
print(f'OpenRouter Balance')
print(f'  Total credits : \${total:.2f}')
print(f'  Used          : \${used:.4f}')
print(f'  Remaining     : \${remaining:.4f}')
"
