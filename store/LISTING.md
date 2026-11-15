# Página da loja — textos e imagens

Tudo o que vai em **Play Console → Presença na loja → Página principal da loja**.

## Imagens

| Campo | Arquivo | Tamanho |
|---|---|---|
| Ícone do app | `store/play-icon-512.png` | 512×512 |
| Recurso gráfico (imagem de destaque) | `store/feature-graphic-1024x500.png` | 1024×500 |
| Capturas de tela do telefone | `store/screenshots/01-menu.png` … `06-loja.png` | 1080×1920 (9:16) |

Ordem sugerida das capturas: 03-combo (a mais chamativa primeiro), 02-classico, 04-aventura-mapa, 05-tema-neon, 06-loja, 01-menu.

Para refazer as capturas depois de mudar o visual: `npm run dev` e, em outro terminal, `node scripts/store-screenshots.cjs store/screenshots` (precisa do Playwright).

---

## Português (Brasil) — idioma padrão

**Nome do app** (até 30): `Tessel Block`

**Descrição curta** (até 80):

```
Encaixe peças, limpe linhas, faça combos e vença 100 níveis de aventura!
```

**Descrição completa** (até 4000):

```
Tessel Block é um quebra-cabeça de blocos relaxante e viciante. Arraste as peças para o tabuleiro 8×8, complete linhas e colunas e veja tudo explodir em partículas e moedas de ouro!

✦ DOIS MODOS DE JOGO
• Clássico: jogue sem fim e bata o seu recorde.
• Aventura: 100 níveis com tabuleiros desenhados, metas de pontos e até 3 estrelas em cada. Vença todos para completar a Joia Tessel!

✦ COMBOS E SEQUÊNCIAS
Limpe várias linhas de uma vez e encadeie jogadas para multiplicar suas moedas.

✦ 10 TEMAS PARA DESBLOQUEAR
Estúdio Minimalista, Doces & Gelatina, Madeira Zen, Cyber Neon, Arcade Pixel, Aurora Glacial, Magma Vulcânico, Cofre Ouro & Mármore, Galáxia Cósmica e Esmeralda VIP. Cada tema muda o tabuleiro e as peças e aumenta as moedas que você ganha.

✦ SONS DE ENCAIXE
Pop Clássico, Bloco de Madeira, Bolha Pop e Cristal — escolha o "toc" que mais combina com você.

✦ FEITO PARA RELAXAR
• Funciona 100% offline
• Sem anúncios e sem compras
• Sem cadastro e sem coleta de dados
• Vibração e efeitos caprichados
• A partida é salva sozinha: feche o app e continue depois

As moedas de ouro são virtuais e servem só para desbloquear visuais dentro do jogo — não têm valor em dinheiro e não podem ser compradas.
```

---

## English (United States) — tradução opcional

Em **Presença na loja → Página principal → Gerenciar traduções → Adicionar tradução → Inglês (Estados Unidos)**.

**Short description:**

```
Fit blocks, clear lines, chain combos and beat 100 adventure levels!
```

**Full description:**

```
Tessel Block is a relaxing, addictive block puzzle. Drag pieces onto the 8×8 board, complete rows and columns and watch them burst into particles and gold coins!

✦ TWO GAME MODES
• Classic: endless play — beat your high score.
• Adventure: 100 hand-designed levels with score goals and up to 3 stars each. Clear them all to complete the Tessel Gem!

✦ COMBOS AND STREAKS
Clear several lines at once and chain moves to multiply your coins.

✦ 10 THEMES TO UNLOCK
From Minimal Studio and Candy Jelly to Cyber Neon, Arcade Pixel, Cosmic Galaxy and Emerald VIP. Every theme restyles the board and pieces and boosts the coins you earn.

✦ PLACEMENT SOUNDS
Classic Pop, Wood Block, Bubble Pop and Crystal — pick the click you like best.

✦ MADE TO RELAX
• Works 100% offline
• No ads and no purchases
• No sign-up and no data collection
• Satisfying haptics and effects
• Your game saves automatically — close the app and pick up later

Gold coins are virtual and only unlock cosmetic items in the game. They have no monetary value and cannot be bought.
```

> O jogo em si está só em português. Se publicar a página em inglês, vale avisar na descrição ("Game language: Portuguese") ou deixar só o pt-BR por enquanto.
