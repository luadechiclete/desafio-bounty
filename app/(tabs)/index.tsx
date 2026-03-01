import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useWaterOverlay } from '@/components/WaterOverlay';

const BLUE_DASHBOARD = '#4A90D9';
const BLUE_SOFT = '#63B3ED';
const WHITE = '#FFFFFF';
const DASHBOARD_BOUNCE_SCALE = 0.94;
const dashboardSpringConfig = { damping: 14, stiffness: 160 };
const BLUR_DURATION_MS = 140;
const BOUNCE_DELAY_MS = 140;
const CLOSE_SCALE_DURATION_MS = 220;

export default function WaterTrackingScreen() {
  const { openOverlay, visible, overlayOpening } = useWaterOverlay();
  const scale = useSharedValue(1);
  const blurOpacity = useSharedValue(0);
  const cupButtonOpacity = useSharedValue(1);

  useEffect(() => {
    if (overlayOpening) {
      blurOpacity.value = withTiming(1, { duration: BLUR_DURATION_MS });
      cupButtonOpacity.value = withTiming(0, { duration: 100 });
      scale.value = withDelay(
        BOUNCE_DELAY_MS,
        withSpring(DASHBOARD_BOUNCE_SCALE, dashboardSpringConfig),
      );
    }
  }, [overlayOpening, scale, blurOpacity, cupButtonOpacity]);

  useEffect(() => {
    if (!visible) {
      scale.value = withTiming(1, {
        duration: CLOSE_SCALE_DURATION_MS,
      });
      blurOpacity.value = withTiming(0, { duration: 220 });
      cupButtonOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [visible, scale, blurOpacity, cupButtonOpacity]);

  const dashboardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const blurAnimatedStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  const cupButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cupButtonOpacity.value,
  }));

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.dashboard, dashboardAnimatedStyle]}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Water</Text>
          <Animated.View style={cupButtonAnimatedStyle}>
            <Pressable
              onPress={openOverlay}
              style={({ pressed }) => [styles.cupButton, pressed && styles.cupButtonPressed]}
              hitSlop={8}>
              <MaterialIcons name="local-drink" size={28} color={BLUE_DASHBOARD} />
            </Pressable>
          </Animated.View>
        </View>
        <Text style={styles.dashboardSubtitle}>Tap the cup to log</Text>

        {/* Mock stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>Steps behind</Text>
            <Text style={styles.statChipValue}>876</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>vs yesterday</Text>
            <Text style={styles.statChipValue}>76%</Text>
          </View>
        </View>

        {/* Mock chart area */}
        <View style={styles.chartCard}>
          <View style={styles.chartBars}>
            {[0.4, 0.65, 0.5, 0.8, 0.6].map((h, i) => (
              <View key={i} style={[styles.chartBar, { height: 56 * h }]} />
            ))}
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>Thu</Text>
            <Text style={styles.chartLabel}>Fri</Text>
            <Text style={styles.chartLabel}>Mon</Text>
            <Text style={styles.chartLabel}>Tue</Text>
            <Text style={styles.chartLabel}>Wed</Text>
          </View>
        </View>

        {/* Mock main card (steps) */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>GD</Text>
            </View>
            <View style={styles.periodTabs}>
              <Text style={[styles.periodTab, styles.periodTabActive]}>D</Text>
              <Text style={styles.periodTab}>W</Text>
              <Text style={styles.periodTab}>M</Text>
            </View>
          </View>
          <Text style={styles.mainCardNumber}>275</Text>
          <Text style={styles.mainCardUnit}>Steps</Text>
          <View style={styles.mainCardMeta}>
            <Text style={styles.mainCardMetaItem}>0.11mi Distance</Text>
            <Text style={styles.mainCardMetaItem}>8 kcal</Text>
            <Text style={styles.mainCardMetaItem}>1 Floors</Text>
          </View>
          <View style={styles.mainCardActions}>
            <View style={styles.actionPill}>
              <MaterialIcons name="directions-walk" size={20} color={BLUE_DASHBOARD} />
            </View>
            <View style={styles.actionPill}>
              <MaterialIcons name="bar-chart" size={20} color={BLUE_DASHBOARD} />
            </View>
            <View style={styles.actionPill}>
              <MaterialIcons name="bolt" size={20} color={BLUE_DASHBOARD} />
            </View>
          </View>
        </View>
      </Animated.View>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.blurWrap, blurAnimatedStyle]}
        pointerEvents="none"
      >
        {Platform.OS === 'web' ? (
          <View style={[StyleSheet.absoluteFill, styles.blurFallback]} />
        ) : (
          <BlurView
            intensity={60}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BLUE_DASHBOARD,
  },
  blurWrap: {
    zIndex: 100,
  },
  blurFallback: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dashboard: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: WHITE,
  },
  cupButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  cupButtonPressed: {
    opacity: 0.9,
  },
  dashboardSubtitle: {
    marginTop: 8,
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  statChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  statChipLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  statChipValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
    marginTop: 2,
  },
  chartCard: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    height: 120,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    flex: 1,
    paddingBottom: 4,
  },
  chartBar: {
    width: 24,
    backgroundColor: BLUE_SOFT,
    borderRadius: 6,
    minHeight: 8,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  chartLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    width: 28,
    textAlign: 'center',
  },
  mainCard: {
    marginTop: 20,
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 24,
    paddingBottom: 20,
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BLUE_DASHBOARD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: WHITE,
  },
  periodTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  periodTab: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  periodTabActive: {
    color: BLUE_DASHBOARD,
  },
  mainCardNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 12,
  },
  mainCardUnit: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  mainCardMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  mainCardMetaItem: {
    fontSize: 13,
    color: '#888',
  },
  mainCardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionPill: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74,144,217,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
