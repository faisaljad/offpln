import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Line, Circle, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
import { useAuthStore } from '../store/auth';

const { width } = Dimensions.get('window');

function VillaConstruction() {
  // Architectural blueprint drawing — clean, minimal, professional
  const phase1 = useRef(new Animated.Value(1000)).current; // structure outline
  const phase2 = useRef(new Animated.Value(800)).current;  // roof + columns
  const phase3 = useRef(new Animated.Value(0)).current;    // details (opacity)
  const phase4 = useRef(new Animated.Value(0)).current;    // accent glow
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    Animated.sequence([
      Animated.timing(phase1, { toValue: 0, duration: 1400, easing: ease, useNativeDriver: false }),
      Animated.timing(phase2, { toValue: 0, duration: 1000, easing: ease, useNativeDriver: false }),
      Animated.timing(phase3, { toValue: 1, duration: 600, easing: ease, useNativeDriver: false }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(glow, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    });
  }, []);

  const W = width * 0.9;
  const LINE = 'rgba(203,213,225,0.55)';
  const ACCENT = 'rgba(251,191,36,0.65)';
  const THIN = 'rgba(203,213,225,0.3)';

  return (
    <View style={{ width: W, height: 240, alignItems: 'center', marginBottom: 40 }}>
      <Svg width={W} height={240} viewBox="0 0 360 200">

        {/* ── Phase 1: Structure (walls, base, ground) ── */}
        {/* Ground */}
        <AnimatedPath d="M20 180 L340 180" stroke={THIN} strokeWidth="0.8" fill="none" strokeDasharray="1000" strokeDashoffset={phase1} />

        {/* Foundation base */}
        <AnimatedPath d="M60 180 L60 172 L300 172 L300 180" stroke={LINE} strokeWidth="1.2" fill="none" strokeLinejoin="miter" strokeDasharray="1000" strokeDashoffset={phase1} />

        {/* Main structure — clean orthogonal lines */}
        <AnimatedPath d="M95 172 L95 95 L265 95 L265 172" stroke={LINE} strokeWidth="1.5" fill="none" strokeLinejoin="miter" strokeDasharray="1000" strokeDashoffset={phase1} />

        {/* Left wing */}
        <AnimatedPath d="M60 172 L60 125 L95 125" stroke={LINE} strokeWidth="1.2" fill="none" strokeLinejoin="miter" strokeDasharray="1000" strokeDashoffset={phase1} />

        {/* Right wing */}
        <AnimatedPath d="M265 125 L300 125 L300 172" stroke={LINE} strokeWidth="1.2" fill="none" strokeLinejoin="miter" strokeDasharray="1000" strokeDashoffset={phase1} />

        {/* Interior vertical divisions */}
        <AnimatedPath d="M145 172 L145 95 M215 172 L215 95" stroke={THIN} strokeWidth="0.6" fill="none" strokeDasharray="1000" strokeDashoffset={phase1} />

        {/* Floor line */}
        <AnimatedPath d="M95 140 L265 140" stroke={THIN} strokeWidth="0.5" fill="none" strokeDasharray="1000" strokeDashoffset={phase1} />


        {/* ── Phase 2: Roof, columns, entrance ── */}
        {/* Main roof — clean flat with slight pitch */}
        <AnimatedPath d="M85 95 L180 58 L275 95" stroke={ACCENT} strokeWidth="1.8" fill="none" strokeLinejoin="miter" strokeLinecap="square" strokeDasharray="800" strokeDashoffset={phase2} />

        {/* Roof overhangs */}
        <AnimatedPath d="M85 95 L80 95 M275 95 L280 95" stroke={ACCENT} strokeWidth="1.2" fill="none" strokeDasharray="800" strokeDashoffset={phase2} />

        {/* Left wing roof */}
        <AnimatedPath d="M52 125 L77 110 L102 125" stroke={ACCENT} strokeWidth="1.2" fill="none" strokeLinejoin="miter" strokeDasharray="800" strokeDashoffset={phase2} />

        {/* Right wing roof */}
        <AnimatedPath d="M258 125 L283 110 L308 125" stroke={ACCENT} strokeWidth="1.2" fill="none" strokeLinejoin="miter" strokeDasharray="800" strokeDashoffset={phase2} />

        {/* Entrance columns */}
        <AnimatedPath d="M158 172 L158 105 M202 172 L202 105" stroke={LINE} strokeWidth="1" fill="none" strokeDasharray="800" strokeDashoffset={phase2} />

        {/* Entrance lintel */}
        <AnimatedPath d="M155 105 L205 105" stroke={LINE} strokeWidth="1.2" fill="none" strokeDasharray="800" strokeDashoffset={phase2} />

        {/* Entrance pediment */}
        <AnimatedPath d="M155 105 L180 90 L205 105" stroke={ACCENT} strokeWidth="1" fill="none" strokeLinejoin="miter" strokeDasharray="800" strokeDashoffset={phase2} />


        {/* ── Phase 3: Details (fade in) ── */}
        <Animated.View style={{ opacity: phase3, position: 'absolute' }}>
          <Svg width={W} height={240} viewBox="0 0 360 200">

            {/* Windows — main floor, evenly spaced rectangles */}
            {[108, 128, 225, 245].map(x => (
              <G key={`w1${x}`}>
                <Rect x={x} y="103" width="14" height="20" stroke={LINE} strokeWidth="0.8" fill="none" />
                <Line x1={x + 7} y1={103} x2={x + 7} y2={123} stroke={THIN} strokeWidth="0.5" />
                <Line x1={x} y1={113} x2={x + 14} y2={113} stroke={THIN} strokeWidth="0.5" />
              </G>
            ))}

            {/* Windows — upper floor */}
            {[108, 128, 225, 245].map(x => (
              <G key={`w2${x}`}>
                <Rect x={x} y="148" width="14" height="18" stroke={LINE} strokeWidth="0.8" fill="none" />
                <Line x1={x + 7} y1={148} x2={x + 7} y2={166} stroke={THIN} strokeWidth="0.5" />
              </G>
            ))}

            {/* Wing windows */}
            {[68, 278].map(x => (
              <G key={`ww${x}`}>
                <Rect x={x} y="138" width="12" height="16" stroke={LINE} strokeWidth="0.7" fill="none" />
                <Line x1={x + 6} y1={138} x2={x + 6} y2={154} stroke={THIN} strokeWidth="0.4" />
              </G>
            ))}

            {/* Door */}
            <Rect x="170" y="142" width="20" height="30" rx="10" stroke={ACCENT} strokeWidth="1" fill="none" />
            <Circle cx="186" cy="158" r="1.2" stroke={ACCENT} strokeWidth="0.8" fill="none" />

            {/* Steps */}
            <Line x1="165" y1="172" x2="195" y2="172" stroke={THIN} strokeWidth="0.6" />
            <Line x1="162" y1="175" x2="198" y2="175" stroke={THIN} strokeWidth="0.5" />
            <Line x1="159" y1="178" x2="201" y2="178" stroke={THIN} strokeWidth="0.4" />

            {/* Garage */}
            <Rect x="228" y="148" width="32" height="24" stroke={THIN} strokeWidth="0.7" fill="none" />
            {[0, 1, 2].map(i => (
              <Line key={`g${i}`} x1={231} y1={154 + i * 6} x2={257} y2={154 + i * 6} stroke={THIN} strokeWidth="0.4" />
            ))}

            {/* Dimension lines — architectural detail */}
            <Line x1="60" y1="188" x2="300" y2="188" stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" strokeDasharray="3,3" />
            <Line x1="60" y1="186" x2="60" y2="190" stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" />
            <Line x1="300" y1="186" x2="300" y2="190" stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" />

            {/* Landscaping — minimal geometric */}
            {/* Left tree */}
            <Line x1="38" y1="180" x2="38" y2="155" stroke={THIN} strokeWidth="0.7" />
            <Circle cx="38" cy="150" r="8" stroke="rgba(148,163,184,0.25)" strokeWidth="0.7" fill="none" />
            <Circle cx="38" cy="148" r="5" stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" fill="none" />

            {/* Right tree */}
            <Line x1="322" y1="180" x2="322" y2="155" stroke={THIN} strokeWidth="0.7" />
            <Circle cx="322" cy="150" r="8" stroke="rgba(148,163,184,0.25)" strokeWidth="0.7" fill="none" />
            <Circle cx="322" cy="148" r="5" stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" fill="none" />

            {/* Driveway lines */}
            <Line x1="172" y1="180" x2="168" y2="196" stroke={THIN} strokeWidth="0.4" />
            <Line x1="188" y1="180" x2="192" y2="196" stroke={THIN} strokeWidth="0.4" />
          </Svg>
        </Animated.View>

        {/* ── Subtle glow trace after completion ── */}
        <AnimatedPath
          d="M60 172 L60 125 L95 125 L95 95 L265 95 L265 125 L300 125 L300 172"
          stroke="rgba(251,191,36,0.08)"
          strokeWidth={glow.interpolate({ inputRange: [0, 1], outputRange: [0, 4] })}
          strokeLinejoin="miter"
          fill="none"
        />
      </Svg>
    </View>
  );
}

export default function Index() {
  const { user, isLoading } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);
  const fadeOut = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Progress bar
    Animated.timing(progressWidth, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();

    // Dismiss splash
    const timer = setTimeout(() => {
      Animated.timing(fadeOut, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setShowSplash(false);
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!showSplash) {
    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c4a6e' }}>
          <Text style={{ color: '#fbbf24', fontSize: 24, fontWeight: '800' }}>OffPlan</Text>
        </View>
      );
    }
    if (user) return <Redirect href="/(tabs)" />;
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <LinearGradient
        colors={['#0c4a6e', '#0a3d5c', '#072f49', '#051e30']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      {/* Construction illustration */}
      <VillaConstruction />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <View style={styles.logoIconBox}>
          <Svg width={32} height={32} viewBox="0 0 32 32">
            <Rect x="2" y="12" width="10" height="18" rx="2" fill="#fbbf24" opacity="0.9" />
            <Rect x="14" y="6" width="10" height="24" rx="2" fill="#fbbf24" />
            <Rect x="20" y="2" width="10" height="28" rx="2" fill="#fbbf24" opacity="0.7" />
          </Svg>
        </View>
        <Text style={styles.logoText}>OffPlan</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={{ opacity: taglineOpacity }}>
        <Text style={styles.tagline}>Fractional Property Investment</Text>
        <Text style={styles.subTagline}>Build your portfolio, one share at a time</Text>
      </Animated.View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  decorCircle1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(14,165,233,0.06)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(251,191,36,0.04)',
  },
  decorCircle3: {
    position: 'absolute',
    top: '30%',
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  logoIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
  },
  logoText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: -2,
  },
  tagline: {
    color: '#93c5fd',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subTagline: {
    color: 'rgba(147,197,253,0.5)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 80,
    left: 60,
    right: 60,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 2,
  },
});
