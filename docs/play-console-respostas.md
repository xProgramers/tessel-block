# Respostas para o Play Console

Respostas prontas para os formulários de **Painel → Configurar seu app** do Tessel Block. Baseadas no que o app faz hoje: anúncios do Google AdMob (vídeo premiado opcional + intersticial entre partidas), sem compras, sem login, progresso salvo só no aparelho. Se algo disso mudar (ex.: entrar analytics ou compra), estas respostas precisam mudar também.

## Política de privacidade

- **URL:** `https://xprogramers.github.io/tessel-block/politica-de-privacidade.html` (depois de ligar o GitHub Pages — veja o guia, passo 5)
- Alternativa que já funciona: `https://github.com/xProgramers/tessel-block/blob/main/docs/politica-de-privacidade.md`

## Acesso ao app

- **Todas as funcionalidades estão disponíveis sem acesso especial** (não há login nem conteúdo bloqueado por senha).

## Anúncios

- **Sim, meu app contém anúncios.** (Google AdMob)

## Classificação do conteúdo (questionário IARC)

- **E-mail de contato:** mpotal@hotmail.com
- **Categoria:** Jogo — *Todos os outros tipos de jogo* (quebra-cabeça / casual)
- Violência: **Não** (em todas as perguntas)
- Medo / terror: **Não**
- Sexualidade / nudez: **Não**
- Linguagem imprópria: **Não**
- Drogas, álcool, tabaco: **Não**
- Humor grosseiro: **Não**
- Jogos de azar simulados (cassino, apostas): **Não**
- O app oferece itens aleatórios pagos (loot boxes)? **Não** — os temas e sons são comprados com moedas virtuais ganhas jogando, sem sorteio e sem dinheiro real
- Usuários interagem ou trocam conteúdo entre si (chat, perfis, compartilhamento)? **Não**
- Compartilha a localização do usuário com outros usuários? **Não**
- Permite comprar produtos digitais? **Não**
- É um navegador ou mecanismo de pesquisa? **Não**

Resultado esperado: **Livre (L)** no Brasil, **PEGI 3**, **ESRB Everyone**.

## Público-alvo e conteúdo

- **Faixas etárias recomendadas:** 13–15, 16–17 e 18+
  - **Não inclua menores de 13.** Com anúncios, isso exigiria a política Famílias (SDK de anúncios certificado, anúncios marcados como para crianças e outra revisão).
- **O app pode atrair crianças sem querer?** Responda com sinceridade. Se marcar "Sim", o Google pode pedir a política Famílias, que hoje o app **não** atende por causa dos anúncios.
- **Loja: o app aparece em "Professor aprovado"/Famílias?** Não é necessário.

## Segurança dos dados (Data safety)

Quem coleta é o SDK de anúncios do Google (AdMob), não o jogo. Respostas baseadas na orientação do próprio Google para o SDK do Google Mobile Ads; confira em <https://developers.google.com/admob/android/privacy/play-data-disclosure> antes de enviar.

1. **Seu app coleta ou compartilha algum dos tipos de dados do usuário exigidos?** → **Sim**
2. **Todos os dados coletados são criptografados em trânsito?** → **Sim**
3. **Você oferece uma forma de os usuários pedirem a exclusão dos dados?** → **Não** (o jogo não guarda nada em servidor; o jogador redefine/exclui o ID de publicidade nas configurações do Android)
4. Tipos de dados (marque **Coletado** e **Compartilhado**; coleta **obrigatória**, não opcional):

| Tipo de dado | Finalidades |
|---|---|
| **Local → Local aproximado** (pelo IP) | Publicidade ou marketing, Análise, Prevenção de fraudes, segurança e conformidade |
| **Atividade no app → Interações com o app** | Publicidade ou marketing, Análise, Prevenção de fraudes, segurança e conformidade |
| **Informações e desempenho do app → Registros de falhas e Diagnóstico** | Análise, Prevenção de fraudes, segurança e conformidade |
| **IDs do dispositivo ou outros IDs** | Publicidade ou marketing, Análise, Prevenção de fraudes, segurança e conformidade |

5. O progresso do jogo (moedas, temas, recorde) fica só no aparelho e **não** entra no formulário.

## ID de publicidade

- **Seu app usa o ID de publicidade?** → **Sim**
- Finalidades: **Publicidade ou marketing**, **Análise**, **Prevenção de fraudes, segurança e conformidade**
- A permissão `AD_ID` já vem do SDK do AdMob.

## Apps governamentais / recursos financeiros / saúde / notícias

- App governamental: **Não**
- Recursos financeiros: **Meu app não oferece recursos financeiros**
- Apps de saúde: **Meu app não tem recursos de saúde**
- App de notícias: **Não**

## Categoria e contato (Configurações da loja)

- **Tipo:** Jogo
- **Categoria:** Quebra-cabeça
- **Tags:** Quebra-cabeça de blocos, Casual, Offline, Single player (escolha as que aparecerem)
- **E-mail de contato:** mpotal@hotmail.com
- **Site (opcional):** `https://xprogramers.github.io/tessel-block/`

## Preço e países

- **Gratuito** (não dá para mudar de gratuito para pago depois)
- Países: todos, ou só Brasil no começo.

## Pedido de acesso à produção (depois do teste fechado)

O Google pergunta como foi o teste. Respostas-modelo:

- **Como recrutou os testadores?** Amigos e familiares convidados por e-mail para o teste fechado.
- **Como coletou feedback?** Conversa direta com os testadores e o canal de feedback do teste fechado na Play Store.
- **O que mudou com o feedback?** Descreva o que de fato mudou (ex.: ajustes de dificuldade, correções, desempenho).
- **Público do app:** jogadores casuais de quebra-cabeça, todas as idades a partir de 13 anos.
- **Valor para o usuário:** jogo de blocos relaxante, que funciona offline, com poucos anúncios (vídeo opcional para dobrar moedas), 100 níveis de aventura e temas desbloqueáveis.
- **Quantas instalações espera no primeiro ano?** Escolha a faixa mais realista (ex.: 0–10 mil).
