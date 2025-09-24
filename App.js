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