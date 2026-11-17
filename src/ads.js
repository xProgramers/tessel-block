// Anúncios do Google (AdMob) — só no app Android. No navegador tudo aqui vira no-op.
//
// • Premiado: o jogador escolhe ver um vídeo para dobrar as moedas da partida.
// • Intersticial: tela cheia entre partidas, no ritmo de game/adPacing.js.
//
// Antes do primeiro anúncio pede o consentimento exigido na Europa/Reino Unido (formulário
// do Google, configurado em AdMob → Privacidade e mensagens). Fora dessas regiões não aparece nada.
//
// Anúncios de teste: gere o app com VITE_ADS_TEST=1 (npm run android:sync:test-ads). Nunca toque
// em anúncios reais no seu próprio aparelho: o AdMob trata como tráfego inválido e pode suspender a conta.
import {
  AdMob, AdmobConsentStatus, InterstitialAdPluginEvents, RewardAdPluginEvents,
} from '@capacitor-community/admob';
import { isNative } from './native';
import { newPacing, noteEnded, noteShown, shouldShowInterstitial } from './game/adPacing';

export const AD_UNITS = {
  rewarded: 'ca-app-pub-3887694594348421/8755921909', // "Dobrar moedas (premiado)"
  interstitial: 'ca-app-pub-3887694594348421/4816676898', // "Fim de partida (intersticial)"
};

const TESTING = import.meta.env.VITE_ADS_TEST === '1';

let started = null;
let canShow = false;
let rewardReady = false;
let interReady = false;
let pacing = newPacing(Date.now());
const listeners = new Set();

const setRewardReady = (v) => {
  rewardReady = v;
  listeners.forEach((fn) => fn(v));
};

function loadRewarded() {
  if (!canShow || rewardReady) return;
  AdMob.prepareRewardVideoAd({ adId: AD_UNITS.rewarded, isTesting: TESTING })
    .then(() => setRewardReady(true))
    .catch(() => setRewardReady(false));
}

function loadInterstitial() {
  if (!canShow || interReady) return;
  AdMob.prepareInterstitial({ adId: AD_UNITS.interstitial, isTesting: TESTING })
    .then(() => { interReady = true; })
    .catch(() => { interReady = false; });
}

/** Consentimento + SDK. Chamado uma vez ao abrir o app; falhas só deixam o jogo sem anúncios. */
export function initAds() {
  if (!isNative) return Promise.resolve(false);
  if (started) return started;
  started = (async () => {
    try {
      let info = await AdMob.requestConsentInfo();
      if (info.status === AdmobConsentStatus.REQUIRED && info.isConsentFormAvailable) {
        info = await AdMob.showConsentForm();
      }
      if (!info.canRequestAds) return false;
      await AdMob.initialize({ initializeForTesting: TESTING });
      canShow = true;
      loadRewarded();
      loadInterstitial();
      return true;
    } catch {
      return false;
    }
  })();
  return started;
}

/** Avisa quando o vídeo premiado fica pronto (ou deixa de estar). Devolve a função para cancelar. */
export function onRewardReady(fn) {
  listeners.add(fn);
  fn(rewardReady);
  return () => listeners.delete(fn);
}

/** Mostra o vídeo premiado. Resolve true só se o jogador assistiu até ganhar o prêmio. */
export async function showRewarded() {
  if (!canShow || !rewardReady) return false;
  setRewardReady(false);
  let earned = false;
  const handle = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { earned = true; });
  try {
    const item = await AdMob.showRewardVideoAd();
    earned = earned || Boolean(item && item.amount > 0);
  } catch {
    /* fechou antes do fim ou falhou: sem prêmio */
  } finally {
    handle.remove();
    loadRewarded();
  }
  return earned;
}

/** Uma partida ou nível terminou (conta para o ritmo dos intersticiais). */
export function noteGameEnded() {
  pacing = noteEnded(pacing);
}

/** Na hora de começar outra partida: mostra o intersticial se for a vez dele. */
export function maybeShowInterstitial() {
  const now = Date.now();
  if (!canShow || !interReady || !shouldShowInterstitial(pacing, now)) return;
  interReady = false;
  pacing = noteShown(now);
  AdMob.showInterstitial()
    .catch(() => {})
    .finally(loadInterstitial);
}

/** Som do jogo desligado → vídeos começam sem som. */
export function setAdsMuted(muted) {
  if (!canShow) return;
  AdMob.setApplicationMuted({ muted }).catch(() => {});
}

/** Reabre o formulário de privacidade (para o jogador mudar a escolha). */
export function showAdPrivacyOptions() {
  if (!isNative) return Promise.resolve();
  return AdMob.showPrivacyOptionsForm().catch(() => {});
}

// Intersticial que falhou ao carregar: marca como indisponível (recarrega na próxima vez).
if (isNative) {
  AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => { interReady = false; }).catch(() => {});
}
