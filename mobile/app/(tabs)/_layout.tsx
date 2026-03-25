import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#b0b8c4',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 28 : 16,
          left: 20,
          right: 20,
          height: 70,
          borderRadius: 24,
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.85)' : '#ffffff',
          borderTopWidth: 0,
          shadowColor: '#0c4a6e',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 12,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={60}
              tint="light"
              style={{
                ...StyleSheet.absoluteFillObject,
                borderRadius: 24,
                overflow: 'hidden',
              }}
            />
          ) : (
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                borderRadius: 24,
                backgroundColor: '#ffffff',
              }}
            />
          ),
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Properties',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Ionicons
                name={focused ? 'business' : 'business-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="investments"
        options={{
          title: 'Investments',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Ionicons
                name={focused ? 'wallet' : 'wallet-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Market',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Ionicons
                name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconWrap: {
    backgroundColor: 'rgba(2,132,199,0.08)',
    borderRadius: 14,
    padding: 6,
    marginBottom: -4,
  },
});
