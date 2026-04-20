#!/bin/bash
set -e

# Carrega token e scope do arquivo de secrets local
if [ ! -f .deploy.env ]; then
  echo "❌ Arquivo .deploy.env não encontrado. Crie-o com VERCEL_TOKEN e VERCEL_SCOPE."
  exit 1
fi
source .deploy.env

# Mensagem de commit (aceita como argumento ou usa data/hora)
COMMIT_MSG="${1:-deploy: $(date '+%Y-%m-%d %H:%M')}"

echo ""
echo "🧪 Rodando testes..."
npx jest --no-coverage
echo "✅ Testes passaram."

echo ""
echo "📤 Enviando para GitHub..."
git add -A
if git diff --cached --quiet; then
  echo "ℹ️  Nada para commitar — apenas fazendo push."
else
  git commit -m "$COMMIT_MSG"
fi
git push origin main
echo "✅ GitHub atualizado."

echo ""
echo "🚀 Deploying para Vercel..."
npx vercel --token "$VERCEL_TOKEN" --prod --yes --scope "$VERCEL_SCOPE"
echo "✅ Deploy concluído!"

echo ""
echo "🎉 Tudo no ar! https://eduflow-gilt-five.vercel.app"
