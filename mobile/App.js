import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { GestureHandlerRootView }   from 'react-native-gesture-handler';
import { SafeAreaProvider }         from 'react-native-safe-area-context';
import { StatusBar }                from 'expo-status-bar';
import { Text, View, ActivityIndicator } from 'react-native';
import { getStoredUser } from './src/services/api';

// ── Screens (inline compact versions) ────────────────────────────────────────
import LoginScreen    from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import SensorsScreen  from './src/screens/SensorsScreen';
import AIScreen       from './src/screens/AIScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const THEME = { dark: true, colors: { primary: '#10b981', background: '#06091a', card: '#080d22', text: '#e2e8f0', border: 'rgba(255,255,255,0.06)', notification: '#ef4444' } };

function TabIcon({ icon, focused }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{icon}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#080d22', borderTopColor: 'rgba(255,255,255,0.06)', paddingBottom: 4 }, tabBarActiveTintColor: '#10b981', tabBarInactiveTintColor: '#475569', tabBarLabelStyle: { fontSize: 11 } }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} /> }} />
      <Tab.Screen name="Projects"  component={ProjectsScreen}  options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🗂️" focused={focused} /> }} />
      <Tab.Screen name="Sensors"   component={SensorsScreen}   options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📡" focused={focused} /> }} />
      <Tab.Screen name="AI"        component={AIScreen}        options={{ tabBarLabel: 'AI', tabBarIcon: ({ focused }) => <TabIcon icon="🤖" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user,    setUser]    = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredUser().then(u => { setUser(u); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#06091a' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={THEME}>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
              <Stack.Screen name="Main" component={MainTabs} />
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
