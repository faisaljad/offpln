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
  // 7 phases for gradual "drawing from nothing" effect
  const guides = useRef(new Animated.Value(3000)).current;    // construction lines first
  const ground = useRef(new Animated.Value(1000)).current;    // ground + foundation
  const walls = useRef(new Animated.Value(3000)).current;     // main walls
  const upper = useRef(new Animated.Value(2000)).current;     // second floor + roof
  const porch = useRef(new Animated.Value(2000)).current;     // porch columns
  const detail = useRef(new Animated.Value(0)).current;       // windows, door
  const finish = useRef(new Animated.Value(0)).current;       // trees, shadows, annotations
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const e = Easing.out(Easing.quad);
    Animated.sequence([
      // Start with faint construction guides sketched loosely
      Animated.timing(guides, { toValue: 0, duration: 800, easing: e, useNativeDriver: false }),
      // Ground line drawn confidently
      Animated.timing(ground, { toValue: 0, duration: 500, easing: e, useNativeDriver: false }),
      // Walls rise up
      Animated.timing(walls, { toValue: 0, duration: 900, easing: e, useNativeDriver: false }),
      // Upper floor + roof
      Animated.timing(upper, { toValue: 0, duration: 700, easing: e, useNativeDriver: false }),
      // Porch columns
      Animated.timing(porch, { toValue: 0, duration: 400, easing: e, useNativeDriver: false }),
      // Windows and door pop in
      Animated.timing(detail, { toValue: 1, duration: 400, easing: e, useNativeDriver: false }),
      // Finishing touches
      Animated.timing(finish, { toValue: 1, duration: 500, easing: e, useNativeDriver: false }),
    ]).start(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])).start();
    });
  }, []);

  const W = width * 0.95;
  const S = 'rgba(220,228,238,0.55)';
  const H = 'rgba(220,228,238,0.7)';
  const L = 'rgba(200,210,225,0.22)';
  const G2 = 'rgba(200,210,225,0.1)';
  const A = 'rgba(251,191,36,0.45)';

  return (
    <View style={{ width: W, height: 270, alignItems: 'center', marginBottom: 30 }}>
      <Svg width={W} height={270} viewBox="0 0 420 240">

        {/* ══ PHASE 1: Construction guides appear first — architect's prep marks ══ */}

        {/* Vertical guides — faint, extending full height */}
        <AnimatedPath d="M75 5 L75 220 M175 5 L175 220 M245 5 L245 220 M345 5 L345 220 M130 15 L130 200 M290 15 L290 200" stroke={G2} strokeWidth="0.3" fill="none" strokeDasharray="3000" strokeDashoffset={guides} />
        {/* Horizontal guides — floor levels */}
        <AnimatedPath d="M30 55 L400 55 M30 75 L400 75 M30 95 L400 95 M30 130 L400 130 M30 160 L400 160 M30 185 L400 185" stroke={G2} strokeWidth="0.2" fill="none" strokeDasharray="3000" strokeDashoffset={guides} />
        {/* Perspective ground grid */}
        <AnimatedPath d="M60 195 L80 225 M140 195 L150 225 M210 195 L210 225 M280 195 L270 225 M350 195 L340 225" stroke={G2} strokeWidth="0.25" fill="none" strokeDasharray="3000" strokeDashoffset={guides} />
        <AnimatedPath d="M35 208 L385 208 M45 218 L375 218" stroke={G2} strokeWidth="0.2" fill="none" strokeDasharray="3000" strokeDashoffset={guides} />
        {/* Diagonal construction lines */}
        <AnimatedPath d="M210 55 L75 195 M210 55 L345 195" stroke={G2} strokeWidth="0.15" fill="none" strokeDasharray="3000" strokeDashoffset={guides} />

        {/* ══ PHASE 2: Ground + foundation sketched ══ */}

        {/* Ground — drawn with two passes for sketch feel */}
        <AnimatedPath d="M25 195 Q120 194 210 195 Q300 196 395 195" stroke={H} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeDasharray="1000" strokeDashoffset={ground} />
        <AnimatedPath d="M30 196 Q210 193 390 196" stroke={L} strokeWidth="0.6" fill="none" strokeLinecap="round" strokeDasharray="1000" strokeDashoffset={ground} />

        {/* Foundation base — stone texture */}
        <AnimatedPath d="M65 195 L65 185 Q210 184 355 185 L355 195" stroke={H} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1000" strokeDashoffset={ground} />
        {/* Stone texture lines */}
        <AnimatedPath d="M72 190 L88 190 M98 188 L118 188 M128 190 L148 190 M158 188 L178 188 M188 190 L208 190 M218 188 L238 188 M248 190 L268 190 M278 188 L298 188 M308 190 L328 190 M338 188 L348 188" stroke={L} strokeWidth="0.35" fill="none" strokeLinecap="round" strokeDasharray="1000" strokeDashoffset={ground} />


        {/* ══ PHASE 3: Walls drawn upward — main structure ══ */}

        {/* Main body — sketchy double-pass */}
        <AnimatedPath d="M85 185 L84 130 Q85 128 86 130 L334 130 Q336 128 335 130 L335 185" stroke={H} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3000" strokeDashoffset={walls} />
        {/* Overlap pass */}
        <AnimatedPath d="M86 184 L85 131 M334 131 L334 184" stroke={L} strokeWidth="0.5" fill="none" strokeLinecap="round" strokeDasharray="3000" strokeDashoffset={walls} />

        {/* Left wing */}
        <AnimatedPath d="M65 185 L64 145 Q65 143 66 145 L85 144" stroke={S} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3000" strokeDashoffset={walls} />
        <AnimatedPath d="M66 184 L65 146" stroke={L} strokeWidth="0.4" fill="none" strokeDasharray="3000" strokeDashoffset={walls} />

        {/* Right wing */}
        <AnimatedPath d="M335 144 L354 145 Q356 143 355 146 L355 185" stroke={S} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3000" strokeDashoffset={walls} />
        <AnimatedPath d="M354 146 L354 184" stroke={L} strokeWidth="0.4" fill="none" strokeDasharray="3000" strokeDashoffset={walls} />

        {/* Porch overhang */}
        <AnimatedPath d="M110 130 L110 120 Q210 119 310 120 L310 130" stroke={S} strokeWidth="0.8" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3000" strokeDashoffset={walls} />


        {/* ══ PHASE 4: Upper floor + roof ══ */}

        {/* Second floor walls */}
        <AnimatedPath d="M95 130 L94 75 Q95 73 96 75 L324 75 Q326 73 325 75 L325 130" stroke={H} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2000" strokeDashoffset={upper} />
        <AnimatedPath d="M96 129 L95 76 M324 76 L324 129" stroke={L} strokeWidth="0.4" fill="none" strokeDasharray="2000" strokeDashoffset={upper} />

        {/* Fascia / overhang line */}
        <AnimatedPath d="M88 130 Q210 129 332 130" stroke={H} strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={upper} />
        <AnimatedPath d="M86 132 Q210 131 334 132" stroke={L} strokeWidth="0.4" fill="none" strokeDasharray="2000" strokeDashoffset={upper} />

        {/* Roof box */}
        <AnimatedPath d="M78 75 L78 54 Q210 53 342 54 L342 75" stroke={H} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2000" strokeDashoffset={upper} />
        <AnimatedPath d="M76 75 L344 75" stroke={H} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={upper} />
        <AnimatedPath d="M76 55 Q210 54 344 55" stroke={H} strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={upper} />

        {/* Roof hatching */}
        <AnimatedPath d={Array.from({length: 22}, (_, i) => `M${82 + i * 12} 57 L${82 + i * 12} 73`).join(' ')} stroke={G2} strokeWidth="0.3" fill="none" strokeDasharray="2000" strokeDashoffset={upper} />

        {/* Chimney */}
        <AnimatedPath d="M290 54 L290 36 Q291 34 292 36 L308 36 Q310 34 309 36 L309 54" stroke={S} strokeWidth="0.9" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2000" strokeDashoffset={upper} />
        <AnimatedPath d="M288 36 Q299 35 312 36" stroke={S} strokeWidth="0.7" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={upper} />


        {/* ══ PHASE 5: Porch columns ══ */}

        {/* Columns — sketched with slight wobble */}
        <AnimatedPath d="M130 185 L129 131 Q130 129 131 131" stroke={S} strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={porch} />
        <AnimatedPath d="M170 185 L170 131 Q171 129 171 131" stroke={S} strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={porch} />
        <AnimatedPath d="M250 185 L249 131 Q250 129 251 131" stroke={S} strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={porch} />
        <AnimatedPath d="M290 185 L290 131 Q291 129 291 131" stroke={S} strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={porch} />

        {/* Column bases + capitals */}
        <AnimatedPath d="M127 185 L133 185 M167 185 L173 185 M247 185 L253 185 M287 185 L293 185" stroke={S} strokeWidth="1.1" fill="none" strokeDasharray="2000" strokeDashoffset={porch} />
        <AnimatedPath d="M128 132 L132 130 M168 132 L172 130 M248 132 L252 130 M288 132 L292 130" stroke={L} strokeWidth="0.5" fill="none" strokeDasharray="2000" strokeDashoffset={porch} />

        {/* Porch ceiling line */}
        <AnimatedPath d="M112 125 Q210 124 308 125" stroke={L} strokeWidth="0.4" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={porch} />

        {/* Steps */}
        <AnimatedPath d="M158 195 Q210 194 262 195 M153 199 Q210 198 267 199 M148 203 Q210 202 272 203" stroke={L} strokeWidth="0.5" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={porch} />


        {/* ══ PHASE 6: Windows + door (fade in) ══ */}
        <Animated.View style={{ opacity: detail, position: 'absolute' }}>
          <Svg width={W} height={270} viewBox="0 0 420 240">
            {/* Upper windows — with mullions, sills, shadow */}
            {[110, 140, 170, 240, 270, 300].map((x, i) => (
              <G key={`uw${i}`}>
                <Path d={`M${x} 82 L${x + 22} 82 L${x + 22} 122 L${x} 122 Z`} stroke={S} strokeWidth="0.8" fill="none" />
                <Line x1={x + 11} y1={82} x2={x + 11} y2={122} stroke={L} strokeWidth="0.4" />
                <Line x1={x} y1={97} x2={x + 22} y2={97} stroke={L} strokeWidth="0.4" />
                <Line x1={x} y1={110} x2={x + 22} y2={110} stroke={L} strokeWidth="0.3" />
                <Line x1={x - 1} y1={123} x2={x + 23} y2={123} stroke={S} strokeWidth="0.5" />
                <Path d={`M${x + 1} 83 L${x + 4} 95 M${x + 6} 83 L${x + 9} 95`} stroke={G2} strokeWidth="0.3" fill="none" />
              </G>
            ))}

            {/* Ground floor windows */}
            {[135, 255].map((x, i) => (
              <G key={`gw${i}`}>
                <Path d={`M${x} 140 L${x + 30} 140 L${x + 30} 180 L${x} 180 Z`} stroke={S} strokeWidth="0.8" fill="none" />
                <Line x1={x + 10} y1={140} x2={x + 10} y2={180} stroke={L} strokeWidth="0.4" />
                <Line x1={x + 20} y1={140} x2={x + 20} y2={180} stroke={L} strokeWidth="0.4" />
                <Line x1={x} y1={157} x2={x + 30} y2={157} stroke={L} strokeWidth="0.4" />
                <Line x1={x - 1} y1={181} x2={x + 31} y2={181} stroke={S} strokeWidth="0.5" />
                <Path d={`M${x + 1} 141 L${x + 3} 155 M${x + 4} 141 L${x + 6} 155`} stroke={G2} strokeWidth="0.25" fill="none" />
              </G>
            ))}

            {/* Wing windows */}
            {[68, 338].map((x, i) => (
              <G key={`ww${i}`}>
                <Path d={`M${x} 152 L${x + 14} 152 L${x + 14} 177 L${x} 177 Z`} stroke={S} strokeWidth="0.6" fill="none" />
                <Line x1={x + 7} y1={152} x2={x + 7} y2={177} stroke={L} strokeWidth="0.3" />
                <Line x1={x} y1={164} x2={x + 14} y2={164} stroke={L} strokeWidth="0.3" />
              </G>
            ))}

            {/* Door — arched with handle */}
            <Path d="M195 185 L195 150 Q210 138 225 150 L225 185" stroke={A} strokeWidth="1.1" fill="none" strokeLinecap="round" />
            <Path d="M198 184 L198 152 Q210 142 222 152 L222 184" stroke="rgba(251,191,36,0.18)" strokeWidth="0.5" fill="none" />
            <Circle cx="220" cy="170" r="1.5" stroke={A} strokeWidth="0.6" fill="none" />

            {/* Side door */}
            <Path d="M100 185 L100 162 Q101 160 102 162 L118 162 Q120 160 119 162 L118 185" stroke={S} strokeWidth="0.6" fill="none" strokeLinecap="round" />
          </Svg>
        </Animated.View>


        {/* ══ PHASE 7: Finishing — trees, shadows, annotations (fade in) ══ */}
        <Animated.View style={{ opacity: finish, position: 'absolute' }}>
          <Svg width={W} height={270} viewBox="0 0 420 240">
            {/* Left tree — multi-layer canopy */}
            <Path d="M40 195 L39 148 Q40 146 41 148" stroke={L} strokeWidth="0.7" fill="none" strokeLinecap="round" />
            <Path d="M26 168 Q30 148 40 138 Q50 148 54 168" stroke={S} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <Path d="M30 162 Q35 145 40 136 Q45 145 50 162" stroke={L} strokeWidth="0.5" fill="none" />
            <Path d="M22 172 Q32 152 40 140 Q48 152 58 172" stroke={G2} strokeWidth="0.4" fill="none" />

            {/* Right tree */}
            <Path d="M380 195 L379 142 Q380 140 381 142" stroke={L} strokeWidth="0.7" fill="none" strokeLinecap="round" />
            <Path d="M364 160 Q370 138 380 128 Q390 138 396 160" stroke={S} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <Path d="M368 155 Q374 140 380 130 Q386 140 392 155" stroke={L} strokeWidth="0.5" fill="none" />
            <Path d="M370 165 Q376 148 380 135 Q384 148 390 165" stroke={G2} strokeWidth="0.4" fill="none" />

            {/* Bushes */}
            <Path d="M52 192 Q56 184 60 192 Q64 185 68 192 Q72 186 76 192" stroke={L} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            <Path d="M344 192 Q348 184 352 192 Q356 185 360 192 Q364 186 368 192" stroke={L} strokeWidth="0.5" fill="none" strokeLinecap="round" />

            {/* Right wall shadow hatching */}
            {Array.from({length: 12}, (_, i) => (
              <Line key={`rs${i}`} x1={337} y1={78 + i * 8} x2={343} y2={83 + i * 8} stroke={G2} strokeWidth="0.3" />
            ))}

            {/* Under-porch shadow */}
            {Array.from({length: 15}, (_, i) => (
              <Line key={`ps${i}`} x1={112 + i * 13} y1={126} x2={115 + i * 13} y2={130} stroke={G2} strokeWidth="0.3" />
            ))}

            {/* Under-roof shadow */}
            {Array.from({length: 20}, (_, i) => (
              <Line key={`us${i}`} x1={82 + i * 13} y1={76} x2={85 + i * 13} y2={80} stroke={G2} strokeWidth="0.25" />
            ))}

            {/* Dimension annotations */}
            <G opacity={0.1}>
              <Line x1="65" y1="215" x2="355" y2="215" stroke={S} strokeWidth="0.5" />
              <Line x1="65" y1="212" x2="65" y2="218" stroke={S} strokeWidth="0.5" />
              <Line x1="355" y1="212" x2="355" y2="218" stroke={S} strokeWidth="0.5" />
              <Line x1="210" y1="212" x2="210" y2="218" stroke={S} strokeWidth="0.4" />
              <Line x1="10" y1="55" x2="10" y2="195" stroke={S} strokeWidth="0.5" />
              <Line x1="7" y1="55" x2="13" y2="55" stroke={S} strokeWidth="0.5" />
              <Line x1="7" y1="195" x2="13" y2="195" stroke={S} strokeWidth="0.5" />
              <Line x1="7" y1="130" x2="13" y2="130" stroke={S} strokeWidth="0.4" />
            </G>

            {/* Construction crosses */}
            <G opacity={0.08}>
              <Path d="M62 185 L68 185 M65 182 L65 188" stroke={S} strokeWidth="0.5" />
              <Path d="M352 185 L358 185 M355 182 L355 188" stroke={S} strokeWidth="0.5" />
              <Path d="M208 52 L212 52 M210 50 L210 54" stroke={A} strokeWidth="0.5" />
            </G>
          </Svg>
        </Animated.View>

        {/* Subtle gold glow pulse */}
        <AnimatedPath
          d="M65 185 L64 145 L85 144 L84 130 L95 130 L94 75 L324 75 L325 130 L335 130 L335 144 L354 145 L355 185"
          stroke="rgba(251,191,36,0.04)"
          strokeWidth={glow.interpolate({ inputRange: [0, 1], outputRange: [0, 5] })}
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
