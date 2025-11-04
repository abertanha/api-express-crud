#!/bin/bash
PASS_COUNT=0
FAIL_COUNT=0

for i in {1..10}; do
  echo "Execução $i..."
  OUTPUT=$(deno test --no-check --allow-read --allow-env --allow-net features/user/UserController.test.ts 2>&1)
  
  if echo "$OUTPUT" | grep -q "92 passed"; then
    ((PASS_COUNT++))
    echo "✓ PASSOU"
  else
    ((FAIL_COUNT++))
    echo "✗ FALHOU"
    echo "$OUTPUT" | tail -20
  fi
  
  sleep 0.5
done

echo ""
echo "========== RESUMO =========="
echo "Sucessos: $PASS_COUNT/10"
echo "Falhas: $FAIL_COUNT/10"
