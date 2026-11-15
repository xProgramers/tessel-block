# Publicar o Tessel Block na Google Play

Guia passo a passo, do código até a loja. O projeto Android já está pronto na pasta `android/` (Capacitor 8, `targetSdk 36`, ícone adaptativo, tela de abertura, retrato, offline).

Arquivos de apoio:

- Textos e imagens da página da loja: [`store/LISTING.md`](../store/LISTING.md)
- Respostas dos formulários do Play Console: [`docs/play-console-respostas.md`](play-console-respostas.md)
- Política de privacidade: [`docs/politica-de-privacidade.md`](politica-de-privacidade.md)

## 0. ID e versão do app

- **ID do pacote:** `com.xprogramers.tesselblock`. É **permanente**: depois do primeiro envio à Play Store não dá para mudar.
- **Versão:** em `android/app/build.gradle`. A cada envio novo, aumente:
  - `versionCode` (inteiro, sempre +1: 1, 2, 3…). O Play Console recusa um número repetido.
  - `versionName` (o que o jogador vê: "1.0.0", "1.0.1", "1.1.0"…)

## 1. Criar a chave de upload (uma vez só)

A Play Store exige que o `.aab` seja assinado. Você cria uma **chave de upload** no seu computador; o Google guarda a chave definitiva do app (Play App Signing).

O `keytool` vem junto com o Android Studio. No **Windows (PowerShell)**:

```powershell
mkdir "$env:USERPROFILE\Documents\chaves" -Force
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkeypair -v `
  -keystore "$env:USERPROFILE\Documents\chaves\tessel-block-upload.jks" `
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

No **macOS/Linux**:

```bash
mkdir -p ~/chaves
keytool -genkeypair -v -keystore ~/chaves/tessel-block-upload.jks \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Ele pede uma senha (mínimo 6 caracteres) e algumas informações (nome, cidade, país `BR`). Ao final confirme com `sim`/`yes`.

> ⚠️ **Guarde o arquivo `.jks` e a senha em local seguro, com backup** (ex.: um pendrive e um gerenciador de senhas). Se perder, dá para pedir ao Google para trocar a chave de upload, mas leva alguns dias. **Nunca coloque a chave no GitHub** — o `.gitignore` já bloqueia `*.jks` e `android/keystore.properties`.

## 2. Dizer ao projeto onde está a chave

Copie `android/keystore.properties.example` para `android/keystore.properties` e preencha:

```properties
storeFile=C:/Users/SEU_USUARIO/Documents/chaves/tessel-block-upload.jks
storePassword=SUA_SENHA
keyAlias=upload
keyPassword=SUA_SENHA
```

Use barras normais (`/`) no caminho, mesmo no Windows. Se o keytool não perguntou uma senha separada para a chave, `keyPassword` é a mesma senha.

## 3. Gerar o .aab assinado

### Opção A — no seu computador

Precisa do [Android Studio](https://developer.android.com/studio) instalado (ele traz o Java e o Android SDK). Abra o projeto uma vez com `npm run android` e espere o "Gradle sync" terminar — isso cria o `android/local.properties` com o caminho do SDK.

Depois, sempre que quiser gerar uma versão:

```bash
npm install
npm run android:bundle
```

No Windows, se aparecer erro de `JAVA_HOME`, rode antes no PowerShell:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

O arquivo sai em **`android/app/build/outputs/bundle/release/app-release.aab`**. O script avisa no final se o bundle saiu assinado.

(Também dá pelo menu do Android Studio: **Build → Generate Signed App Bundle or APK… → Android App Bundle**, escolhendo a mesma keystore.)

### Opção B — pelo GitHub, sem Android Studio

O workflow **Android bundle** (`.github/workflows/android-release.yml`) gera o `.aab` num computador do GitHub.

1. Converta a chave para texto (base64):
   - Windows (PowerShell): `[Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\Documents\chaves\tessel-block-upload.jks")) | Set-Clipboard`
   - macOS: `base64 -i ~/chaves/tessel-block-upload.jks | pbcopy`
2. No GitHub: **Settings → Secrets and variables → Actions → New repository secret**, crie:
   - `TB_KEYSTORE_BASE64` — o texto copiado acima
   - `TB_KEYSTORE_PASSWORD` — senha da keystore
   - `TB_KEY_ALIAS` — `upload`
   - `TB_KEY_PASSWORD` — senha da chave
3. **Actions → Android bundle → Run workflow**. Quando terminar, baixe `tessel-block-aab` em **Artifacts** (vem num .zip; o `.aab` está dentro).

Os segredos ficam criptografados no GitHub e não aparecem nos logs.

## 4. Testar no celular (recomendado antes de enviar)

1. No celular: **Configurações → Sobre o telefone →** toque 7 vezes em **Número da versão** e ative **Depuração USB** nas Opções do desenvolvedor.
2. Conecte no computador, aceite o aviso e, no Android Studio, clique em ▶ **Run**.

Confira: vibração ao encaixar, botão voltar, barra de status legível em todos os temas, som, modo Aventura e progresso salvo depois de fechar e abrir o app.

## 5. Publicar a política de privacidade (GitHub Pages)

O Play Console exige uma URL pública. A pasta `docs/` já está pronta para o GitHub Pages:

1. No GitHub: **Settings → Pages**.
2. Em *Build and deployment*: **Source = Deploy from a branch**, **Branch = `main`**, pasta **`/docs`** → **Save**.
3. Em 1–2 minutos a política fica em: **https://xprogramers.github.io/tessel-block/politica-de-privacidade.html**

## 6. Google Play Console

1. **Criar app** → nome "Tessel Block", idioma padrão **Português (Brasil)**, tipo **Jogo**, **Gratuito**, aceite as declarações.
2. **Painel → Configurar seu app**: preencha cada item com as respostas de [`docs/play-console-respostas.md`](play-console-respostas.md) (política de privacidade, acesso ao app, anúncios, classificação do conteúdo, público-alvo, segurança dos dados, ID de publicidade, apps governamentais, recursos financeiros, saúde, categoria e contato).
3. **Presença na loja → Página principal da loja**: textos, ícone, imagem de destaque e capturas de [`store/LISTING.md`](../store/LISTING.md).

## 7. Teste fechado (obrigatório para contas pessoais novas)

Contas de desenvolvedor **pessoais** criadas depois de novembro de 2023 só liberam a produção depois de um **teste fechado com pelo menos 12 testadores inscritos por 14 dias seguidos** (confira o número atual no Painel do Play Console — ele mostra a contagem e os dias). Contas de organização (empresa com CNPJ/D-U-N-S) não têm essa exigência.

1. **Testar e lançar → Teste → Teste fechado → Criar faixa** (ou use a faixa "Alpha" que já vem criada).
2. **Testadores:** crie uma lista de e-mails (contas Google — de preferência que usem Android) com pelo menos 12 pessoas; dá para pôr uns 15 para ter folga.
3. **Criar nova versão:** na primeira vez, aceite o **Play App Signing** (o Google guarda a chave do app). Envie o `app-release.aab`, escreva as notas da versão e **Salvar → Revisar versão → Iniciar lançamento**.
4. A primeira revisão do Google leva de algumas horas a alguns dias.
5. Depois de aprovado, copie o **link de participação** do teste e mande para os testadores. Cada um precisa abrir o link, **aceitar o convite** e **instalar o app pela Play Store**, e manter instalado os 14 dias.
6. Atualizações durante o teste são bem-vindas (contam como "uso ativo"): aumente o `versionCode` e envie um `.aab` novo na mesma faixa.
7. Passados os 14 dias com 12+ testadores, aparece **Solicitar acesso à produção** no Painel. Responda o questionário (modelos em `docs/play-console-respostas.md`) — a análise leva até ~7 dias.
8. Com o acesso liberado: **Produção → Criar nova versão**, envie o `.aab` (ou promova a versão do teste) e **Iniciar lançamento**.

## Resumo dos comandos

| Comando | O que faz |
|---|---|
| `npm run android` | Gera a web, sincroniza e abre o Android Studio |
| `npm run android:sync` | Gera a web e sincroniza com o projeto Android |
| `npm run android:bundle` | Gera o `.aab` de release (assinado, se `android/keystore.properties` existir) |
| `npm run icons` | Recria ícone, tela de abertura e artes da loja a partir do logo |
