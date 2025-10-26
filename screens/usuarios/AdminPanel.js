import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Appbar, Text, Button, Card } from 'react-native-paper';
import { useAuth } from '../../AuthContext';
import SavingsQuotaManager from '../admin/SavingsQuotaManager';
import ManagementFeeManager from '../admin/ManagementFeeManager';
import LoanApproval from '../admin/LoanApproval';
import InterestRateManager from '../admin/InterestRateManager';
import MeetingScheduler from '../admin/MeetingScheduler';

export default function AdminPanel({ navigation, route }) {
  const { logout } = useAuth();
  const usuario = route.params?.usuario;

  const secciones = [
    { nombre: 'Usuarios', screen: 'CrudUsuarios' },
    { nombre: 'Ahorros', screen: 'CrudAhorros' },
    { nombre: 'Préstamos', screen: 'CrudPrestamos' },
    { nombre: 'Abonos', screen: 'CrudAbonos' },
    { nombre: 'Cuotas de Ahorro', screen: 'SavingsQuotaManager' },
    { nombre: 'Cuota de Manejo', screen: 'ManagementFeeManager' },
    { nombre: 'Aprobar Préstamos', screen: 'LoanApproval' },
    { nombre: 'Tasas de Interés', screen: 'InterestRateManager' },
    { nombre: 'Programar Reuniones', screen: 'MeetingScheduler' },
  ];

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Panel de Administración" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.bienvenida}>
          Bienvenido, {usuario?.nombre || 'Administrador'}
        </Text>

        {secciones.map((item) => (
          <TouchableOpacity
            key={item.nombre}
            style={styles.cardContainer}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Card style={styles.card}>
              <Card.Title title={item.nombre} />
            </Card>
          </TouchableOpacity>
        ))}

        <Button
          mode="outlined"
          onPress={() => {
            logout();
            navigation.navigate('Inicio');
          }}
          style={styles.salir}
        >
          Cerrar sesión
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16 },
  bienvenida: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardContainer: { marginBottom: 10 },
  card: {
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    padding: 5,
  },
  salir: {
    marginTop: 30,
    borderColor: '#FF5252',
  },
});
