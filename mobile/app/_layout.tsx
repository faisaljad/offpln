import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { toastConfig } from '../components/ToastConfig';
import { useAuthStore } from '../store/auth';
import { api } from '../services/api';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0284c7',
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenData.data;
  } catch {
    return null;
  }
}

export default function RootLayout() {
  const loadAuth = useAuthStore((s) => s.loadAuth);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    loadAuth();
  }, []);

  // Register push token when user is logged in
  useEffect(() => {
    if (!user) return;

    registerForPushNotifications().then((token) => {
      if (token) {
        api.registerPushToken(token).catch(() => {});
      }
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Could update badge count here
    });

    // Listen for user tapping on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.propertyId) {
        router.push(`/property/${data.propertyId}`);
      } else if (data?.investmentId) {
        router.push(`/investment/${data.investmentId}`);
      } else if (data?.transferId) {
        router.push(`/transfer/${data.transferId}`);
      } else {
        router.push('/notifications');
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user]);

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
