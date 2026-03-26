import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Rect, Line, Circle, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useAuthStore } from '../store/auth';

const { width } = Dimensions.get('window');

function VillaConstruction() {
  // Step animations: foundation → walls → roof → windows/door → garden
  const foundation = useRef(new Animated.Value(0)).current;
  const walls = useRef(new Animated.Value(0)).current;
  const roof = useRef(new Animated.Value(0)).current;
  const details = useRef(new Animated.Value(0)).current;
  const garden = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const crane = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequential build process
    Animated.sequence([
      Animated.timing(foundation, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(walls, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      Animated.timing(roof, { toValue: 1, duration: 500, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
      Animated.timing(details, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(garden, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    // Crane swings while building
    Animated.loop(
      Animated.sequence([
        Animated.timing(crane, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(crane, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Sparkle after build
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkle, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(sparkle, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }, 2200);
  }, []);

  const craneRotate = crane.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] });
  const W = width * 0.88;

  return (
    <View style={{ width: W, height: 300, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 32 }}>

      {/* Crane — top right, disappears after roof */}
      <Animated.View style={{
        position: 'absolute', top: 0, right: 20,
        transform: [{ rotate: craneRotate }],
        opacity: roof.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
      }}>
        <Svg width={50} height={110} viewBox="0 0 50 110">
          <Rect x="22" y="15" width="5" height="95" fill="rgba(251,191,36,0.6)" rx="2" />
          <Rect x="2" y="13" width="46" height="4" fill="rgba(251,191,36,0.7)" rx="2" />
          <Line x1="8" y1="17" x2="8" y2="55" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <Path d="M5 55 Q8 62 11 55" stroke="rgba(251,191,36,0.5)" strokeWidth="1.5" fill="none" />
          <Circle cx="25" cy="13" r="3.5" fill="rgba(251,191,36,0.8)" />
        </Svg>
      </Animated.View>

      {/* Ground */}
      <Svg width={W} height={300} viewBox="0 0 360 300" style={{ position: 'absolute' }}>
        <Defs>
          <SvgGradient id="groundG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="rgba(255,255,255,0.08)" />
            <Stop offset="1" stopColor="rgba(255,255,255,0)" />
          </SvgGradient>
        </Defs>
        <Rect x="30" y="260" width="300" height="30" rx="8" fill="url(#groundG)" />
        <Line x1="30" y1="260" x2="330" y2="260" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
      </Svg>

      {/* Foundation — concrete base */}
      <Animated.View style={{
        position: 'absolute', bottom: 40,
        opacity: foundation,
        transform: [{ scaleX: foundation }, { scaleY: foundation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }],
      }}>
        <Svg width={240} height={20} viewBox="0 0 240 20">
          <Rect x="0" y="0" width="240" height="20" rx="4" fill="rgba(148,163,184,0.4)" />
          <Rect x="0" y="0" width="240" height="8" rx="4" fill="rgba(148,163,184,0.2)" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <Line key={i} x1={30 * i + 15} y1="2" x2={30 * i + 15} y2="18" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          ))}
        </Svg>
      </Animated.View>

      {/* Walls — main villa body */}
      <Animated.View style={{
        position: 'absolute', bottom: 58,
        opacity: walls,
        transform: [{ translateY: walls.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }],
      }}>
        <Svg width={220} height={100} viewBox="0 0 220 100">
          {/* Main body */}
          <Rect x="20" y="10" width="180" height="90" rx="4" fill="rgba(14,165,233,0.3)" />
          {/* Left wing */}
          <Rect x="0" y="30" width="30" height="70" rx="4" fill="rgba(14,165,233,0.25)" />
          {/* Right wing */}
          <Rect x="190" y="30" width="30" height="70" rx="4" fill="rgba(14,165,233,0.25)" />
          {/* Garage */}
          <Rect x="155" y="55" width="35" height="45" rx="3" fill="rgba(14,165,233,0.15)" />
          {/* Pillar lines */}
          <Line x1="20" y1="10" x2="20" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
          <Line x1="200" y1="10" x2="200" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
        </Svg>
      </Animated.View>

      {/* Roof */}
      <Animated.View style={{
        position: 'absolute', bottom: 148,
        opacity: roof,
        transform: [{ translateY: roof.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
      }}>
        <Svg width={240} height={50} viewBox="0 0 240 50">
          {/* Main roof */}
          <Path d="M10 50 L120 5 L230 50 Z" fill="rgba(251,191,36,0.5)" />
          <Path d="M10 50 L120 5 L230 50" fill="none" stroke="rgba(251,191,36,0.7)" strokeWidth="2" />
          {/* Left wing roof */}
          <Path d="M0 50 L15 35 L35 50" fill="rgba(251,191,36,0.35)" />
          {/* Right wing roof */}
          <Path d="M205 50 L225 35 L240 50" fill="rgba(251,191,36,0.35)" />
          {/* Chimney */}
          <Rect x="160" y="15" width="12" height="25" rx="2" fill="rgba(148,163,184,0.4)" />
        </Svg>
      </Animated.View>

      {/* Windows, door, details */}
      <Animated.View style={{
        position: 'absolute', bottom: 58,
        opacity: details,
        transform: [{ scale: details }],
      }}>
        <Svg width={220} height={100} viewBox="0 0 220 100">
          {/* Windows — row 1 */}
          <Rect x="40" y="18" width="22" height="18" rx="3" fill="rgba(125,211,252,0.4)" />
          <Rect x="72" y="18" width="22" height="18" rx="3" fill="rgba(125,211,252,0.4)" />
          <Rect x="126" y="18" width="22" height="18" rx="3" fill="rgba(125,211,252,0.4)" />
          <Rect x="158" y="18" width="22" height="18" rx="3" fill="rgba(125,211,252,0.4)" />
          {/* Window crosses */}
          {[40, 72, 126, 158].map(x => (
            <G key={x}>
              <Line x1={x + 11} y1={18} x2={x + 11} y2={36} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <Line x1={x} y1={27} x2={x + 22} y2={27} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            </G>
          ))}
          {/* Windows — row 2 */}
          <Rect x="40" y="48" width="22" height="18" rx="3" fill="rgba(125,211,252,0.35)" />
          <Rect x="126" y="48" width="22" height="18" rx="3" fill="rgba(125,211,252,0.35)" />
          {/* Front door */}
          <Rect x="90" y="50" width="24" height="50" rx="12" fill="rgba(251,191,36,0.5)" />
          <Circle cx="108" cy="78" r="2" fill="rgba(255,255,255,0.4)" />
          {/* Garage door lines */}
          {[0, 1, 2, 3].map(i => (
            <Line key={i} x1={158} y1={60 + i * 10} x2={188} y2={60 + i * 10} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          ))}
          {/* Balcony */}
          <Rect x="82" y="42" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.15)" />
          <Line x1="85" y1="42" x2="85" y2="48" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <Line x1="90" y1="42" x2="90" y2="48" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <Line x1="95" y1="42" x2="95" y2="48" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <Line x1="100" y1="42" x2="100" y2="48" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <Line x1="105" y1="42" x2="105" y2="48" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <Line x1="110" y1="42" x2="110" y2="48" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <Line x1="115" y1="42" x2="115" y2="48" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <Line x1="119" y1="42" x2="119" y2="48" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        </Svg>
      </Animated.View>

      {/* Garden & landscaping */}
      <Animated.View style={{
        position: 'absolute', bottom: 30,
        opacity: garden,
        transform: [{ scaleX: garden }],
      }}>
        <Svg width={300} height={40} viewBox="0 0 300 40">
          {/* Driveway */}
          <Path d="M130 0 L145 35 L175 35 L160 0 Z" fill="rgba(148,163,184,0.15)" />
          {/* Bushes left */}
          <Circle cx="30" cy="20" r="12" fill="rgba(34,197,94,0.25)" />
          <Circle cx="52" cy="22" r="10" fill="rgba(34,197,94,0.2)" />
          <Circle cx="15" cy="25" r="8" fill="rgba(34,197,94,0.15)" />
          {/* Bushes right */}
          <Circle cx="250" cy="20" r="12" fill="rgba(34,197,94,0.25)" />
          <Circle cx="272" cy="22" r="10" fill="rgba(34,197,94,0.2)" />
          <Circle cx="285" cy="25" r="8" fill="rgba(34,197,94,0.15)" />
          {/* Trees */}
          <Rect x="68" y="10" width="3" height="25" rx="1" fill="rgba(34,197,94,0.3)" />
          <Circle cx="70" cy="6" r="10" fill="rgba(34,197,94,0.3)" />
          <Rect x="228" y="10" width="3" height="25" rx="1" fill="rgba(34,197,94,0.3)" />
          <Circle cx="230" cy="6" r="10" fill="rgba(34,197,94,0.3)" />
          {/* Fence */}
          {[0, 1, 2].map(i => (
            <G key={`fl${i}`}>
              <Rect x={85 + i * 12} y={18} width="2" height="18" rx="1" fill="rgba(255,255,255,0.08)" />
            </G>
          ))}
          {[0, 1, 2].map(i => (
            <G key={`fr${i}`}>
              <Rect x={198 + i * 12} y={18} width="2" height="18" rx="1" fill="rgba(255,255,255,0.08)" />
            </G>
          ))}
          {/* Pool */}
          <Rect x="250" y="0" width="40" height="18" rx="9" fill="rgba(14,165,233,0.2)" stroke="rgba(14,165,233,0.15)" strokeWidth="1" />
        </Svg>
      </Animated.View>

      {/* Sparkle particles — appear after construction */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, opacity: sparkle }}>
        <Svg width={W} height={300} viewBox="0 0 360 300">
          {[
            { cx: 50, cy: 50 }, { cx: 300, cy: 30 }, { cx: 180, cy: 20 },
            { cx: 320, cy: 90 }, { cx: 30, cy: 110 }, { cx: 260, cy: 60 },
            { cx: 140, cy: 70 }, { cx: 80, cy: 140 },
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
