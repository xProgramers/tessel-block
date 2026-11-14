# Publicar o Tessel Block na Google Play

Guia passo a passo, do código até a loja. O projeto Android já está pronto na pasta `android/` (gerado com Capacitor).

## 0. Antes de tudo: o ID do app

O ID do pacote é **`com.xprogramers.tesselblock`**. Ele é **permanente**: depois do primeiro envio à Play Store não dá para mudar. Se quiser outro, troque agora em dois lugares e rode `npm run android:sync`:

- `capacitor.config.json` → `appId`
- `android/app/build.gradle` → `namespace` e `applicationId`

## 1. Instalar o Android Studio

Baixe em <https://developer.android.com/studio> e instale com as opções padrão (ele já inclui o Java e o Android SDK). Na primeira abertura, deixe o assistente baixar os componentes.

## 2. Abrir o projeto

Na pasta do projeto:

```bash
npm install
npm run android
```

Isso gera a versão web, copia para o projeto Android e abre o Android Studio. Espere o "Gradle sync" terminar (barra inferior).

Sempre que mudar o código do jogo, rode `npm run android:sync` antes de gerar uma nova versão.

## 3. Testar no celular

1. No celular: **Configurações → Sobre o telefone →** toque 7 vezes em **Número da versão** para liberar as Opções do desenvolvedor. Depois ative **Depuração USB**.
2. Conecte o celular no computador e aceite o aviso no celular.
3. No Android Studio, escolha o celular no topo e clique em ▶ **Run**.

Confira: vibração ao encaixar, botão voltar fechando a loja, barra de status legível em todos os temas, som e progresso salvo depois de fechar e abrir o app.

## 4. Gerar o arquivo para a loja (.aab assinado)

1. **Build → Generate Signed App Bundle or APK… → Android App Bundle**.
2. Em *Key store path*, clique em **Create new…** e crie a chave de upload:
   - salve o arquivo `.jks` **fora** da pasta do projeto (ex.: `Documentos/chaves/tessel-block-upload.jks`);
   - anote a senha da keystore, o *alias* e a senha da chave.
3. Escolha **release** e finalize. O arquivo sai em `android/app/release/app-release.aab`.

> ⚠️ **Guarde a keystore e as senhas em local seguro (e com backup).** Sem elas você não consegue enviar atualizações. Nunca coloque a keystore no GitHub — o `.gitignore` já bloqueia `*.jks` e `*.keystore`.

A cada nova versão, aumente em `android/app/build.gradle`:
- `versionCode` (inteiro, sempre +1: 1, 2, 3…)
- `versionName` (o que o jogador vê: "1.0.1", "1.1.0"…)

## 5. Google Play Console

1. Crie a conta de desenvolvedor em <https://play.google.com/console> (taxa única de US$ 25 e verificação de identidade).
2. **Criar app** → nome "Tessel Block", idioma Português (Brasil), tipo **Jogo**, **Gratuito**.
3. Preencha **Configurar seu app** (painel inicial):
   - **Política de privacidade:** URL pública de `docs/politica-de-privacidade.md` (o link do arquivo no GitHub serve, desde que o repositório seja público — ou publique no GitHub Pages). Troque `[SEU E-MAIL DE CONTATO]` antes.
   - **Acesso ao app:** todas as funções disponíveis sem restrições.
   - **Anúncios:** não contém anúncios.
   - **Classificação do conteúdo:** questionário — jogo de quebra-cabeça, sem violência, sem apostas com dinheiro real. As moedas são virtuais, sem compra e sem troca por prêmios.
   - **Público-alvo:** escolha as faixas etárias (se incluir menores de 13, o app passa por regras da política "Famílias").
   - **Segurança dos dados:** o app **não coleta nem compartilha dados**.
   - **Categoria:** Jogos → Quebra-cabeça.
4. **Página da loja (Presença na loja → Página principal):**
   - Ícone 512×512: `store/play-icon-512.png`
   - Imagem de destaque 1024×500: `store/feature-graphic-1024x500.png`
   - Capturas de tela do celular: mínimo 2 (recomendado 4–8), tiradas no próprio aparelho — mostre o tabuleiro, um combo, a loja de temas e a loja de sons.
   - Descrição curta (até 80 caracteres) e descrição completa — sugestões abaixo.

## 6. Teste fechado (obrigatório para contas pessoais novas)

Contas de desenvolvedor pessoais criadas recentemente precisam rodar um **teste fechado** com um número mínimo de testadores por um período mínimo antes de liberar a produção (a regra vigente quando este guia foi escrito era 12 testadores por 14 dias — confira o número atual no Play Console).

1. **Testar → Teste fechado → Criar faixa**, envie o `.aab`.
2. Adicione os e-mails dos testadores (lista de e-mails ou Grupo do Google) e compartilhe o link de participação.
3. Os testadores precisam aceitar o convite e manter o app instalado durante o período.
4. Depois disso, peça acesso à **Produção** no painel e envie a versão.

## 7. Sugestões de texto para a loja

**Descrição curta:**
> Encaixe peças, limpe linhas, faça combos e desbloqueie temas incríveis!

**Descrição completa:**
> Tessel Block é um quebra-cabeça de blocos relaxante e viciante. Arraste as peças para o tabuleiro 8×8, complete linhas e colunas e veja tudo explodir em partículas e moedas de ouro!
>
> ✦ Combos e sequências multiplicam suas moedas
> ✦ 10 temas para o tabuleiro e as peças: Doces & Gelatina, Madeira Zen, Cyber Neon, Arcade Pixel, Aurora Glacial, Magma, Ouro & Mármore, Galáxia e Esmeralda VIP
> ✦ Sons de encaixe para escolher: Madeira, Bolha, Cristal…
> ✦ Efeitos, vibração e sons caprichados
> ✦ Funciona 100% offline, sem anúncios e sem coleta de dados
>
> As moedas de ouro são virtuais e servem só para desbloquear visuais no jogo — não têm valor em dinheiro.

## Resumo dos comandos

| Comando | O que faz |
|---|---|
| `npm run android` | Gera a web, sincroniza e abre o Android Studio |
| `npm run android:sync` | Gera a web e sincroniza com o projeto Android |
| `npm run icons` | Recria ícone, tela de abertura e artes da loja a partir do logo |
