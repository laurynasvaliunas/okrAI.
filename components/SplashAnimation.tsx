import { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  interpolate,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";

const ACCENT = "#D97758";
const ACCENT_SOFT = "rgba(217,119,88,0.15)";
const BG = "#0B0D0D";
const WHITE = "#F2F4F3";
const WHITE_DIM = "rgba(242,244,243,0.45)";

const RING_R = 76;
const STROKE = 3.5;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;
const SVG_SIZE = (RING_R + STROKE + 6) * 2; // +6 for glow
const CENTER = SVG_SIZE / 2;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  onDone: () => void;
}

export default function SplashAnimation({ onDone }: Props) {
  const logoOpacity   = useSharedValue(0);
  const logoScale     = useSharedValue(0.78);
  const tagOpacity    = useSharedValue(0);
  const ringProgress  = useSharedValue(0);   // 0 → 1
  const glowOpacity   = useSharedValue(0);
  const burstScale    = useSharedValue(0);
  const burstOpacity  = useSharedValue(0);
  const exitOpacity   = useSharedValue(1);
  const exitScale     = useSharedValue(1);

  useEffect(() => {
    // Logo in
    logoOpacity.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
    logoScale.value   = withSpring(1, { damping: 13, stiffness: 110 });

    // Tagline in
    tagOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));

    // Ring fills 0 → 100%
    ringProgress.value = withDelay(
      420,
      withTiming(1, { duration: 1050, easing: Easing.inOut(Easing.cubic) })
    );

    // Glow pulses in as ring fills
    glowOpacity.value = withDelay(420, withTiming(0.6, { duration: 600 }));

    // Completion burst
    burstOpacity.value = withDelay(1520, withTiming(1, { duration: 80 }));
    burstScale.value   = withDelay(
      1520,
      withSequence(
        withSpring(1.25, { damping: 5, stiffness: 220 }),
        withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) })
      )
    );
    burstOpacity.value = withDelay(1680, withTiming(0, { duration: 250 }));

    // Exit: fade + scale up → call onDone
    exitOpacity.value = withDelay(
      1900,
      withTiming(0, { duration: 480, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(onDone)();
      })
    );
    exitScale.value = withDelay(
      1900,
      withTiming(1.07, { duration: 480, easing: Easing.in(Easing.cubic) })
    );
  }, []);

  // ── Animated styles ───────────────────────────────────────────

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
  }));

  const burstStyle = useAnimatedStyle(() => ({
    opacity: burstOpacity.value,
    transform: [{ scale: burstScale.value }],
  }));

  const exitStyle = useAnimatedStyle(() => ({
    opacity: exitOpacity.value,
    transform: [{ scale: exitScale.value }],
  }));

  // ── SVG animated props ────────────────────────────────────────

  // Arc: strokeDashoffset from CIRCUMFERENCE → 0 as progress goes 0 → 1
  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(ringProgress.value, [0, 1], [CIRCUMFERENCE, 0]),
  }));

  // Glow circle opacity
  const glowProps = useAnimatedProps(() => ({
    fillOpacity: glowOpacity.value,
  }));

  // Dot that rides the arc tip
  const dotProps = useAnimatedProps(() => {
    const angle = interpolate(
      ringProgress.value,
      [0, 1],
      [-Math.PI / 2, 3 * Math.PI / 2]
    );
    return {
      cx: CENTER + Math.cos(angle) * RING_R,
      cy: CENTER + Math.sin(angle) * RING_R,
    };
  });

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <ExpoLinearGradient
        colors={["#0C0F0E", "#0B0D0D"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ring + logo */}
      <View style={styles.center}>

        {/* SVG ring */}
        <Svg width={SVG_SIZE} height={SVG_SIZE} style={styles.svgAbsolute}>
          <Defs>
            <LinearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={ACCENT} stopOpacity="1" />
              <Stop offset="100%" stopColor="#F0A080" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Soft glow behind ring */}
          <AnimatedCircle
            cx={CENTER}
            cy={CENTER}
            r={RING_R + 8}
            fill={ACCENT}
            animatedProps={glowProps}
          />

          {/* Track (dim) */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RING_R}
            stroke={ACCENT_SOFT}
            strokeWidth={STROKE}
            fill="none"
          />

          {/* Animated fill arc — starts at top (rotation -90) */}
          <AnimatedCircle
            cx={CENTER}
            cy={CENTER}
            r={RING_R}
            stroke="url(#g)"
            strokeWidth={STROKE + 1}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeLinecap="round"
            rotation={-90}
            origin={`${CENTER}, ${CENTER}`}
            animatedProps={arcProps}
          />

          {/* Dot riding arc tip */}
          <AnimatedCircle
            r={4.5}
            fill={ACCENT}
            animatedProps={dotProps}
          />
        </Svg>

        {/* Wordmark */}
        <Animated.View style={[styles.wordmark, logoStyle]}>
          <Animated.Text style={styles.wordOkr}>okr</Animated.Text>
          <Animated.Text style={styles.wordAi}>AI</Animated.Text>
        </Animated.View>

        {/* Completion burst ✦ */}
        <Animated.View style={[styles.burst, burstStyle]} pointerEvents="none">
          <Animated.Text style={styles.burstText}>✦</Animated.Text>
        </Animated.View>
      </View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineWrap, tagStyle]}>
        <Animated.Text style={styles.tagline}>Your goals. Your growth.</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG,
    zIndex: 999,
  },
  center: {
    width: SVG_SIZE,
    height: SVG_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  svgAbsolute: {
    position: "absolute",
  },
  wordmark: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  wordOkr: {
    fontSize: 38,
    fontWeight: "700",
    color: WHITE,
    letterSpacing: -1.5,
    includeFontPadding: false,
  },
  wordAi: {
    fontSize: 38,
    fontWeight: "700",
    color: ACCENT,
    letterSpacing: -1.5,
    includeFontPadding: false,
  },
  burst: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  burstText: {
    fontSize: 52,
    color: ACCENT,
  },
  taglineWrap: {
    marginTop: 36,
  },
  tagline: {
    fontSize: 13,
    color: WHITE_DIM,
    letterSpacing: 0.6,
  },
});
