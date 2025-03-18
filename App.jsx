// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScannerScreen from './screens/ScannerScreen';
import MQTTClientScreen from './screens/MQTTClientScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Scanner">
        <Stack.Screen 
          name="Scanner" 
          component={ScannerScreen} 
          options={{ title: 'MQTT/MQTT-WS Scanner' }} 
        />
        <Stack.Screen 
          name="MQTTClient" 
          component={MQTTClientScreen} 
          options={({ route }) => ({ title: route.params.serviceName })} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;