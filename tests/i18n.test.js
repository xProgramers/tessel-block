import { describe, expect, it } from 'vitest';
import { getLang, langFromLocale, missingKeys, setLang, t } from '../src/i18n';
import { coins, fmt } from '../src/game/format';
import { praiseFor } from '../src/game/praise';
import { THEMES } from '../src/game/themes';
import { SOUND_PACKS } from '../src/game/sounds';

describe('i18n', () => {
  it('português para pt-*, inglês para todo o resto', () => {
    expect(langFromLocale('pt-BR')).toBe('pt');
    expect(langFromLocale('pt-PT')).toBe('pt');
    expect(langFromLocale('en-US')).toBe('en');
    expect(langFromLocale('es-ES')).toBe('en');
    expect(langFromLocale(undefined)).toBe('en');
  });

  it('todas as chaves existem nos dois idiomas', () => {
    expect(missingKeys()).toEqual({ en: [], pt: [] });
  });

  it('todo tema e som da loja tem nome e descrição traduzidos', () => {
    for (const lang of ['en', 'pt']) {
      setLang(lang);
      for (const { id } of THEMES) {
        expect(t(`theme.${id}.name`)).not.toBe(`theme.${id}.name`);
        expect(t(`theme.${id}.tagline`)).not.toBe(`theme.${id}.tagline`);
      }
      for (const { id } of SOUND_PACKS) {
        expect(t(`sound.${id}.name`)).not.toBe(`sound.${id}.name`);
      }
    }
  });

  it('inglês: textos, números e elogios', () => {
    setLang('en');
    expect(getLang()).toBe('en');
    expect(t('level', { n: 7 })).toBe('Level 7');
    expect(fmt(1500)).toBe('1,500');
    expect(coins(1)).toBe('1 coin');
    expect(coins(2500)).toBe('2,500 coins');
    expect(praiseFor(1, 1, true).text).toBe('Perfect!');
  });

  it('português: números com ponto e moedas no plural', () => {
    setLang('pt');
    expect(fmt(1500)).toBe('1.500');
    expect(coins(2500)).toBe('2.500 moedas');
  });

  it('idioma desconhecido vira inglês', () => {
    setLang('xx');
    expect(getLang()).toBe('en');
  });
});
