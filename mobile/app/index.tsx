import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Rect, Line, Circle, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useAuthStore } from '../store/auth';

const { width } = Dimensions.get('window');

function BuildingConstruction() {
  const crane = useRef(new Animated.Value(0)).current;
  const build1 = useRef(new Animated.Value(0)).current;
  const build2 = useRef(new Animated.Value(0)).current;
  const build3 = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Crane swings
    Animated.loop(
      Animated.sequence([
        Animated.timing(crane, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(crane, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Buildings rise
    Animated.stagger(300, [
      Animated.timing(build1, { toValue: 1, duration: 1200, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(build2, { toValue: 1, duration: 1200, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(build3, { toValue: 1, duration: 1200, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();

    // Sparkle loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const craneRotate = crane.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <View style={svgStyles.container}>
      {/* Background grid lines */}
      <Svg width={width * 0.85} height={280} viewBox="0 0 340 280">
        <Defs>
          <SvgGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0ea5e9" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#0284c7" stopOpacity="0.02" />
          </SvgGradient>
          <SvgGradient id="b1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0ea5e9" />
            <Stop offset="1" stopColor="#0369a1" />
          </SvgGradient>
          <SvgGradient id="b2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fbbf24" />
            <Stop offset="1" stopColor="#f59e0b" />
          </SvgGradient>
          <SvgGradient id="b3" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#38bdf8" />
            <Stop offset="1" stopColor="#0284c7" />
          </SvgGradient>
        </Defs>

        {/* Subtle grid */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <Line key={`h${i}`} x1="0" y1={50 + i * 40} x2="340" y2={50 + i * 40} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <Line key={`v${i}`} x1={40 + i * 40} y1="0" x2={40 + i * 40} y2="280" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}

        {/* Ground line */}
        <Line x1="20" y1="250" x2="320" y2="250" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" />

        {/* Ground dots */}
        {[40, 80, 120, 160, 200, 240, 280].map(x => (
          <Circle key={x} cx={x} cy="250" r="2" fill="rgba(255,255,255,0.1)" />
        ))}
      </Svg>

      {/* Crane */}
      <Animated.View style={[svgStyles.crane, { transform: [{ rotate: craneRotate }] }]}>
        <Svg width={60} height={120} viewBox="0 0 60 120">
          {/* Crane mast */}
          <Rect x="27" y="20" width="6" height="100" fill="rgba(251,191,36,0.7)" rx="2" />
          {/* Crane arm */}
          <Rect x="5" y="18" width="50" height="5" fill="rgba(251,191,36,0.8)" rx="2" />
          {/* Cable */}
          <Line x1="10" y1="23" x2="10" y2="65" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          {/* Hook */}
          <Path d="M7 65 Q10 72 13 65" stroke="rgba(251,191,36,0.6)" strokeWidth="2" fill="none" />
          {/* Top */}
          <Circle cx="30" cy="18" r="4" fill="rgba(251,191,36,0.9)" />
        </Svg>
      </Animated.View>

      {/* Building 1 — tall left */}
      <Animated.View style={[svgStyles.building1, { transform: [{ translateY: build1.interpolate({ inputRange: [0, 1], outputRange: [140, 0] }) }], opacity: build1 }]}>
        <Svg width={65} height={140} viewBox="0 0 65 140">
          <Rect x="0" y="0" width="65" height="140" rx="6" fill="url(#b1)" opacity="0.85" />
          {/* Windows */}
          {[0, 1, 2, 3, 4, 5, 6].map(row =>
            [0, 1, 2].map(col => (
              <Rect key={`${row}${col}`} x={10 + col * 18} y={10 + row * 18} width="12" height="10" rx="2" fill="rgba(255,255,255,0.25)" />
            ))
          )}
          {/* Antenna */}
          <Line x1="32" y1="0" x2="32" y2="-15" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
          <Circle cx="32" cy="-17" r="3" fill="rgba(251,191,36,0.8)" />
        </Svg>
      </Animated.View>

      {/* Building 2 — center gold (shorter) */}
      <Animated.View style={[svgStyles.building2, { transform: [{ translateY: build2.interpolate({ inputRange: [0, 1], outputRange: [110, 0] }) }], opacity: build2 }]}>
        <Svg width={55} height={110} viewBox="0 0 55 110">
          <Rect x="0" y="0" width="55" height="110" rx="6" fill="url(#b2)" opacity="0.8" />
          {[0, 1, 2, 3, 4].map(row =>
            [0, 1].map(col => (
              <Rect key={`${row}${col}`} x={10 + col * 22} y={10 + row * 20} width="16" height="12" rx="2" fill="rgba(255,255,255,0.3)" />
            ))
          )}
          {/* Roof detail */}
          <Path d="M0 0 L27.5 -12 L55 0" fill="rgba(251,191,36,0.4)" />
        </Svg>
      </Animated.View>

      {/* Building 3 — right blue (tallest) */}
      <Animated.View style={[svgStyles.building3, { transform: [{ translateY: build3.interpolate({ inputRange: [0, 1], outputRange: [170, 0] }) }], opacity: build3 }]}>
        <Svg width={58} height={170} viewBox="0 0 58 170">
          <Rect x="0" y="0" width="58" height="170" rx="8" fill="url(#b3)" opacity="0.85" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(row =>
            [0, 1, 2].map(col => (
              <Rect key={`${row}${col}`} x={7 + col * 17} y={8 + row * 18} width="11" height="10" rx="2" fill="rgba(255,255,255,0.2)" />
            ))
          )}
          {/* Spire */}
          <Line x1="29" y1="0" x2="29" y2="-25" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" />
          <Circle cx="29" cy="-27" r="4" fill="rgba(14,165,233,0.8)" />
        </Svg>
      </Animated.View>

      {/* Sparkle particles */}
      <Animated.View style={[svgStyles.sparkles, { opacity: sparkle }]}>
        <Svg width={width * 0.85} height={280} viewBox="0 0 340 280">
          {[
            { cx: 60, cy: 60 }, { cx: 280, cy: 40 }, { cx: 170, cy: 30 },
            { cx: 310, cy: 100 }, { cx: 30, cy: 130 }, { cx: 250, cy: 80 },
          ].map((s, i) => (
            <G key={i}>
              <Circle cx={s.cx} cy={s.cy} r="2" fill="rgba(251,191,36,0.6)" />
              <Line x1={s.cx - 5} y1={s.cy} x2={s.cx + 5} y2={s.cy} stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
              <Line x1={s.cx} y1={s.cy - 5} x2={s.cx} y2={s.cy + 5} stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
            </G>
          ))}
        </Svg>
      </Animated.View>
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
      <BuildingConstruction />

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

const svgStyles = StyleSheet.create({
  container: {
    width: width * 0.85,
    height: 280,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  crane: {
    position: 'absolute',
    top: 20,
    right: 50,
    transformOrigin: 'bottom center',
  },
  building1: {
    position: 'absolute',
    bottom: 30,
    left: 30,
  },
  building2: {
    position: 'absolute',
    bottom: 30,
    left: width * 0.85 / 2 - 27,
  },
  building3: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  sparkles: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

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
