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
| `npm run simulate` | Simula centenas de partidas com bots e mostra ganho de moedas/min e o tempo para desbloquear a loja |

## Estrutura

```
src/
  App.jsx                 estado do jogo, arrastar e soltar, pontuação
  components/             Board, PieceTray, FloatingMoney, ShopModal, GameOverModal, ParticleCanvas…
  audio/soundEngine.js    efeitos sonoros sintetizados e pacotes de som de encaixe
  game/
    logic.js              regras do tabuleiro e gerador de peças
    pieces.js             formatos das peças e pesos de sorteio
    economy.js            regras de ganho de moedas (combo, streak, bônus)
    themes.js             os 10 temas da loja (preço, multiplicador, visual)
    sounds.js             os pacotes de som da loja
    format.js             formatação de moedas e save assinado no localStorage
scripts/simulate.mjs      simulador de balanceamento
```

## Balanceamento

A economia fica em `src/game/economy.js` e os preços em `src/game/themes.js` e `src/game/sounds.js`. Depois de mudar qualquer valor, rode `npm run simulate` para conferir o impacto. Meta atual: primeiro desbloqueio em ~4 min de jogo e loja de temas completa em ~7 h.

## Progresso do jogador

O progresso (moedas, temas, sons e recorde) fica no `localStorage` do aparelho, num registro com assinatura que detecta edição manual. Isso dificulta trapaça casual, mas não substitui validação em servidor.
