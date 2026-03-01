import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PILL_BG = "#1a1a2e";
const PILL_ACTIVE_BG = "#FFFFFF";
const PILL_ACTIVE_ICON = "#1a1a2e";
const PILL_INACTIVE_ICON = "rgba(255,255,255,0.85)";
const TAB_SPRING = { damping: 20, stiffness: 280 };
const TAB_DURATION = 220;

type TabItem = {
  routeName: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const TABS: TabItem[] = [
  { routeName: "index", label: "Steps", icon: "directions-walk" },
];

function TabBarItem({
  item,
  isFocused,
  onPress,
}: {
  item: TabItem;
  isFocused: boolean;
  onPress: () => void;
}) {
  const progress = useSharedValue(isFocused ? 1 : 0);
  const prevFocus = React.useRef(isFocused);

  React.useEffect(() => {
    if (prevFocus.current === isFocused) return;
    prevFocus.current = isFocused;
    progress.value = isFocused
      ? withSpring(1, TAB_SPRING)
      : withTiming(0, { duration: TAB_DURATION });
  }, [isFocused, progress]);

  const pillStyle = useAnimatedStyle(() => {
    "worklet";
    const paddingH = 20;
    const iconSize = 24;
    const gap = 8;
    const minW = iconSize + 16;
    const textW = 56;
    const maxW = minW + gap + textW + paddingH * 2;
    const width = minW + (maxW - minW) * progress.value;
    return {
      width,
      backgroundColor: progress.value > 0.5 ? PILL_ACTIVE_BG : "transparent",
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: paddingH,
      overflow: "hidden" as const,
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  const iconColor = isFocused ? PILL_ACTIVE_ICON : PILL_INACTIVE_ICON;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tabTouchable, pressed && styles.tabPressed]}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View style={pillStyle}>
        <View style={styles.tabContent}>
          <MaterialIcons name={item.icon} size={24} color={iconColor} />
          <Animated.View style={[styles.tabLabelWrap, textStyle]}>
            <Text
              style={[
                styles.tabLabel,
                { color: isFocused ? PILL_ACTIVE_ICON : PILL_INACTIVE_ICON },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 30);

  return (
    <View style={[styles.container, { bottom }]} pointerEvents="box-none">
      <BlurView
        intensity={65}
        tint="dark"
        style={styles.pillBlur}
      >
        <View style={styles.pillContent}>
          {state.routes.map((route, index) => {
            const item = TABS.find((t) => t.routeName === route.name) ?? TABS[index];
            const isFocused = state.index === index;
            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };
            return (
              <TabBarItem
                key={route.key}
                item={item}
                isFocused={isFocused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  pillBlur: {
    width: "85%",
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        }
      : { elevation: 8 }),
  },
  pillContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  tabTouchable: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabPressed: { opacity: 0.85 },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabLabelWrap: {
    justifyContent: "center",
    minWidth: 48,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
});
