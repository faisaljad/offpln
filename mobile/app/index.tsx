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
  const p1 = useRef(new Animated.Value(3000)).current;
  const p2 = useRef(new Animated.Value(2000)).current;
  const p3 = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(p1, { toValue: 0, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(p2, { toValue: 0, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(p3, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: false }),
    ]).start(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])).start();
    });
  }, []);

  const W = width * 0.95;
  const S = 'rgba(220,228,238,0.55)';   // main stroke
  const H = 'rgba(220,228,238,0.7)';    // heavy stroke
  const L = 'rgba(200,210,225,0.25)';    // light/guide
  const G2 = 'rgba(200,210,225,0.12)';   // ghost/grid
  const A = 'rgba(251,191,36,0.45)';     // accent

  return (
    <View style={{ width: W, height: 270, alignItems: 'center', marginBottom: 30 }}>
      <Svg width={W} height={270} viewBox="0 0 420 240">

        {/* ══ P1: Construction guides + main structure ══ */}

        {/* Perspective ground grid */}
        <AnimatedPath d="M0 195 L420 195" stroke={G2} strokeWidth="0.4" fill="none" strokeDasharray="3000" strokeDashoffset={p1} />
        <AnimatedPath d="M60 195 L80 220 M140 195 L150 220 M210 195 L210 220 M280 195 L270 220 M350 195 L340 220" stroke={G2} strokeWidth="0.3" fill="none" strokeDasharray="3000" strokeDashoffset={p1} />
        <AnimatedPath d="M40 205 L380 205 M50 212 L370 212" stroke={G2} strokeWidth="0.25" fill="none" strokeDasharray="3000" strokeDashoffset={p1} />

        {/* Vertical construction guides — extend above building */}
        <AnimatedPath d="M75 10 L75 195 M175 10 L175 195 M245 10 L245 195 M345 10 L345 195" stroke={G2} strokeWidth="0.3" fill="none" strokeDasharray="3000" strokeDashoffset={p1} />
        {/* Horizontal guides */}
        <AnimatedPath d="M40 55 L390 55 M40 95 L390 95 M40 130 L390 130 M40 160 L390 160" stroke={G2} strokeWidth="0.25" fill="none" strokeDasharray="3000" strokeDashoffset={p1} />

        {/* Ground line — bold */}
        <AnimatedPath d="M30 195 L390 195" stroke={H} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeDasharray="3000" strokeDashoffset={p1} />

        {/* Foundation / base — stone texture */}
        <AnimatedPath d="M65 195 L65 185 L355 185 L355 195" stroke={H} strokeWidth="1.3" fill="none" strokeLinejoin="round" strokeDasharray="3000" strokeDashoffset={p1} />
        <AnimatedPath d="M70 190 L85 190 M95 188 L115 188 M125 190 L145 190 M155 188 L175 188 M185 190 L205 190 M215 188 L235 188 M245 190 L265 190 M275 188 L295 188 M305 190 L325 190 M335 188 L350 188" stroke={L} strokeWidth="0.4" fill="none" strokeDasharray="3000" strokeDashoffset={p1} />

        {/* ── Ground floor walls ── */}
        {/* Main body */}
        <AnimatedPath d="M85 185 L85 130 L335 130 L335 185" stroke={H} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeDasharray="3000" strokeDashoffset={p1} />

        {/* Left wing */}
        <AnimatedPath d="M65 185 L65 145 L85 145" stroke={S} strokeWidth="1.2" fill="none" strokeLinejoin="round" strokeDasharray="3000" strokeDashoffset={p1} />

        {/* Right wing */}
        <AnimatedPath d="M335 145 L355 145 L355 185" stroke={S} strokeWidth="1.2" fill="none" strokeLinejoin="round" strokeDasharray="3000" strokeDashoffset={p1} />

        {/* Porch / veranda overhang line */}
        <AnimatedPath d="M110 130 L110 120 L310 120 L310 130" stroke={S} strokeWidth="0.8" fill="none" strokeLinejoin="round" strokeDasharray="3000" strokeDashoffset={p1} />

        {/* ── Second floor ── */}
        <AnimatedPath d="M95 130 L95 75 L325 75 L325 130" stroke={H} strokeWidth="1.4" fill="none" strokeLinejoin="round" strokeDasharray="3000" strokeDashoffset={p1} />

        {/* Second floor overhang / fascia */}
        <AnimatedPath d="M90 130 L330 130" stroke={H} strokeWidth="1" fill="none" strokeDasharray="3000" strokeDashoffset={p1} />
        <AnimatedPath d="M88 132 L332 132" stroke={L} strokeWidth="0.5" fill="none" strokeDasharray="3000" strokeDashoffset={p1} />


        {/* ══ P2: Roof, columns, porch, chimney ══ */}

        {/* Main roof */}
        <AnimatedPath d="M80 75 L80 55 L340 55 L340 75" stroke={H} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeDasharray="2000" strokeDashoffset={p2} />
        {/* Roof overhang */}
        <AnimatedPath d="M75 75 L345 75" stroke={H} strokeWidth="1.2" fill="none" strokeDasharray="2000" strokeDashoffset={p2} />
        {/* Roof fascia detail */}
        <AnimatedPath d="M78 77 L342 77" stroke={L} strokeWidth="0.5" fill="none" strokeDasharray="2000" strokeDashoffset={p2} />
        {/* Roof top line */}
        <AnimatedPath d="M78 55 L342 55" stroke={H} strokeWidth="1" fill="none" strokeDasharray="2000" strokeDashoffset={p2} />

        {/* Roof hatching */}
        <AnimatedPath d={Array.from({length: 20}, (_, i) => `M${85 + i * 13} 58 L${85 + i * 13} 73`).join(' ')} stroke={G2} strokeWidth="0.3" fill="none" strokeDasharray="2000" strokeDashoffset={p2} />

        {/* Chimney */}
        <AnimatedPath d="M290 55 L290 38 L308 38 L308 55" stroke={S} strokeWidth="1" fill="none" strokeLinejoin="round" strokeDasharray="2000" strokeDashoffset={p2} />
        <AnimatedPath d="M288 38 L310 38" stroke={S} strokeWidth="0.8" fill="none" strokeDasharray="2000" strokeDashoffset={p2} />

        {/* Porch columns */}
        <AnimatedPath d="M130 185 L130 130 M170 185 L170 130 M250 185 L250 130 M290 185 L290 130" stroke={S} strokeWidth="1" fill="none" strokeDasharray="2000" strokeDashoffset={p2} />
        {/* Column bases */}
        <AnimatedPath d="M127 185 L133 185 M167 185 L173 185 M247 185 L253 185 M287 185 L293 185" stroke={S} strokeWidth="1.2" fill="none" strokeDasharray="2000" strokeDashoffset={p2} />
        {/* Column capitals */}
        <AnimatedPath d="M128 132 L132 130 M168 132 L172 130 M248 132 L252 130 M288 132 L292 130" stroke={L} strokeWidth="0.6" fill="none" strokeDasharray="2000" strokeDashoffset={p2} />

        {/* Porch ceiling lines */}
        <AnimatedPath d="M110 125 L310 125" stroke={L} strokeWidth="0.4" fill="none" strokeDasharray="2000" strokeDashoffset={p2} />

        {/* Steps */}
        <AnimatedPath d="M160 195 L260 195 M155 198 L265 198 M150 201 L270 201" stroke={L} strokeWidth="0.5" fill="none" strokeDasharray="2000" strokeDashoffset={p2} />


        {/* ══ P3: Windows, doors, details, landscaping (fade in) ══ */}
        <Animated.View style={{ opacity: p3, position: 'absolute' }}>
          <Svg width={W} height={270} viewBox="0 0 420 240">

            {/* ── Second floor windows (larger) ── */}
            {[110, 140, 170, 240, 270, 300].map((x, i) => (
              <G key={`uw${i}`}>
                <Path d={`M${x} 82 L${x + 22} 82 L${x + 22} 120 L${x} 120 Z`} stroke={S} strokeWidth="0.9" fill="none" />
                {/* Mullions */}
                <Line x1={x + 11} y1={82} x2={x + 11} y2={120} stroke={L} strokeWidth="0.5" />
                <Line x1={x} y1={96} x2={x + 22} y2={96} stroke={L} strokeWidth="0.5" />
                <Line x1={x} y1={108} x2={x + 22} y2={108} stroke={L} strokeWidth="0.4" />
                {/* Sill */}
                <Line x1={x - 1} y1={121} x2={x + 23} y2={121} stroke={S} strokeWidth="0.6" />
                {/* Shadow hatching inside */}
                <Path d={`M${x + 1} 83 L${x + 5} 95 M${x + 6} 83 L${x + 10} 95`} stroke={G2} strokeWidth="0.3" fill="none" />
              </G>
            ))}

            {/* ── Ground floor windows (between columns) ── */}
            {[135, 255].map((x, i) => (
              <G key={`gw${i}`}>
                <Path d={`M${x} 140 L${x + 30} 140 L${x + 30} 178 L${x} 178 Z`} stroke={S} strokeWidth="0.8" fill="none" />
                <Line x1={x + 10} y1={140} x2={x + 10} y2={178} stroke={L} strokeWidth="0.4" />
                <Line x1={x + 20} y1={140} x2={x + 20} y2={178} stroke={L} strokeWidth="0.4" />
                <Line x1={x} y1={155} x2={x + 30} y2={155} stroke={L} strokeWidth="0.4" />
                <Line x1={x - 1} y1={179} x2={x + 31} y2={179} stroke={S} strokeWidth="0.5" />
                <Path d={`M${x + 1} 141 L${x + 4} 153 M${x + 5} 141 L${x + 8} 153`} stroke={G2} strokeWidth="0.3" fill="none" />
              </G>
            ))}

            {/* ── Wing windows ── */}
            {[68, 338].map((x, i) => (
              <G key={`ww${i}`}>
                <Path d={`M${x} 152 L${x + 14} 152 L${x + 14} 175 L${x} 175 Z`} stroke={S} strokeWidth="0.7" fill="none" />
                <Line x1={x + 7} y1={152} x2={x + 7} y2={175} stroke={L} strokeWidth="0.4" />
                <Line x1={x} y1={163} x2={x + 14} y2={163} stroke={L} strokeWidth="0.3" />
              </G>
            ))}

            {/* ── Main entrance door ── */}
            <Path d="M195 185 L195 148 Q210 138 225 148 L225 185" stroke={A} strokeWidth="1.1" fill="none" strokeLinecap="round" />
            <Path d="M198 185 L198 150 Q210 142 222 150 L222 185" stroke="rgba(251,191,36,0.2)" strokeWidth="0.5" fill="none" />
            <Circle cx="220" cy="170" r="1.5" stroke={A} strokeWidth="0.7" fill="none" />

            {/* ── Side entrance ── */}
            <Path d="M100 185 L100 160 L118 160 L118 185" stroke={S} strokeWidth="0.7" fill="none" />

            {/* ── Facade panel lines ── */}
            <Line x1="95" y1="100" x2="95" y2="125" stroke={G2} strokeWidth="0.3" />
            <Line x1="325" y1="100" x2="325" y2="125" stroke={G2} strokeWidth="0.3" />

            {/* ── Landscaping — detailed trees ── */}
            {/* Left tree */}
            <Path d="M40 195 L40 150" stroke={L} strokeWidth="0.7" fill="none" />
            <Path d="M28 165 Q30 148 40 140 Q50 148 52 165" stroke={S} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <Path d="M32 160 Q36 145 40 138 Q44 145 48 160" stroke={L} strokeWidth="0.5" fill="none" />
            <Path d="M25 170 Q33 155 40 145 Q47 155 55 170" stroke={G2} strokeWidth="0.4" fill="none" />

            {/* Right tree — slightly different shape */}
            <Path d="M380 195 L380 145" stroke={L} strokeWidth="0.7" fill="none" />
            <Path d="M366 162 Q370 142 380 132 Q390 142 394 162" stroke={S} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <Path d="M370 155 Q375 140 380 133 Q385 140 390 155" stroke={L} strokeWidth="0.5" fill="none" />
            <Path d="M372 168 Q376 150 380 138 Q384 150 388 168" stroke={G2} strokeWidth="0.4" fill="none" />

            {/* Small bushes */}
            <Path d="M55 192 Q58 186 62 192 Q65 187 68 192" stroke={L} strokeWidth="0.5" fill="none" />
            <Path d="M350 192 Q353 186 356 192 Q359 187 362 192" stroke={L} strokeWidth="0.5" fill="none" />

            {/* ── Shadow hatching — right facade ── */}
            {Array.from({length: 10}, (_, i) => (
              <Line key={`sh${i}`} x1={337} y1={80 + i * 10} x2={342} y2={85 + i * 10} stroke={G2} strokeWidth="0.3" />
            ))}

            {/* ── Under-porch shadow hatching ── */}
            {Array.from({length: 14}, (_, i) => (
              <Line key={`ph${i}`} x1={115 + i * 14} y1={126} x2={118 + i * 14} y2={130} stroke={G2} strokeWidth="0.3" />
            ))}

            {/* ── Construction dimension annotations ── */}
            <G opacity={0.12}>
              {/* Horizontal dimension */}
              <Line x1="65" y1="210" x2="355" y2="210" stroke={S} strokeWidth="0.5" />
              <Line x1="65" y1="207" x2="65" y2="213" stroke={S} strokeWidth="0.5" />
              <Line x1="355" y1="207" x2="355" y2="213" stroke={S} strokeWidth="0.5" />
              {/* Vertical dimension */}
              <Line x1="15" y1="55" x2="15" y2="195" stroke={S} strokeWidth="0.5" />
              <Line x1="12" y1="55" x2="18" y2="55" stroke={S} strokeWidth="0.5" />
              <Line x1="12" y1="195" x2="18" y2="195" stroke={S} strokeWidth="0.5" />
              {/* Tick marks */}
              <Line x1="210" y1="207" x2="210" y2="213" stroke={S} strokeWidth="0.4" />
            </G>
          </Svg>
        </Animated.View>

        {/* Subtle accent glow */}
        <AnimatedPath
          d="M65 185 L65 145 L85 145 L85 130 L95 130 L95 75 L325 75 L325 130 L335 130 L335 145 L355 145 L355 185"
          stroke="rgba(251,191,36,0.05)"
          strokeWidth={glow.interpolate({ inputRange: [0, 1], outputRange: [0, 4] })}
          strokeLinejoin="round" fill="none"
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
