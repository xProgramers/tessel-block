// Pacotes de som de encaixe vendidos na loja (cosméticos: não alteram ganhos).
// A síntese de cada um fica em audio/soundEngine.js (PLACE_SOUNDS).
export const SOUND_PACKS = [
  { id: 'classic', name: 'Pop Clássico', tagline: '"Tóc" cheio e macio, com grave por baixo.', price: 0 },
  { id: 'wood', name: 'Bloco de Madeira', tagline: '"Toc" seco e ressonante de madeira.', price: 1200 },
  { id: 'bubble', name: 'Bolha Pop', tagline: '"Plop" divertido com o tom subindo.', price: 2500 },
  { id: 'crystal', name: 'Cristal', tagline: 'Sininho de vidro — cada tamanho de peça é uma nota.', price: 5000 },
];

export const SOUND_IDS = SOUND_PACKS.map((s) => s.id);
