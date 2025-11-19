import 'react-native-gesture-handler';
import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from './AuthContext';

// 🧩 Screens principales
import Inicio from './screens/usuarios/Inicio';
import Login from './screens/usuarios/Login';
import Register from './screens/usuarios/Register';
import AccountSettings from './screens/usuarios/AccountSettings';
import TermsAndConditions from './screens/usuarios/TermsAndConditions';
import ProfilePhoto from './screens/usuarios/ProfilePhoto';
import MeetingManagement from './screens/usuarios/MeetingManagement';
import LoanManagement from './screens/usuarios/LoanManagement';
import PaymentRegistration from './screens/usuarios/PaymentRegistration';
import ManagementFeePayment from './screens/usuarios/ManagementFeePayment';

// 🧩 Admin CRUD screens
import CrudUsuarios from './screens/crud/CrudUsuarios';
import CrudAhorros from './screens/crud/CrudAhorros';
import CrudPrestamos from './screens/crud/CrudPrestamos';
import CrudAbonos from './screens/crud/CrudAbonos';
import SavingsQuotaManager from './screens/admin/SavingsQuotaManager';
import ManagementFeeManager from './screens/admin/ManagementFeeManager';
import LoanRequest from './screens/usuarios/LoanRequest';
import LoanApproval from './screens/admin/LoanApproval';
import InterestRateManager from './screens/admin/InterestRateManager';
import MeetingAttendance from './screens/usuarios/MeetingAttendance';
import StatementGenerator from './screens/usuarios/StatementGenerator';
import ReportsDashboard from './screens/admin/ReportsDashboard';
import QRScanner from './screens/usuarios/QRScanner';
import SignatureCapture from './screens/usuarios/SignatureCapture';

// 🧩 Pantallas de administrador (CRUD)
import AdminPanel from './screens/usuarios/AdminPanel';


// 🧩 Ahorros
import AhorrosList from './screens/ahorros/AhorrosList';
import AhorrosForm from './screens/ahorros/AhorrosForm';
import RetiroForm from './screens/ahorros/RetiroForm';

// 🧩 Reportes
import ReporteAhorros from './screens/ahorros/ReporteAhorros';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// 📦 Stack para CRUD del administrador
function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminPanel"
        component={AdminPanel}
        options={{ title: 'Panel de Administración' }}
      />
      <Stack.Screen
        name="CrudUsuarios"
        component={CrudUsuarios}
        options={{ title: 'Usuarios' }}
      />
      <Stack.Screen
        name="CrudAhorros"
        component={CrudAhorros}
        options={{ title: 'Ahorros' }}
      />
      <Stack.Screen
        name="CrudPrestamos"
        component={CrudPrestamos}
        options={{ title: 'Préstamos' }}
      />
      <Stack.Screen
        name="CrudAbonos"
        component={CrudAbonos}
        options={{ title: 'Abonos' }}
      />
    </Stack.Navigator>
  );
}

// 📦 Stack de Ahorros (para usuarios)
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

// 🧭 Navegación principal
function AppNavigator() {
  const { user } = useAuth();

  return (
    <Drawer.Navigator initialRouteName="Inicio">
      {!user && (
        <>
          <Drawer.Screen name="Inicio" component={Inicio} />
          <Drawer.Screen name="Login" component={Login} />
          <Drawer.Screen name="Register" component={Register} />
          <Drawer.Screen name="TermsAndConditions" component={TermsAndConditions} />
        </>
      )}

      {user && (
        <>
          {/* Ahorros */}
          <Drawer.Screen
            name="Ahorros"
            component={AhorrosStack}
            options={{ title: 'Ahorros' }}
          />

          {/* Préstamos */}
          <Drawer.Screen
            name="LoanManagement"
            component={LoanManagement}
            options={{ title: 'Gestión de Préstamos' }}
          />

          {/* Reuniones */}
          <Drawer.Screen
            name="MeetingManagement"
            component={MeetingManagement}
            options={{ title: 'Gestión de Reuniones' }}
          />

          {/* Registro de pagos */}
          <Drawer.Screen
            name="PaymentRegistration"
            component={PaymentRegistration}
            options={{ title: 'Registro de Pagos' }}
          />

          {/* Pago de cuota de manejo */}
          <Drawer.Screen
            name="ManagementFeePayment"
            component={ManagementFeePayment}
            options={{ title: 'Pago Cuota Manejo' }}
          />

          {/* Estados de Cuenta */}
          <Drawer.Screen
            name="StatementGenerator"
            component={StatementGenerator}
            options={{ title: 'Estado de Cuenta' }}
          />

          {/* Escáner QR */}
          <Drawer.Screen
            name="QRScanner"
            component={QRScanner}
            options={{ title: 'Escáner QR' }}
          />

          {/* Captura de Firma */}
          <Drawer.Screen
            name="SignatureCapture"
            component={SignatureCapture}
            options={{ title: 'Firma Digital' }}
          />

          {/* Reportes - Solo para admin */}
          {user.rol === 'admin' && (
            <Drawer.Screen
              name="ReportsDashboard"
              component={ReportsDashboard}
              options={{ title: 'Reportes y Estadísticas' }}
            />
          )}

          {/* Configuración de cuenta */}
          <Drawer.Screen
            name="AccountSettings"
            component={AccountSettings}
            options={{ title: 'Configuración' }}
          />

          {/* Foto de perfil */}
          <Drawer.Screen
            name="ProfilePhoto"
            component={ProfilePhoto}
            options={{ title: 'Foto de Perfil' }}
          />

          {/* Panel del Administrador - solo para admin */}
          {user.rol === 'admin' && (
            <>
              <Drawer.Screen
                name="Admin"
                component={AdminStack}
                options={{ title: 'Panel Admin' }}
              />
              <Drawer.Screen
                name="SavingsQuotaManager"
                component={SavingsQuotaManager}
                options={{ title: 'Cuotas de Ahorro' }}
              />
              <Drawer.Screen
                name="ManagementFeeManager"
                component={ManagementFeeManager}
                options={{ title: 'Cuotas de Administración' }}
              />
              <Drawer.Screen
                name="LoanApproval"
                component={LoanApproval}
                options={{ title: 'Aprobación de Préstamos' }}
              />
              <Drawer.Screen
                name="InterestRateManager"
                component={InterestRateManager}
                options={{ title: 'Tasas de Interés' }}
              />
              <Drawer.Screen
                name="MeetingScheduler"
                component={MeetingScheduler}
                options={{ title: 'Programar Reuniones' }}
              />
            </>
          )}
        </>
      )}
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
  );
}
