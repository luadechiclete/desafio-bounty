import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Slider from "@react-native-community/slider";
import * as React from "react";
import { useCallback, useEffect } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const BLUE_OVERLAY = "#1a365d";
const WHITE = "#FFFFFF";
const BLUE_SOFT = "#63B3ED";
const CARD_BG = "#16213e";
const CARD_SHADOW = "rgba(0,0,0,0.35)";
const MIN_AMOUNT = 8;
const MAX_AMOUNT = 18;
const DIGIT_ROW_HEIGHT = 180;
const DIGIT_FONT_SIZE = 80;
const DIGIT_LINE_HEIGHT = 100;
const TICKER_CELL_WIDTH = 56;
const DECIMAL_PART_WIDTH = TICKER_CELL_WIDTH * 2;
const DIGIT_ROW_HEIGHT_COMPACT = 72;
const DIGIT_FONT_SIZE_COMPACT = 32;
const DIGIT_LINE_HEIGHT_COMPACT = 40;
const TICKER_CELL_WIDTH_COMPACT = 24;
const DECIMAL_PART_WIDTH_COMPACT = TICKER_CELL_WIDTH_COMPACT * 2;
const timingConfig = { duration: 320, easing: Easing.out(Easing.cubic) };
const tickerReplaceDuration = 200;
const tickerReplaceScaleConfig = { damping: 22, stiffness: 280 };
const decimalPartDuration = 220;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BUTTON_SIZE = 52;
const BUTTON_CENTER_X = SCREEN_WIDTH - 24 - BUTTON_SIZE / 2;
const BUTTON_CENTER_Y = 60 + BUTTON_SIZE / 2;
const OVERLAY_BORDER_RADIUS_OPEN = 24;

const DASHBOARD_BOUNCE_DURATION_MS = 280;

// ============ Context ============
type WaterOverlayContextValue = {
  visible: boolean;
  overlayOpening: boolean;
  openOverlay: () => void;
  closeOverlay: () => void;
  amount: number;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
};

const WaterOverlayContext =
  React.createContext<WaterOverlayContextValue | null>(null);

export function useWaterOverlay() {
  const ctx = React.useContext(WaterOverlayContext);
  if (!ctx)
    throw new Error("useWaterOverlay must be used within WaterOverlayProvider");
  return ctx;
}

// ============ Ticker (inteiro ou uma decimal; largura do decimal animada para oz acompanhar) ============
function Ticker({
  value,
  compact = false,
}: {
  value: number;
  compact?: boolean;
}) {
  const clamped = Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, value));
  const hasDecimal = clamped % 1 !== 0;
  const integerPart = hasDecimal ? Math.floor(clamped) : Math.round(clamped);
  const integerStr = String(integerPart);
  const decimalDigit = hasDecimal ? Math.round((clamped - integerPart) * 10) : 0;

  const decimalPartWidth = compact ? DECIMAL_PART_WIDTH_COMPACT : DECIMAL_PART_WIDTH;
  const decimalWidth = useSharedValue(hasDecimal ? decimalPartWidth : 0);
  const decimalOpacity = useSharedValue(hasDecimal ? 1 : 0);
  const decimalScale = useSharedValue(hasDecimal ? 1 : 0.85);
  const prevHasDecimal = React.useRef(hasDecimal);

  useEffect(() => {
    if (prevHasDecimal.current === hasDecimal) return;
    prevHasDecimal.current = hasDecimal;
    if (hasDecimal) {
      decimalWidth.value = withTiming(decimalPartWidth, {
        duration: decimalPartDuration,
      });
      decimalOpacity.value = 0;
      decimalScale.value = 0.85;
      decimalOpacity.value = withTiming(1, { duration: decimalPartDuration });
      decimalScale.value = withSpring(1, tickerReplaceScaleConfig);
    } else {
      decimalWidth.value = withTiming(0, { duration: decimalPartDuration });
      decimalOpacity.value = withTiming(0, { duration: decimalPartDuration });
      decimalScale.value = withTiming(0.85, { duration: decimalPartDuration });
    }
  }, [hasDecimal, decimalPartWidth, decimalWidth, decimalOpacity, decimalScale]);

  const decimalWrapStyle = useAnimatedStyle(() => ({
    width: decimalWidth.value,
    overflow: "hidden" as const,
  }));

  const decimalPartStyle = useAnimatedStyle(() => ({
    opacity: decimalOpacity.value,
    transform: [{ scale: decimalScale.value }],
  }));

  const rowStyle = compact ? overlayStyles.tickerRowCompact : overlayStyles.tickerRow;
  const decimalWrapBase = compact
    ? overlayStyles.tickerDecimalWrapCompact
    : overlayStyles.tickerDecimalWrap;
  const cellStyle = compact ? overlayStyles.tickerCellCompact : overlayStyles.tickerCell;
  const digitStyle = compact ? overlayStyles.tickerDigitCompact : overlayStyles.tickerDigit;

  return (
    <View style={rowStyle}>
      {integerStr.split("").map((char, index) => (
        <TickerColumn key={`int-${index}`} digit={parseInt(char, 10)} compact={compact} />
      ))}
      <Animated.View style={[decimalWrapBase, decimalWrapStyle]}>
        <Animated.View style={[overlayStyles.tickerDecimalInner, decimalPartStyle]}>
          <View style={cellStyle}>
            <Text style={digitStyle}>.</Text>
          </View>
          <TickerColumn key="decimal" digit={decimalDigit} compact={compact} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function TickerColumn({
  digit,
  compact = false,
}: {
  digit: number;
  compact?: boolean;
}) {
  const prevDigitRef = React.useRef(digit);
  const [outgoingDigit, setOutgoingDigit] = React.useState<number | null>(null);
  const incomingScale = useSharedValue(1);
  const incomingOpacity = useSharedValue(1);
  const outgoingScale = useSharedValue(1);
  const outgoingOpacity = useSharedValue(0);
  const isFirst = React.useRef(true);

  const cellStyle = compact ? overlayStyles.tickerCellCompact : overlayStyles.tickerCell;
  const clipStyle = compact ? overlayStyles.tickerColumnClipCompact : overlayStyles.tickerColumnClip;
  const rowStyle = compact ? overlayStyles.tickerDigitRowCompact : overlayStyles.tickerDigitRow;
  const digitStyle = compact ? overlayStyles.tickerDigitCompact : overlayStyles.tickerDigit;

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      prevDigitRef.current = digit;
      return;
    }
    if (digit === prevDigitRef.current) return;
    setOutgoingDigit(prevDigitRef.current);
    prevDigitRef.current = digit;

    outgoingOpacity.value = 1;
    outgoingScale.value = 1;
    incomingOpacity.value = 0;
    incomingScale.value = 0.75;

    outgoingOpacity.value = withTiming(0, { duration: tickerReplaceDuration });
    outgoingScale.value = withTiming(0.85, { duration: tickerReplaceDuration });
    incomingOpacity.value = withTiming(1, { duration: tickerReplaceDuration });
    incomingScale.value = withSpring(1, tickerReplaceScaleConfig);
  }, [digit, incomingScale, incomingOpacity, outgoingScale, outgoingOpacity]);

  useEffect(() => {
    if (outgoingDigit !== null) {
      const t = setTimeout(() => setOutgoingDigit(null), tickerReplaceDuration + 50);
      return () => clearTimeout(t);
    }
  }, [outgoingDigit]);

  const incomingStyle = useAnimatedStyle(() => ({
    opacity: incomingOpacity.value,
    transform: [{ scale: incomingScale.value }],
  }));

  const outgoingStyle = useAnimatedStyle(() => ({
    opacity: outgoingOpacity.value,
    transform: [{ scale: outgoingScale.value }],
  }));

  return (
    <View style={cellStyle} collapsable={false}>
      <View style={clipStyle} collapsable={false}>
        {outgoingDigit !== null && (
          <Animated.View
            style={[
              overlayStyles.tickerColumnInnerSingle,
              overlayStyles.tickerDigitAbsolute,
              outgoingStyle,
            ]}
          >
            <View style={rowStyle}>
              <Text style={digitStyle}>{outgoingDigit}</Text>
            </View>
          </Animated.View>
        )}
        <Animated.View
          style={[overlayStyles.tickerColumnInnerSingle, incomingStyle]}
        >
          <View style={rowStyle}>
            <Text style={digitStyle}>{digit}</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

// ============ Overlay ============
function WaterOverlayInner() {
  const insets = useSafeAreaInsets();
  const { visible, closeOverlay, amount, setAmount } = useWaterOverlay();
  const progress = useSharedValue(0);
  const isClosing = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      isClosing.value = 0;
      progress.value = withTiming(1, timingConfig);
    } else {
      progress.value = withTiming(0, timingConfig);
    }
  }, [visible, progress, isClosing]);

  const handleClose = useCallback(() => {
    isClosing.value = 1;
    closeOverlay();
  }, [closeOverlay, isClosing]);

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    "worklet";
    const p = progress.value;
    const w = BUTTON_SIZE + (SCREEN_WIDTH - BUTTON_SIZE) * p;
    const h = BUTTON_SIZE + (SCREEN_HEIGHT - BUTTON_SIZE) * p;
    const startLeft = BUTTON_CENTER_X - BUTTON_SIZE / 2;
    const startTop = BUTTON_CENTER_Y - BUTTON_SIZE / 2;
    const left = startLeft + (0 - startLeft) * p;
    const top = startTop + (0 - startTop) * p;
    const borderRadius =
      BUTTON_SIZE / 2 + (OVERLAY_BORDER_RADIUS_OPEN - BUTTON_SIZE / 2) * p;
    return {
      position: "absolute",
      left,
      top,
      width: w,
      height: h,
      borderRadius,
      backgroundColor: BLUE_OVERLAY,
      overflow: "hidden",
      zIndex: 99999,
      elevation: 99999,
    };
  });

  const handleSliderChange = useCallback(
    (value: number) => {
      const rounded = Math.round(value * 10) / 10;
      setAmount(Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, rounded)));
    },
    [setAmount],
  );

  const cupIconAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.2], [1, 0], "clamp");
    return { opacity };
  });

  const contentOpacityStyle = useAnimatedStyle(() => {
    "worklet";
    const p = progress.value;
    const closing = isClosing.value;
    const opacity =
      closing > 0.5
        ? interpolate(p, [0.6, 1], [0, 1], "clamp")
        : interpolate(p, [0, 0.35], [0, 1], "clamp");
    return { opacity };
  });

  return (
    <Animated.View
      style={overlayAnimatedStyle}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View style={overlayStyles.overlayCupIconWrap} pointerEvents="none">
        <Animated.View style={cupIconAnimatedStyle}>
          <MaterialIcons
            name="local-drink"
            size={28}
            color={WHITE}
          />
        </Animated.View>
      </View>
      <Animated.View
        style={[overlayStyles.overlayContentWrap, contentOpacityStyle]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <View style={overlayStyles.overlayHeader}>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              overlayStyles.closeButton,
              pressed && overlayStyles.closeButtonPressed,
            ]}
            hitSlop={12}
          >
            <MaterialIcons name="close" size={28} color={WHITE} />
          </Pressable>
        </View>
        <View style={overlayStyles.overlayCenter}>
          <MaterialIcons
            name="local-drink"
            size={120}
            color="rgba(255,255,255,0.25)"
          />
        </View>
        <View
          style={[
            overlayStyles.floatingCard,
            { bottom: (insets.bottom || 0) + 40 },
          ]}
        >
        <View style={overlayStyles.cardTopRow}>
          <View style={overlayStyles.quantityRow}>
            <Ticker value={amount} compact />
            <Text style={overlayStyles.unitLabelCompact}>oz</Text>
          </View>
          <MaterialIcons name="water-drop" size={28} color={BLUE_SOFT} />
        </View>
        <Slider
          style={overlayStyles.slider}
          minimumValue={MIN_AMOUNT}
          maximumValue={MAX_AMOUNT}
          value={amount}
          onValueChange={handleSliderChange}
          minimumTrackTintColor={BLUE_SOFT}
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor={WHITE}
          step={0.5}
        />
        <Text style={overlayStyles.cardInstruction}>
          Drank some water? Tap to add it.
        </Text>
        <Pressable
          style={({ pressed }) => [
            overlayStyles.addButton,
            pressed && overlayStyles.addButtonPressed,
          ]}
          onPress={() => {}}
        >
          <Text style={overlayStyles.addButtonText}>Add</Text>
        </Pressable>
      </View>
      </Animated.View>
    </Animated.View>
  );
}

const overlayStyles = StyleSheet.create({
  overlayCupIconWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayContentWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayHeader: {
    paddingTop: 56,
    paddingHorizontal: 20,
    alignItems: "flex-end",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonPressed: { opacity: 0.8 },
  overlayCenter: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  floatingCard: {
    position: "absolute",
    left: "5%",
    right: "5%",
    width: "90%",
    alignSelf: "center",
    borderRadius: 32,
    backgroundColor: CARD_BG,
    padding: 24,
    ...(Platform.OS === "ios"
      ? {
          shadowColor: CARD_SHADOW,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
        }
      : { elevation: 12 }),
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "flex-start",
    flex: 1,
  },
  slider: {
    width: "100%",
    height: 40,
    marginBottom: 20,
  },
  cardInstruction: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 16,
  },
  addButton: {
    width: "100%",
    backgroundColor: WHITE,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonPressed: { opacity: 0.85 },
  addButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: BLUE_OVERLAY,
  },
  tickerRow: {
    height: DIGIT_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  tickerRowCompact: {
    height: DIGIT_ROW_HEIGHT_COMPACT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  tickerDecimalWrap: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  tickerDecimalWrapCompact: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  tickerDecimalInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  tickerCell: {
    height: DIGIT_ROW_HEIGHT,
    width: TICKER_CELL_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  tickerCellCompact: {
    height: DIGIT_ROW_HEIGHT_COMPACT,
    width: TICKER_CELL_WIDTH_COMPACT,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  tickerColumnClip: {
    width: TICKER_CELL_WIDTH,
    height: DIGIT_ROW_HEIGHT,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  tickerColumnClipCompact: {
    width: TICKER_CELL_WIDTH_COMPACT,
    height: DIGIT_ROW_HEIGHT_COMPACT,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  tickerColumnInner: {
    alignItems: "center",
  },
  tickerColumnInnerSingle: {
    alignItems: "center",
    justifyContent: "center",
  },
  tickerDigitAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tickerDigitRow: {
    height: DIGIT_ROW_HEIGHT,
    width: TICKER_CELL_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  tickerDigitRowCompact: {
    height: DIGIT_ROW_HEIGHT_COMPACT,
    width: TICKER_CELL_WIDTH_COMPACT,
    justifyContent: "center",
    alignItems: "center",
  },
  tickerDigit: {
    fontSize: DIGIT_FONT_SIZE,
    lineHeight: DIGIT_LINE_HEIGHT,
    fontWeight: "bold",
    color: WHITE,
    textAlignVertical: "center",
    paddingVertical: 0,
    includeFontPadding: false,
  },
  tickerDigitCompact: {
    fontSize: DIGIT_FONT_SIZE_COMPACT,
    lineHeight: DIGIT_LINE_HEIGHT_COMPACT,
    fontWeight: "bold",
    color: WHITE,
    textAlignVertical: "center",
    paddingVertical: 0,
    includeFontPadding: false,
  },
  unitLabel: {
    marginLeft: 8,
    fontSize: 24,
    fontWeight: "600",
    color: BLUE_SOFT,
  },
  unitLabelCompact: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: "600",
    color: BLUE_SOFT,
  },
});

// ============ Provider (renderiza overlay por cima de tudo, inclusive tab bar) ============
export function WaterOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = React.useState(false);
  const [overlayOpening, setOverlayOpening] = React.useState(false);
  const [amount, setAmountRaw] = React.useState(12);

  useEffect(() => {
    setAmountRaw((prev) => {
      const clamped = Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, prev));
      return clamped !== prev ? clamped : prev;
    });
  }, []);

  const setAmount = useCallback(
    (value: number | ((prev: number) => number)) => {
      setAmountRaw((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        return Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, next));
      });
    },
    [],
  );

  const openTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const openOverlay = useCallback(() => {
    if (visible) return;
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    setOverlayOpening(true);
    openTimeoutRef.current = setTimeout(() => {
      openTimeoutRef.current = null;
      setVisible(true);
      setOverlayOpening(false);
    }, DASHBOARD_BOUNCE_DURATION_MS);
  }, [visible]);

  useEffect(() => {
    if (!visible && overlayOpening) {
      const t = setTimeout(() => setOverlayOpening(false), 100);
      return () => clearTimeout(t);
    }
  }, [visible, overlayOpening]);

  const closeOverlay = useCallback(() => setVisible(false), []);

  const clampedAmount = Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, amount));

  const value: WaterOverlayContextValue = React.useMemo(
    () => ({
      visible,
      overlayOpening,
      openOverlay,
      closeOverlay,
      amount: clampedAmount,
      setAmount,
    }),
    [visible, overlayOpening, openOverlay, closeOverlay, clampedAmount, setAmount],
  );

  return (
    <WaterOverlayContext.Provider value={value}>
      <View style={{ flex: 1 }}>{children}</View>
      <WaterOverlayInner />
    </WaterOverlayContext.Provider>
  );
}
