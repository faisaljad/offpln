import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ToastConfig';
import { useAuthStore } from '../store/auth';

export default function RootLayout() {
  const loadAuth = useAuthStore((s) => s.loadAuth);

  useEffect(() => {
    loadAuth();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="property/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Property Details',
            headerBackTitle: 'Back',
            presentation: 'card',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
      <Toast config={toastConfig} topOffset={56} visibilityTime={3500} />
    </GestureHandlerRootView>
  );
}
