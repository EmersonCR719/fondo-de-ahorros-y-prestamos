/**
import 'react-native-gesture-handler'; 
import React from 'react'; 
      
import { NavigationContainer } from '@react-navigation/native'; 
import { createDrawerNavigator } from '@react-navigation/drawer'; 
import { Provider as PaperProvider } from 'react-native-paper'; 
 
import Inicio from './screens/Inicio'; 
import Login from './screens/Login'; 
import Register from './screens/Register';
import Camara from './screens/Camara';
 
const Drawer = createDrawerNavigator(); 
 
export default function App() { 
  return ( 
    <PaperProvider> 
      <NavigationContainer> 
        <Drawer.Navigator initialRouteName="Inicio"> 
          <Drawer.Screen name="Inicio" component={Inicio} /> 
          <Drawer.Screen name="Login" component={Login} /> 
          <Drawer.Screen name="Register" component={Register}/>
          <Drawer.Screen name="Camara" component={Camara}/>
        </Drawer.Navigator> 
      </NavigationContainer> 
    </PaperProvider> 
  ); 
}
*/
import 'react-native-gesture-handler';
import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';

// 📌 Screens
import Inicio from './screens/Inicio';
import Login from './screens/Login';
import Register from './screens/Register';
import Camara from './screens/Camara';

// Ahorros
import AhorrosList from './screens/ahorros/AhorrosList';
import AhorrosForm from './screens/ahorros/AhorrosForm';
import RetiroForm from './screens/ahorros/RetiroForm';

// Reportes
import ReporteAhorros from './screens/ahorros/ReporteAhorros';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

//Stack de Ahorros
function AhorrosStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AhorrosList"
        component={AhorrosList}
        options={{ title: 'Mis Ahorros' }}
      />
      <Stack.Screen
        name="AhorrosForm"
        component={AhorrosForm}
        options={{ title: 'Nuevo Ahorro' }}
      />
      <Stack.Screen
        name="AhorrosRetiro"
        component={RetiroForm}
        options={{ title: 'Programar Retiro' }}
      />
    </Stack.Navigator>
  );
}

//Navegación principal
export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Drawer.Navigator initialRouteName="Inicio">
          <Drawer.Screen name="Inicio" component={Inicio} />
          <Drawer.Screen name="Login" component={Login} />
          <Drawer.Screen name="Register" component={Register} />
          <Drawer.Screen name="Camara" component={Camara} />

          {/* Ahorros */}
          <Drawer.Screen
            name="Ahorros"
            component={AhorrosStack}
            options={{ title: 'Ahorros' }}
          />

          {/* Reportes */}
          <Drawer.Screen
            name="Reportes"
            component={ReporteAhorros}
            options={{ title: 'Reportes' }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
