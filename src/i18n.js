// Idiomas do jogo. Português para quem usa português; inglês para todo o resto (padrão).
// O idioma é escolhido uma vez, antes da primeira tela: pelo SDK da CrazyGames quando o jogo
// roda lá (locale do jogador) e, fora dela, pelo idioma do navegador/aparelho.
//
// Para traduzir um texto novo: adicione a chave em `en` e em `pt` e use t('chave').
// Valores com {nome} são substituídos: t('level', { n: 3 }) → "Level 3".

const STRINGS = {
  en: {
    coins: 'Coins',
    yourCoins: 'Your gold coins',
    coinCount: '{n} coins',
    coinCountOne: '{n} coin',
    disclaimer: 'Just for fun — virtual coins have no monetary value.',
    soundOn: 'Turn sound on',
    soundOff: 'Mute',
    shop: 'Shop',
    shopButton: 'Shop / Levels',
    close: 'Close',
    backToMenu: 'Back to menu',
    backToMap: 'Back to map',
    map: 'Map',

    // Menu
    classic: 'Classic',
    continueGame: 'Continue game · {score}',
    best: 'Best {score}',
    adventure: 'Adventure',
    adventureDone: 'Complete!',
    level: 'Level {n}',

    // Partida
    boss: 'Boss',
    starsHint: 'Stars you get if you reach the goal on your next move',
    streakHint: 'Streak of moves that clear lines',
    restart: 'Restart game',
    restartConfirm: 'Restart?',
    themeMult: '{theme}: coins {mult}x',
    combo: 'Combo {n}x',
    streak: 'Streak {n}',
    noSpace: 'No space',
    pointsOf: '{points} of {target} points',
    newBest: '✨ new best!',
    bestLower: 'best {score}',
    tryAgain: 'Try again',
    availablePiece: 'Available piece',

    // Elogios
    praise1: 'Nice!',
    praise2: 'Great!',
    praise3: 'Amazing!',
    praise4: 'Fantastic!',
    praise5: 'Spectacular!',
    perfect: 'Perfect!',

    // Fim de nível
    adventureComplete: 'Adventure complete!',
    levelComplete: 'Level complete!',
    noSpaceTitle: 'No space!',
    noPieceFits: 'No piece fits. So close!',
    points: 'Points',
    rewardSuffix: 'reward',
    moreStarsHint: 'Reach the goal in fewer moves to earn more stars.',
    nextLevel: 'Next level',
    playAgain: 'Play again',
    replay: 'Replay',

    // Mapa
    gemDone: 'Gem collected!',
    gemGoal: 'Beat all {n} levels to collect the gem',
    levelsDone: '{done}/{n} levels',
    tileLabel: 'Level {n}',
    tileStars: ', {s} stars',
    tileLocked: ', locked',
    playLevel: 'Play level {n}',
    bossTag: 'boss',
    againTag: 'again',
    gemAria: 'Tessel gem collected',
    gemAriaProgress: 'Tessel gem: {lit} of 10 facets',

    // Loja
    themesCount: '{owned}/{total} themes · themes multiply your earnings',
    soundsCount: '{owned}/{total} placement sounds',
    tabThemes: 'Themes',
    tabSounds: 'Sounds',
    shopLevel: 'Level {n}',
    earnings: '{mult}x earnings',
    free: 'Free',
    soundsIntro: 'Sound played every time you place a piece. Tap {play} to listen before buying.',
    listen: 'Listen',
    listenTo: 'Listen to {name}',
    equipped: 'Equipped',
    equip: 'Equip',
    unlock: 'Unlock',
    missing: '{coins} short',

    // Temas
    'theme.minimal.name': 'Minimal Studio',
    'theme.minimal.tagline': 'Dark slate with soft, vibrant blocks.',
    'theme.candy.name': 'Candy & Jelly',
    'theme.candy.tagline': 'Pastel tones and shiny jelly blocks.',
    'theme.wood.name': 'Zen Wood',
    'theme.wood.tagline': 'Warm planks and wood-grain blocks.',
    'theme.neon.name': 'Cyber Neon',
    'theme.neon.tagline': 'Cyan/magenta grid and neon glass blocks.',
    'theme.pixel.name': 'Pixel Arcade',
    'theme.pixel.tagline': '8-bit arcade with CRT scanlines.',
    'theme.ice.name': 'Glacial Aurora',
    'theme.ice.tagline': 'Aurora skies and translucent ice blocks.',
    'theme.lava.name': 'Volcanic Magma',
    'theme.lava.tagline': 'Black basalt and glowing lava blocks.',
    'theme.gold.name': 'Gold & Marble Vault',
    'theme.gold.tagline': 'Black-and-gold luxury with golden particles.',
    'theme.cosmic.name': 'Cosmic Galaxy',
    'theme.cosmic.tagline': 'Starfield and nebula blocks.',
    'theme.emerald.name': 'VIP Emerald',
    'theme.emerald.tagline': 'Deep green with cut-crystal blocks.',

    // Sons
    'sound.classic.name': 'Classic Pop',
    'sound.classic.tagline': 'Full, soft "tock" with a low thump.',
    'sound.wood.name': 'Wood Block',
    'sound.wood.tagline': 'Dry, resonant wooden "tok".',
    'sound.bubble.name': 'Bubble Pop',
    'sound.bubble.tagline': 'Playful "plop" with a rising pitch.',
    'sound.crystal.name': 'Crystal',
    'sound.crystal.tagline': 'Glass chime — each piece size is a different note.',
  },

  pt: {
    coins: 'Moedas',
    yourCoins: 'Suas moedas de ouro',
    coinCount: '{n} moedas',
    coinCountOne: '{n} moeda',
    disclaimer: 'Jogo recreativo — moedas virtuais sem valor monetário.',
    soundOn: 'Ativar som',
    soundOff: 'Silenciar',
    shop: 'Loja',
    shopButton: 'Loja / Níveis',
    close: 'Fechar',
    backToMenu: 'Voltar ao menu',
    backToMap: 'Voltar ao mapa',
    map: 'Mapa',

    classic: 'Clássico',
    continueGame: 'Continuar partida · {score}',
    best: 'Recorde {score}',
    adventure: 'Aventura',
    adventureDone: 'Completa!',
    level: 'Nível {n}',

    boss: 'Chefão',
    starsHint: 'Estrelas se você bater a meta na próxima jogada',
    streakHint: 'Sequência de jogadas limpando linhas',
    restart: 'Reiniciar partida',
    restartConfirm: 'Reiniciar?',
    themeMult: '{theme}: moedas {mult}x',
    combo: 'Combo {n}x',
    streak: 'Streak {n}',
    noSpace: 'Sem espaço',
    pointsOf: '{points} de {target} pontos',
    newBest: '✨ novo recorde!',
    bestLower: 'recorde {score}',
    tryAgain: 'Tentar de novo',
    availablePiece: 'Peça disponível',

    praise1: 'Boa!',
    praise2: 'Ótimo!',
    praise3: 'Incrível!',
    praise4: 'Fantástico!',
    praise5: 'Espetacular!',
    perfect: 'Perfeito!',

    adventureComplete: 'Aventura completa!',
    levelComplete: 'Nível concluído!',
    noSpaceTitle: 'Sem espaço!',
    noPieceFits: 'Nenhuma peça cabe. Faltou pouco!',
    points: 'Pontos',
    rewardSuffix: 'de prêmio',
    moreStarsHint: 'Bata a meta com menos jogadas para ganhar mais estrelas.',
    nextLevel: 'Próximo nível',
    playAgain: 'Jogar de novo',
    replay: 'Repetir',

    gemDone: 'Joia conquistada!',
    gemGoal: 'Vença os {n} níveis para conquistar a joia',
    levelsDone: '{done}/{n} níveis',
    tileLabel: 'Nível {n}',
    tileStars: ', {s} estrelas',
    tileLocked: ', bloqueado',
    playLevel: 'Jogar nível {n}',
    bossTag: 'chefão',
    againTag: 'de novo',
    gemAria: 'Joia Tessel conquistada',
    gemAriaProgress: 'Joia Tessel: {lit} de 10 facetas',

    themesCount: '{owned}/{total} temas · temas multiplicam seus ganhos',
    soundsCount: '{owned}/{total} sons de encaixe',
    tabThemes: 'Temas',
    tabSounds: 'Sons',
    shopLevel: 'Nível {n}',
    earnings: '{mult}x ganhos',
    free: 'Grátis',
    soundsIntro: 'Som tocado a cada peça encaixada. Toque em {play} para ouvir antes de comprar.',
    listen: 'Ouvir',
    listenTo: 'Ouvir {name}',
    equipped: 'Equipado',
    equip: 'Equipar',
    unlock: 'Desbloquear',
    missing: 'faltam {coins}',

    'theme.minimal.name': 'Estúdio Minimalista',
    'theme.minimal.tagline': 'Slate escuro, blocos vibrantes e macios.',
    'theme.candy.name': 'Doces & Gelatina',
    'theme.candy.tagline': 'Tons pastel e blocos de gelatina brilhante.',
    'theme.wood.name': 'Madeira Zen',
    'theme.wood.tagline': 'Tábuas quentes e blocos com veios de madeira.',
    'theme.neon.name': 'Cyber Neon',
    'theme.neon.tagline': 'Grid ciano/magenta e blocos de vidro neon.',
    'theme.pixel.name': 'Arcade Pixel',
    'theme.pixel.tagline': 'Fliperama 8-bit com scanlines de tubo.',
    'theme.ice.name': 'Aurora Glacial',
    'theme.ice.tagline': 'Céu de aurora e blocos de gelo translúcido.',
    'theme.lava.name': 'Magma Vulcânico',
    'theme.lava.tagline': 'Basalto negro e blocos de lava incandescente.',
    'theme.gold.name': 'Cofre Ouro & Mármore',
    'theme.gold.tagline': 'Luxo preto e dourado, partículas de ouro.',
    'theme.cosmic.name': 'Galáxia Cósmica',
    'theme.cosmic.tagline': 'Campo de estrelas e blocos de nebulosa.',
    'theme.emerald.name': 'Esmeralda VIP',
    'theme.emerald.tagline': 'Verde profundo, blocos de cristal lapidado.',

    'sound.classic.name': 'Pop Clássico',
    'sound.classic.tagline': '"Tóc" cheio e macio, com grave por baixo.',
    'sound.wood.name': 'Bloco de Madeira',
    'sound.wood.tagline': '"Toc" seco e ressonante de madeira.',
    'sound.bubble.name': 'Bolha Pop',
    'sound.bubble.tagline': '"Plop" divertido com o tom subindo.',
    'sound.crystal.name': 'Cristal',
    'sound.crystal.tagline': 'Sininho de vidro — cada tamanho de peça é uma nota.',
  },
};

export const LANGS = Object.keys(STRINGS);

/** 'pt' para qualquer variante de português (pt-BR, pt-PT…); 'en' para todo o resto. */
export function langFromLocale(locale) {
  return String(locale || '').toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

let lang = langFromLocale(typeof navigator !== 'undefined' ? navigator.language : 'en');

export const getLang = () => lang;

export function setLang(next) {
  lang = STRINGS[next] ? next : 'en';
  if (typeof document !== 'undefined') document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
}

/** Texto traduzido. Chave ausente no idioma atual cai para o inglês e, por fim, para a própria chave. */
export function t(key, vars) {
  const s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}

/** Locale para formatar números (separador de milhar). */
export const numberLocale = () => (lang === 'pt' ? 'pt-BR' : 'en-US');

/** Chaves que existem num idioma e faltam no outro (usado nos testes). */
export function missingKeys() {
  const [a, b] = LANGS.map((l) => new Set(Object.keys(STRINGS[l])));
  return { [LANGS[0]]: [...b].filter((k) => !a.has(k)), [LANGS[1]]: [...a].filter((k) => !b.has(k)) };
}
