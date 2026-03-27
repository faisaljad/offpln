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
  const sketch1 = useRef(new Animated.Value(2000)).current;
  const sketch2 = useRef(new Animated.Value(1500)).current;
  const sketch3 = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(sketch1, { toValue: 0, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(sketch2, { toValue: 0, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(sketch3, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: false }),
    ]).start(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])).start();
    });
  }, []);

  const W = width * 0.92;
  // Sketch palette — pencil on paper feel
  const PEN = 'rgba(226,232,240,0.6)';
  const PEN2 = 'rgba(226,232,240,0.35)';
  const GOLD = 'rgba(251,191,36,0.55)';
  const FAINT = 'rgba(203,213,225,0.18)';

  return (
    <View style={{ width: W, height: 250, alignItems: 'center', marginBottom: 36 }}>
      <Svg width={W} height={250} viewBox="0 0 380 210">

        {/* ═══ SKETCH 1: Main form — hand-drawn feel with slight wobble via curves ═══ */}

        {/* Ground — loose sketch line, slightly uneven */}
        <AnimatedPath d="M15 182 Q90 181 180 182 Q270 183 365 181" stroke={PEN2} strokeWidth="0.7" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={sketch1} />
        {/* Ground second pass — sketchy overlap */}
        <AnimatedPath d="M20 183 Q180 180 360 183" stroke={FAINT} strokeWidth="0.5" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={sketch1} />

        {/* Foundation — slightly wobbly horizontal */}
        <AnimatedPath d="M62 182 L62 174 Q180 173 298 174 L298 182" stroke={PEN} strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2000" strokeDashoffset={sketch1} />

        {/* Main body walls — hand-drawn, corners slightly overshooting */}
        <AnimatedPath d="M97 174 L96 96 Q97 94 98 96 L262 95 Q264 94 263 96 L263 174" stroke={PEN} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2000" strokeDashoffset={sketch1} />
        {/* Redraw main walls — sketch overlap for depth */}
        <AnimatedPath d="M98 173 L97 97 M262 97 L262 173" stroke={FAINT} strokeWidth="0.6" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={sketch1} />

        {/* Left wing */}
        <AnimatedPath d="M62 174 L61 127 Q62 126 63 127 L97 126" stroke={PEN} strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2000" strokeDashoffset={sketch1} />

        {/* Right wing */}
        <AnimatedPath d="M263 126 L298 127 Q299 126 298 128 L298 174" stroke={PEN} strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2000" strokeDashoffset={sketch1} />

        {/* Shadow hatching under foundation */}
        <AnimatedPath d="M70 177 L80 180 M90 177 L100 180 M110 177 L120 180 M130 177 L140 180 M150 177 L160 180 M170 177 L180 180 M190 177 L200 180 M210 177 L220 180 M230 177 L240 180 M250 177 L260 180 M270 177 L280 180 M285 177 L290 180" stroke={FAINT} strokeWidth="0.4" fill="none" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset={sketch1} />


        {/* ═══ SKETCH 2: Roof + entrance + details ═══ */}

        {/* Main roof — confident pencil strokes */}
        <AnimatedPath d="M88 96 Q130 72 180 56 Q230 72 272 96" stroke={GOLD} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1500" strokeDashoffset={sketch2} />
        {/* Roof second pass */}
        <AnimatedPath d="M90 97 L180 57 L270 97" stroke="rgba(251,191,36,0.25)" strokeWidth="0.7" fill="none" strokeLinecap="round" strokeDasharray="1500" strokeDashoffset={sketch2} />

        {/* Left wing roof */}
        <AnimatedPath d="M54 127 Q68 113 80 108 Q92 113 105 127" stroke={GOLD} strokeWidth="1.1" fill="none" strokeLinecap="round" strokeDasharray="1500" strokeDashoffset={sketch2} />

        {/* Right wing roof */}
        <AnimatedPath d="M255 127 Q268 113 280 108 Q292 113 305 127" stroke={GOLD} strokeWidth="1.1" fill="none" strokeLinecap="round" strokeDasharray="1500" strokeDashoffset={sketch2} />

        {/* Roof hatching — sketch shading */}
        <AnimatedPath d="M120 82 L125 88 M140 74 L145 80 M160 66 L165 72 M195 66 L200 72 M215 74 L220 80 M235 82 L240 88" stroke="rgba(251,191,36,0.15)" strokeWidth="0.5" fill="none" strokeLinecap="round" strokeDasharray="1500" strokeDashoffset={sketch2} />

        {/* Entrance columns */}
        <AnimatedPath d="M160 174 L159 106 Q160 104 161 106" stroke={PEN} strokeWidth="0.9" fill="none" strokeLinecap="round" strokeDasharray="1500" strokeDashoffset={sketch2} />
        <AnimatedPath d="M200 174 L200 106 Q201 104 201 106" stroke={PEN} strokeWidth="0.9" fill="none" strokeLinecap="round" strokeDasharray="1500" strokeDashoffset={sketch2} />

        {/* Entrance arch */}
        <AnimatedPath d="M157 106 Q180 92 203 106" stroke={GOLD} strokeWidth="0.9" fill="none" strokeLinecap="round" strokeDasharray="1500" strokeDashoffset={sketch2} />

        {/* Floor division line */}
        <AnimatedPath d="M98 140 Q180 139 262 140" stroke={FAINT} strokeWidth="0.5" fill="none" strokeLinecap="round" strokeDasharray="1500" strokeDashoffset={sketch2} />


        {/* ═══ SKETCH 3: Windows, door, landscaping (fade in) ═══ */}
        <Animated.View style={{ opacity: sketch3, position: 'absolute' }}>
          <Svg width={W} height={250} viewBox="0 0 380 210">

            {/* Upper windows — slightly imperfect rectangles */}
            {[110, 132, 226, 248].map((x, i) => (
              <G key={`u${i}`}>
                <Path d={`M${x} 104 L${x + 15} 104 L${x + 15} 122 L${x} 122 Z`} stroke={PEN} strokeWidth="0.7" fill="none" strokeLinecap="round" />
                <Line x1={x + 7} y1={104} x2={x + 8} y2={122} stroke={PEN2} strokeWidth="0.4" />
                <Line x1={x} y1={113} x2={x + 15} y2={113} stroke={PEN2} strokeWidth="0.4" />
              </G>
            ))}

            {/* Lower windows */}
            {[110, 132, 226, 248].map((x, i) => (
              <G key={`l${i}`}>
                <Path d={`M${x} 148 L${x + 15} 148 L${x + 15} 168 L${x} 168 Z`} stroke={PEN} strokeWidth="0.7" fill="none" strokeLinecap="round" />
                <Line x1={x + 7} y1={148} x2={x + 8} y2={168} stroke={PEN2} strokeWidth="0.4" />
              </G>
            ))}

            {/* Wing windows */}
            <Path d="M68 140 L82 140 L82 158 L68 158 Z" stroke={PEN} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <Path d="M278 140 L292 140 L292 158 L278 158 Z" stroke={PEN} strokeWidth="0.6" fill="none" strokeLinecap="round" />

            {/* Door — arched */}
            <Path d="M172 174 L172 148 Q180 138 188 148 L188 174" stroke={GOLD} strokeWidth="0.9" fill="none" strokeLinecap="round" />
            <Circle cx="185" cy="162" r="1" stroke={GOLD} strokeWidth="0.6" fill="none" />

            {/* Steps — loose lines */}
            <Path d="M168 175 Q180 174 192 175" stroke={PEN2} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            <Path d="M165 178 Q180 177 195 178" stroke={PEN2} strokeWidth="0.4" fill="none" strokeLinecap="round" />
            <Path d="M162 181 Q180 180 198 181" stroke={FAINT} strokeWidth="0.4" fill="none" strokeLinecap="round" />

            {/* Garage */}
            <Path d="M230 150 L260 150 L260 174 L230 174 Z" stroke={PEN2} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <Line x1="232" y1="156" x2="258" y2="156" stroke={FAINT} strokeWidth="0.4" />
            <Line x1="232" y1="162" x2="258" y2="162" stroke={FAINT} strokeWidth="0.4" />
            <Line x1="232" y1="168" x2="258" y2="168" stroke={FAINT} strokeWidth="0.4" />

            {/* Left tree — loose sketch */}
            <Path d="M38 182 L37 158 Q36 156 38 155" stroke={PEN2} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <Path d="M28 160 Q32 148 38 144 Q44 148 48 160 Q43 155 38 152 Q33 155 28 160" stroke={PEN2} strokeWidth="0.6" fill="none" strokeLinecap="round" />

            {/* Right tree */}
            <Path d="M342 182 L341 158 Q342 156 343 155" stroke={PEN2} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <Path d="M332 160 Q336 148 342 144 Q348 148 352 160 Q347 155 342 152 Q337 155 332 160" stroke={PEN2} strokeWidth="0.6" fill="none" strokeLinecap="round" />

            {/* Shadow hatching on right wall */}
            <Path d="M264 100 L268 108 M264 112 L268 120 M264 124 L268 132 M264 136 L268 144 M264 148 L268 156 M264 160 L268 168" stroke={FAINT} strokeWidth="0.3" fill="none" strokeLinecap="round" />

            {/* Shadow hatching under roof */}
            <Path d="M100 97 L105 100 M120 97 L125 100 M140 97 L145 100 M220 97 L225 100 M240 97 L245 100 M255 97 L260 100" stroke={FAINT} strokeWidth="0.3" fill="none" strokeLinecap="round" />

            {/* Construction marks — small crosses */}
            <G opacity={0.15}>
              <Path d="M58 174 L66 174 M62 170 L62 178" stroke={PEN} strokeWidth="0.5" />
              <Path d="M294 174 L302 174 M298 170 L298 178" stroke={PEN} strokeWidth="0.5" />
              <Path d="M177 54 L183 54 M180 51 L180 57" stroke={GOLD} strokeWidth="0.5" />
            </G>

            {/* Ground texture — scattered dots */}
            {[45, 75, 120, 155, 205, 245, 290, 320, 350].map(x => (
              <Circle key={`d${x}`} cx={x} cy={184 + (x % 3)} r="0.5" fill={FAINT} />
            ))}
          </Svg>
        </Animated.View>

        {/* Subtle gold glow on structure outline */}
        <AnimatedPath
          d="M62 174 L61 127 L97 126 L96 96 L262 95 L263 126 L298 127 L298 174"
          stroke="rgba(251,191,36,0.06)"
          strokeWidth={glow.interpolate({ inputRange: [0, 1], outputRange: [0, 5] })}
          strokeLinecap="round" strokeLinejoin="round"
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
