# Guia de Configuração do Firebase para o Lumen

Siga estes passos para obter suas chaves de API e ativar o Login com Google.

## Passo 1: Acessar as Configurações do Projeto
1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Clique no projeto que você acabou de criar.
3. No menu lateral esquerdo, clique no ícone de engrenagem (⚙️) ao lado de "Visão geral do projeto" e selecione **Configurações do projeto**.

## Passo 2: Criar o App Web
1. Role a página para baixo até a seção **Seus aplicativos**.
2. Clique no ícone de **Web** (parece com `</>`).
3. Em "Apelido do app", digite `Lumen` e clique em **Registrar app**.
4. **Não** precisa marcar a opção de "Firebase Hosting" por enquanto.

## Passo 3: Copiar as Chaves (SDK)
1. Após registrar, você verá um bloco de código com `const firebaseConfig = { ... };`.
2. Copie apenas o conteúdo dentro das chaves `{ ... }` ou o objeto inteiro.
3. As chaves se parecem com isso:
   ```javascript
   apiKey: "AIzaSy...",
   authDomain: "seu-projeto.firebaseapp.com",
   projectId: "seu-projeto",
   // ...
   ```

## Passo 4: Colar no Projeto
1. Abra o arquivo `src/firebase.js` no seu editor de código.
2. Substitua os placeholders pelas chaves que você copiou. O arquivo deve ficar assim:

```javascript
const firebaseConfig = {
  apiKey: "SUA_CHAVE_COPIADA_DO_SITE",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "NUMEROS",
  appId: "1:NUMEROS:web:LETRAS"
};
```

## Passo 5: Ativar o Google Auth
**Importante**: Só ter as chaves não basta, você precisa ativar o login.

1. No menu lateral esquerdo do Console do Firebase, clique em **Criação** (ou Build) > **Authentication**.
2. Clique em **Vamos começar**.
3. Na aba **Sign-in method** (Método de login), clique em **Google**.
4. Clique no botão de alternância para **Ativar**.
5. Em "Nome do projeto para o público", deixe como Lumen.
6. Em "E-mail de suporte", selecione o seu e-mail.
7. Clique em **Salvar**.

Pronto! Agora o botão de "Entrar com Google" no app deve funcionar.
