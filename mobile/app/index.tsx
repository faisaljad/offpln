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
  // Each phase draws its strokes via dashOffset animation (no useNativeDriver — dashOffset is layout)
  const ground = useRef(new Animated.Value(600)).current;
  const foundation = useRef(new Animated.Value(700)).current;
  const wallsLeft = useRef(new Animated.Value(400)).current;
  const wallsMain = useRef(new Animated.Value(600)).current;
  const wallsRight = useRef(new Animated.Value(400)).current;
  const roofLine = useRef(new Animated.Value(500)).current;
  const roofSide = useRef(new Animated.Value(200)).current;
  const chimney = useRef(new Animated.Value(200)).current;
  const windows = useRef(new Animated.Value(0)).current;
  const door = useRef(new Animated.Value(200)).current;
  const treeL = useRef(new Animated.Value(200)).current;
  const treeR = useRef(new Animated.Value(200)).current;
  const fence = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ease = Easing.out(Easing.ease);
    Animated.sequence([
      // Ground
      Animated.timing(ground, { toValue: 0, duration: 400, easing: ease, useNativeDriver: false }),
      // Foundation
      Animated.timing(foundation, { toValue: 0, duration: 400, easing: ease, useNativeDriver: false }),
      // Walls simultaneously
      Animated.parallel([
        Animated.timing(wallsLeft, { toValue: 0, duration: 500, easing: ease, useNativeDriver: false }),
        Animated.timing(wallsMain, { toValue: 0, duration: 600, easing: ease, useNativeDriver: false }),
        Animated.timing(wallsRight, { toValue: 0, duration: 500, easing: ease, useNativeDriver: false }),
      ]),
      // Roof
      Animated.parallel([
        Animated.timing(roofLine, { toValue: 0, duration: 400, easing: ease, useNativeDriver: false }),
        Animated.timing(roofSide, { toValue: 0, duration: 300, easing: ease, useNativeDriver: false }),
        Animated.timing(chimney, { toValue: 0, duration: 250, easing: ease, useNativeDriver: false }),
      ]),
      // Windows + door
      Animated.parallel([
        Animated.timing(windows, { toValue: 1, duration: 400, easing: ease, useNativeDriver: false }),
        Animated.timing(door, { toValue: 0, duration: 400, easing: ease, useNativeDriver: false }),
      ]),
      // Landscaping
      Animated.parallel([
        Animated.timing(treeL, { toValue: 0, duration: 400, easing: ease, useNativeDriver: false }),
        Animated.timing(treeR, { toValue: 0, duration: 400, easing: ease, useNativeDriver: false }),
        Animated.timing(fence, { toValue: 1, duration: 400, easing: ease, useNativeDriver: false }),
      ]),
    ]).start(() => {
      // Glow pulse after complete
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(glow, { toValue: 0, duration: 1200, useNativeDriver: false }),
        ])
      ).start();
    });
  }, []);

  const STROKE = 'rgba(125,211,252,0.7)';
  const GOLD = 'rgba(251,191,36,0.8)';
  const GREEN = 'rgba(74,222,128,0.6)';
  const SUBTLE = 'rgba(148,163,184,0.5)';
  const W = width * 0.88;

  return (
    <View style={{ width: W, height: 280, alignItems: 'center', marginBottom: 36 }}>
      <Svg width={W} height={280} viewBox="0 0 320 220">
        {/* ── Ground line ── */}
        <AnimatedPath
          d="M10 200 L310 200"
          stroke={SUBTLE}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="600"
          strokeDashoffset={ground}
        />

        {/* ── Foundation ── */}
        <AnimatedPath
          d="M50 200 L50 190 L270 190 L270 200"
          stroke={SUBTLE}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="700"
          strokeDashoffset={foundation}
        />
        {/* Foundation hatching */}
        <AnimatedPath
          d="M60 195 L80 195 M100 195 L120 195 M140 195 L160 195 M180 195 L200 195 M220 195 L240 195 M250 195 L260 195"
          stroke="rgba(148,163,184,0.25)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="700"
          strokeDashoffset={foundation}
        />

        {/* ── Walls — left wing ── */}
        <AnimatedPath
          d="M50 190 L50 140 L85 140 L85 190"
          stroke={STROKE}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="400"
          strokeDashoffset={wallsLeft}
        />

        {/* ── Walls — main body ── */}
        <AnimatedPath
          d="M85 190 L85 110 L235 110 L235 190"
          stroke={STROKE}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="600"
          strokeDashoffset={wallsMain}
        />

        {/* ── Walls — right wing ── */}
        <AnimatedPath
          d="M235 190 L235 140 L270 140 L270 190"
          stroke={STROKE}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="400"
          strokeDashoffset={wallsRight}
        />

        {/* ── Garage outline ── */}
        <AnimatedPath
          d="M200 190 L200 150 L232 150 L232 190"
          stroke="rgba(125,211,252,0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="400"
          strokeDashoffset={wallsRight}
        />

        {/* ── Roof — main ── */}
        <AnimatedPath
          d="M75 110 L160 60 L245 110"
          stroke={GOLD}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="500"
          strokeDashoffset={roofLine}
        />

        {/* ── Roof — left wing ── */}
        <AnimatedPath
          d="M42 140 L67 122 L92 140"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="200"
          strokeDashoffset={roofSide}
        />

        {/* ── Roof — right wing ── */}
        <AnimatedPath
          d="M228 140 L253 122 L278 140"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="200"
          strokeDashoffset={roofSide}
        />

        {/* ── Chimney ── */}
        <AnimatedPath
          d="M200 85 L200 62 L212 62 L212 78"
          stroke={SUBTLE}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="200"
          strokeDashoffset={chimney}
        />

        {/* ── Windows row 1 ── */}
        <Animated.View style={{ opacity: windows, position: 'absolute' }}>
          <Svg width={W} height={280} viewBox="0 0 320 220">
            {[105, 130, 175, 200].map(x => (
              <G key={x}>
                <Rect x={x} y="120" width="18" height="16" rx="2" stroke={STROKE} strokeWidth="1.2" fill="none" />
                <Line x1={x + 9} y1={120} x2={x + 9} y2={136} stroke={STROKE} strokeWidth="0.7" />
                <Line x1={x} y1={128} x2={x + 18} y2={128} stroke={STROKE} strokeWidth="0.7" />
              </G>
            ))}
            {/* Windows row 2 */}
            {[105, 175].map(x => (
              <G key={`w2${x}`}>
                <Rect x={x} y="148" width="18" height="16" rx="2" stroke={STROKE} strokeWidth="1.2" fill="none" />
                <Line x1={x + 9} y1={148} x2={x + 9} y2={164} stroke={STROKE} strokeWidth="0.7" />
                <Line x1={x} y1={156} x2={x + 18} y2={156} stroke={STROKE} strokeWidth="0.7" />
              </G>
            ))}
            {/* Left wing window */}
            <Rect x="58" y="152" width="16" height="14" rx="2" stroke={STROKE} strokeWidth="1" fill="none" />
            <Line x1="66" y1="152" x2="66" y2="166" stroke={STROKE} strokeWidth="0.6" />
            {/* Right wing window */}
            <Rect x="245" y="152" width="16" height="14" rx="2" stroke={STROKE} strokeWidth="1" fill="none" />
            <Line x1="253" y1="152" x2="253" y2="166" stroke={STROKE} strokeWidth="0.6" />
            {/* Garage door */}
            <Line x1="205" y1="162" x2="227" y2="162" stroke="rgba(125,211,252,0.3)" strokeWidth="0.8" />
            <Line x1="205" y1="170" x2="227" y2="170" stroke="rgba(125,211,252,0.3)" strokeWidth="0.8" />
            <Line x1="205" y1="178" x2="227" y2="178" stroke="rgba(125,211,252,0.3)" strokeWidth="0.8" />
            {/* Balcony railing */}
            <Line x1="135" y1="145" x2="185" y2="145" stroke="rgba(125,211,252,0.4)" strokeWidth="1" />
            {[138, 145, 152, 159, 166, 173, 180].map(x => (
              <Line key={`b${x}`} x1={x} y1="145" x2={x} y2="148" stroke="rgba(125,211,252,0.3)" strokeWidth="0.7" />
            ))}
          </Svg>
        </Animated.View>

        {/* ── Door ── */}
        <AnimatedPath
          d="M150 190 L150 160 Q160 152 170 160 L170 190"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="200"
          strokeDashoffset={door}
        />
        {/* Door handle */}
        <AnimatedCircle
          cx="165" cy="178" r="1.5"
          stroke={GOLD}
          strokeWidth="1"
          fill="none"
          opacity={windows}
        />

        {/* ── Tree left ── */}
        <AnimatedPath
          d="M30 200 L30 165 M30 175 Q20 155 30 145 Q40 155 30 175 M22 180 Q30 160 38 180"
          stroke={GREEN}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="200"
          strokeDashoffset={treeL}
        />

        {/* ── Tree right ── */}
        <AnimatedPath
          d="M290 200 L290 165 M290 175 Q280 155 290 145 Q300 155 290 175 M282 180 Q290 160 298 180"
          stroke={GREEN}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="200"
          strokeDashoffset={treeR}
        />

        {/* ── Fence & path ── */}
        <Animated.View style={{ opacity: fence, position: 'absolute' }}>
          <Svg width={W} height={280} viewBox="0 0 320 220">
            {/* Fence left */}
            {[15, 22, 29, 36, 43].map(x => (
              <Line key={`fl${x}`} x1={x} y1="200" x2={x} y2="190" stroke="rgba(148,163,184,0.3)" strokeWidth="0.8" />
            ))}
            <Line x1="15" y1="193" x2="43" y2="193" stroke="rgba(148,163,184,0.3)" strokeWidth="0.8" />
            {/* Fence right */}
            {[277, 284, 291, 298, 305].map(x => (
              <Line key={`fr${x}`} x1={x} y1="200" x2={x} y2="190" stroke="rgba(148,163,184,0.3)" strokeWidth="0.8" />
            ))}
            <Line x1="277" y1="193" x2="305" y2="193" stroke="rgba(148,163,184,0.3)" strokeWidth="0.8" />
            {/* Path/walkway */}
            <Line x1="155" y1="200" x2="150" y2="210" stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
            <Line x1="165" y1="200" x2="170" y2="210" stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
            {/* Bushes as circles outline */}
            <Circle cx="48" cy="195" r="6" stroke={GREEN} strokeWidth="1" fill="none" />
            <Circle cx="272" cy="195" r="6" stroke={GREEN} strokeWidth="1" fill="none" />
            <Circle cx="58" cy="197" r="4" stroke={GREEN} strokeWidth="0.8" fill="none" />
            <Circle cx="262" cy="197" r="4" stroke={GREEN} strokeWidth="0.8" fill="none" />
          </Svg>
        </Animated.View>

        {/* ── Glow pulse on completed villa ── */}
        <AnimatedPath
          d="M50 200 L50 190 L85 190 L85 140 L50 140 L85 110 L235 110 L270 140 L235 140 L235 190 L270 190 L270 200"
          stroke="rgba(251,191,36,0.15)"
          strokeWidth={glow.interpolate({ inputRange: [0, 1], outputRange: [0, 3] })}
          strokeLinecap="round"
          strokeLinejoin="round"
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
