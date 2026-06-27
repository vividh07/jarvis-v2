import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ConnectScreen from '../screens/ConnectScreen';
import ProvisioningScreen from '../screens/ProvisioningScreen';
import TabNavigator from './TabNavigator';
import { useJarvisStore } from '../store/useJarvisStore';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const connected = useJarvisStore(state => state.connected);
  const [provisioned, setProvisioned] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!connected ? (
          <>
            {!provisioned && (
              <Stack.Screen name="Provisioning">
                {() => <ProvisioningScreen onDone={() => setProvisioned(true)} />}
              </Stack.Screen>
            )}
            <Stack.Screen name="Connect" component={ConnectScreen} />
          </>
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
