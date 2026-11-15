# Tessel Block

Jogo de quebra-cabeça de blocos 8×8: arraste as peças para o tabuleiro, complete linhas e colunas, faça combos e junte moedas de ouro para desbloquear temas e sons na loja.

Feito com React, Vite, Tailwind CSS e Lucide Icons. Todo o áudio é sintetizado na hora com a Web Audio API (sem arquivos de som).

> Jogo recreativo — as moedas são virtuais e não têm valor monetário.

## Rodar localmente

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Abra http://localhost:5173.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarregamento automático |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve a versão de produção localmente |
| `npm test` | Roda os testes (regras do tabuleiro, economia e save) |
| `npm run simulate` | Simula centenas de partidas com bots e mostra ganho de moedas/min e o tempo para desbloquear a loja |

## App Android (Google Play)

O app Android é gerado com [Capacitor](https://capacitorjs.com) e fica em `android/`. Funciona 100% offline (fonte embutida, sem permissão de internet), com vibração, botão voltar e tela travada em retrato.

```bash
npm run android        # gera a web, sincroniza e abre no Android Studio
npm run android:sync   # só sincroniza depois de mudar o código
npm run icons          # recria ícone, tela de abertura e artes da loja
```

Passo a passo completo de publicação: [docs/PUBLICAR-PLAY-STORE.md](docs/PUBLICAR-PLAY-STORE.md). Política de privacidade: [docs/politica-de-privacidade.md](docs/politica-de-privacidade.md). Artes da loja em `store/`.

## Estrutura

```
src/
  App.jsx                 estado do jogo, arrastar e soltar, pontuação
  native.js               integração Android: vibração, botão voltar, barra de status
  components/             Board, PieceTray, FloatingMoney, ShopModal, GameOverModal, ParticleCanvas…
  audio/soundEngine.js    efeitos sonoros sintetizados e pacotes de som de encaixe
  game/
    logic.js              regras do tabuleiro e gerador de peças
    pieces.js             formatos das peças e pesos de sorteio
    economy.js            regras de ganho de moedas (combo, streak, bônus)
    themes.js             os 10 temas da loja (preço, multiplicador, visual)
    sounds.js             os pacotes de som da loja
    format.js             formatação de moedas e save assinado no localStorage
tests/                    testes (Vitest) — rodam também no CI do GitHub a cada push/PR
scripts/simulate.mjs      simulador de balanceamento
scripts/make-icons.mjs    gera ícone, tela de abertura e artes da loja a partir do logo
assets/                   imagens-fonte do ícone e da abertura
store/                    ícone 512 e imagem de destaque para a Play Store
android/                  projeto Android (Capacitor)
docs/                     guia de publicação e política de privacidade
```

## Balanceamento

A economia fica em `src/game/economy.js` e os preços em `src/game/themes.js` e `src/game/sounds.js`. Depois de mudar qualquer valor, rode `npm run simulate` para conferir o impacto. Meta atual: primeiro desbloqueio em ~4 min de jogo e loja de temas completa em ~7 h.

## Progresso do jogador

O progresso (moedas, temas, sons e recorde) fica no `localStorage` do aparelho, num registro com assinatura que detecta edição manual. Isso dificulta trapaça casual, mas não substitui validação em servidor.

A partida em andamento (tabuleiro, peças e pontuação) também é salva a cada jogada, assinada do mesmo jeito, então o jogo continua de onde parou se o Android fechar o app em segundo plano. Temas ou sons que deixarem de existir numa versão nova são descartados do save sem zerar o resto do progresso.
