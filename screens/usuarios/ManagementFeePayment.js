import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider } from 'react-native-paper';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';

export default function ManagementFeePayment({ navigation }) {
  const { user } = useAuth();
  const [feeAmount, setFeeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    loadCurrentConfig();
    loadPaymentHistory();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('costo_manejo_anual')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCurrentConfig(data);
        setFeeAmount(data.costo_manejo_anual?.toString() || '');
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('pagos_cuota_manejo')
        .select('*')
        .eq('usuario_id', user.id)
        .order('fecha_pago', { ascending: false });

      if (error) throw error;
      setPaymentHistory(data || []);
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('pagos_cuota_manejo')
        .select('monto')
        .eq('usuario_id', user.id)
        .gte('fecha_pago', `${currentYear}-01-01`)
        .lte('fecha_pago', `${currentYear}-12-31`);

      if (error) throw error;

      const totalPaid = data?.reduce((sum, payment) => sum + payment.monto, 0) || 0;
      const isPaid = totalPaid >= (currentConfig?.costo_manejo_anual || 0);

      return {
        isPaid,
        totalPaid,
        remaining: Math.max(0, (currentConfig?.costo_manejo_anual || 0) - totalPaid),
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      return { isPaid: false, totalPaid: 0, remaining: currentConfig?.costo_manejo_anual || 0 };
    }
  };

  const payManagementFee = async () => {
    const paymentAmount = parseFloat(feeAmount);
    if (!paymentAmount || paymentAmount <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return;
    }

    const status = await checkPaymentStatus();
    if (status.isPaid) {
      Alert.alert('Info', 'Ya has pagado la cuota de manejo para este año');
      return;
    }

    if (paymentAmount > status.remaining) {
      Alert.alert('Error', `El monto excede lo que debes pagar. Te faltan $${status.remaining.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pagos_cuota_manejo')
        .insert({
          usuario_id: user.id,
          monto: paymentAmount,
          fecha_pago: new Date().toISOString().split('T')[0],
          metodo_pago: 'efectivo',
          created_at: new Date(),
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Éxito', 'Pago registrado correctamente');
      loadPaymentHistory();
    } catch (error) {
      console.error('Error registering payment:', error);
      Alert.alert('Error', 'No se pudo registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Pago Cuota de Manejo" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Información de cuota */}
        <Card style={styles.card}>
          <Card.Title title="Cuota Anual de Manejo" />
          <Card.Content>
            <Text style={styles.feeAmount}>
              Monto anual: ${currentConfig?.costo_manejo_anual?.toLocaleString() || 'No definido'}
            </Text>
            <Text style={styles.infoText}>
              Esta cuota es obligatoria para todos los asociados y debe pagarse anualmente.
            </Text>
          </Card.Content>
        </Card>

        {/* Pago de cuota */}
        <Card style={styles.card}>
          <Card.Title title="Realizar Pago" />
          <Card.Content>
            <TextInput
              label="Monto a pagar ($)"
              value={feeAmount}
              onChangeText={setFeeAmount}
              keyboardType="numeric"
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={payManagementFee}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Pagar Cuota
            </Button>
          </Card.Content>
        </Card>

        {/* Historial de pagos */}
        <Card style={styles.card}>
          <Card.Title title="Historial de Pagos" />
          <Card.Content>
            {paymentHistory.length === 0 ? (
              <Text style={styles.emptyText}>No tienes pagos registrados</Text>
            ) : (
              paymentHistory.map((payment, index) => (
                <View key={payment.id}>
                  <List.Item
                    title={`Pago - $${payment.monto.toLocaleString()}`}
                    description={`${payment.fecha_pago} - ${payment.metodo_pago}`}
                  />
                  {index < paymentHistory.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16 },
  card: { marginBottom: 16 },
  feeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
});