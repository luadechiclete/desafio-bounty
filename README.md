# Water & Steps Tracker

App de acompanhamento de água e passos com interface animada, overlay de registro de água e barra de navegação inferior com efeito glassmorphism.

![Demonstração do app](animation.gif)

## Sobre o projeto

Aplicativo mobile (Expo / React Native) com foco em:

- **Registro de água** – overlay em formato de pílula que expande a partir do botão do copo; seletor de quantidade (oz) com ticker animado e slider; cartão flutuante com efeito de “ilha” na parte inferior.
- **Dashboard de passos** – cards de resumo (Steps behind, vs yesterday), barras de progresso por dia e card principal com métricas (passos, distância, kcal, andares).
- **Barra de navegação inferior** – pílula flutuante com efeito **vidro fosco** (glassmorphism / frosted glass) usando `expo-blur`, contendo a aba **Steps**.

As animações são feitas com **react-native-reanimated** (abertura/fechamento do overlay, bounce do dashboard, transições do ticker e do conteúdo).

## Tecnologias

- [Expo](https://expo.dev) (~54) + [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- React Native + TypeScript
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) – animações
- [expo-blur](https://docs.expo.dev/versions/latest/sdk/blur-view/) – BlurView para o menu inferior
- [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context) – safe area
- [@react-native-community/slider](https://github.com/callstack/react-native-slider) – slider no overlay de água

## Como rodar

1. Instalar dependências:

   ```bash
   npm install
   ```

2. Iniciar o projeto:

   ```bash
   npx expo start
   ```

3. Abrir no simulador/emulador ou no Expo Go (QR code no terminal).

## Estrutura principal

| Caminho | Descrição |
|--------|-----------|
| `app/(tabs)/index.tsx` | Tela principal: título "Water", botão do copo, stats, barras de dias, card de passos e blur/bounce ao abrir o overlay |
| `app/(tabs)/_layout.tsx` | Layout de abas usando a barra customizada |
| `app/_layout.tsx` | Stack raiz + `WaterOverlayProvider` |
| `components/WaterOverlay.tsx` | Contexto do overlay, animação de expansão (círculo → tela cheia), Ticker animado (número + oz), slider 8–18 oz, cartão flutuante com valor + "Add" |
| `components/CustomTabBar.tsx` | Barra inferior em pílula com BlurView (glassmorphism), aba Steps ativa com ícone + texto |

## Funcionalidades de UI/UX

- **Overlay de água**: abre a partir do botão do copo; conteúdo (header, ícone central, cartão) aparece/desaparece em sincronia com a animação para não “espremer” no botão ao fechar.
- **Ticker**: valor inteiro ou uma decimal (ex.: 12 ou 12.5); parte decimal some/aparece com animação de opacidade e largura; "oz" acompanha a largura do número (layout animado).
- **Menu inferior**: pílula com `BlurView` (tint dark, intensity ~65), `borderRadius: 999` e `overflow: 'hidden'` para o efeito frosted glass no formato da pílula; posicionamento com safe area.

## Scripts

| Comando | Descrição |
|--------|-----------|
| `npm start` | Inicia o Expo |
| `npm run ios` | Abre no simulador iOS |
| `npm run android` | Abre no emulador Android |
| `npm run lint` | Roda o lint |

## Licença

Projeto de uso privado.
