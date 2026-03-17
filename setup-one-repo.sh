#!/bin/bash
# Script para criar e conectar o repositório "One" no GitHub
# Execute este script após criar o repositório em https://github.com/new

REPO_NAME="One"
GITHUB_USER="plomel"
LOCAL_PATH="/home/user/One"

echo "Configurando repositório $REPO_NAME..."

mkdir -p "$LOCAL_PATH"
cd "$LOCAL_PATH"

if [ ! -d ".git" ]; then
  git init
  git branch -m main
fi

# Adiciona remote se não existir
if ! git remote | grep -q origin; then
  git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
  echo "Remote 'origin' adicionado: https://github.com/$GITHUB_USER/$REPO_NAME.git"
else
  echo "Remote 'origin' já existe: $(git remote get-url origin)"
fi

echo ""
echo "Próximos passos:"
echo "1. Cria o repositório em: https://github.com/new (nome: $REPO_NAME)"
echo "2. Executa: cd $LOCAL_PATH && git push -u origin main"
