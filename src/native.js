// Integração com o app Android (Capacitor). No navegador tudo aqui vira no-op.
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const isNative = Capacitor.isNativePlatform();

const IMPACT = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };

/** Vibração curta: 'light' (encaixe), 'medium' (linha), 'heavy' (combo / game over). */
export function haptic(kind = 'light') {
  if (!isNative) return;
  Haptics.impact({ style: IMPACT[kind] ?? ImpactStyle.Light }).catch(() => {});
}

/** Ícones da barra de status claros (tema escuro) ou escuros (tema claro). */
export function setSystemBarsForTheme(lightBackground) {
  if (!isNative) return;
  SystemBars.setStyle({ style: lightBackground ? SystemBarsStyle.Light : SystemBarsStyle.Dark }).catch(() => {});
}

/**
 * Botão "voltar" do Android. `onBack` devolve true se tratou o evento
 * (ex.: fechou a loja); se não tratou, o app vai para segundo plano em vez de fechar.
 */
export function onBackButton(onBack) {
  if (!isNative) return () => {};
  const handle = App.addListener('backButton', () => {
    if (!onBack()) App.minimizeApp();
  });
  return () => handle.then((h) => h.remove());
}

/** Chamado quando o app vai para segundo plano. */
export function onAppPause(fn) {
  if (!isNative) return () => {};
  const handle = App.addListener('pause', fn);
  return () => handle.then((h) => h.remove());
}
