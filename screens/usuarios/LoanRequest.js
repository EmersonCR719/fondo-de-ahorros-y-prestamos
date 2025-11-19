import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider } from 'react-native-paper';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../supabase';

export default function LoanRequest({ navigation }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingLoans, setExistingLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(true);

  React.useEffect(() => {
    loadExistingLoans();
  }, []);

  const loadExistingLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('prestamos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExistingLoans(data || []);
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setLoadingLoans(false);
    }
  };

  const calculateInterestRate = () => {
    return user.rol === 'asociado' ? 0.02 : 0.025; // 2% for associates, 2.5% for clients
  };

  const calculateMonthlyPayment = (principal, annualRate, months = 12) => {
    const monthlyRate = annualRate / 12;
    return principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  };

  const submitLoanRequest = async () => {
    const loanAmount = parseFloat(amount);
    if (!loanAmount || loanAmount <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return;
    }

    if (!purpose.trim()) {
      Alert.alert('Error', 'Por favor describe el propósito del préstamo');
      return;
    }

    // Check if user has any pending loan requests
    const pendingLoans = existingLoans.filter(loan => loan.estado === 'pendiente');
    if (pendingLoans.length > 0) {
      Alert.alert('Error', 'Ya tienes una solicitud de préstamo pendiente');
      return;
    }

    setLoading(true);
    try {
      const interestRate = calculateInterestRate();
      const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate);

      const { data, error } = await supabase
        .from('prestamos')
        .insert({
          usuario_id: user.id,
          monto_solicitado: loanAmount,
          tasa_interes: interestRate,
          plazo_meses: 12, // Default 12 months
          estado: 'pendiente',
          fecha_solicitud: new Date().toISOString().split('T')[0],
          created_at: new Date(),
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Solicitud Enviada',
        'Tu solicitud de préstamo ha sido enviada para revisión. Recibirás una notificación cuando sea aprobada.',
        [
          {
            text: 'OK',
            onPress: () => {
              setAmount('');
              setPurpose('');
              loadExistingLoans();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting loan request:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aprobado': return '#4CAF50';
      case 'rechazado': return '#F44336';
      case 'pendiente': return '#FF9800';
      case 'pagado': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'aprobado': return 'Aprobado';
      case 'rechazado': return 'Rechazado';
      case 'pendiente': return 'Pendiente';
      case 'pagado': return 'Pagado';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Solicitar Préstamo" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Nueva solicitud */}
        <Card style={styles.card}>
          <Card.Title title="Nueva Solicitud de Préstamo" />
          <Card.Content>
            <Text style={styles.infoText}>
              Tasa de interés: {calculateInterestRate() * 100}% anual
            </Text>

            <TextInput
              label="Monto solicitado ($)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Propósito del préstamo"
              value={purpose}
              onChangeText={setPurpose}
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            {amount && (
              <Text style={styles.calculationText}>
                Pago mensual estimado: ${calculateMonthlyPayment(parseFloat(amount), calculateInterestRate()).toFixed(2)}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={submitLoanRequest}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Enviar Solicitud
            </Button>
          </Card.Content>
        </Card>

        {/* Préstamos existentes */}
        <Card style={styles.card}>
          <Card.Title title="Mis Préstamos" />
          <Card.Content>
            {loadingLoans ? (
              <Text>Cargando préstamos...</Text>
            ) : existingLoans.length === 0 ? (
              <Text>No tienes préstamos registrados</Text>
            ) : (
              existingLoans.map((loan, index) => (
                <View key={loan.id}>
                  <List.Item
                    title={`Préstamo #${loan.id}`}
                    description={`Monto: $${loan.monto_solicitado?.toLocaleString()} - Estado: ${getStatusText(loan.estado)}`}
                    right={() => (
                      <View style={styles.statusContainer}>
                        <Text style={[styles.statusText, { color: getStatusColor(loan.estado) }]}>
                          {getStatusText(loan.estado)}
                        </Text>
                        {loan.pago_mensual && (
                          <Text style={styles.paymentText}>
                            ${loan.pago_mensual.toFixed(2)}/mes
                          </Text>
                        )}
                      </View>
                    )}
                  />
                  {index < existingLoans.length - 1 && <Divider />}
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
  input: { marginBottom: 12 },
  button: { marginTop: 16 },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  calculationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: { alignItems: 'flex-end' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  paymentText: { fontSize: 10, color: '#666', marginTop: 2 },
});