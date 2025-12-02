# GitHub Actions - Build Automático

## Como usar

### 1. Fazer alterações no código normalmente

Trabalhe no código como sempre, faça commits normalmente:

```bash
git add .
git commit -m "Sua mensagem de commit"
git push origin main
```

### 2. Criar uma nova versão (Release)

Quando quiser publicar uma nova versão do app:

```bash
# Atualizar a versão no package.json (se quiser)
# Criar uma tag de versão
git tag v0.1.0

# Enviar a tag para o GitHub
git push origin v0.1.0
```

### 3. Aguardar o build

- O GitHub Actions detectará a tag e iniciará o build automaticamente
- Você pode acompanhar em: `https://github.com/RimuSrPao/Lumen/actions`
- O processo leva cerca de 5-10 minutos

### 4. Baixar o instalador

Após o build ser concluído:
- Vá em: `https://github.com/RimuSrPao/Lumen/releases`
- A nova versão aparecerá lá
- Baixe o arquivo `.exe` e instale!

## Versionamento

Use o padrão semântico:
- `v0.1.0` - Primeira versão
- `v0.2.0` - Nova feature
- `v0.1.1` - Bug fix

## Problemas comuns

### Build falhou?
- Verifique os logs em Actions
- Pode ser erro de compilação no código
- Verifique se todas as dependências estão no package.json

### Release não apareceu?
- Certifique-se que a tag começa com `v` (ex: v0.1.0, não 0.1.0)
- Verifique se o workflow terminou com sucesso
