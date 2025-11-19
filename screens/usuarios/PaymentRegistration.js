import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider, FAB, Portal, Modal } from 'react-native-paper';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';

export default function PaymentRegistration({ navigation }) {
  const { user } = useAuth();
  const [myLoans, setMyLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form fields for payment registration
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadMyLoans();
    loadMyPayments();
  }, []);

  const loadMyLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('prestamos')
        .select('*')
        .eq('usuario_id', user.id)
        .in('estado', ['aprobado', 'activo'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyLoans(data || []);
    } catch (error) {
      console.error('Error loading my loans:', error);
    }
  };

  const loadMyPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('abonos')
        .select(`
          *,
          prestamos (
            id,
            monto_solicitado
          )
        `)
        .eq('usuario_id', user.id)
        .order('fecha_abono', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedLoanId('');
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const validateForm = () => {
    if (!selectedLoanId) {
      Alert.alert('Error', 'Por favor selecciona un préstamo');
      return false;
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return false;
    }

    return true;
  };

  const registerPayment = async () => {
    if (!validateForm()) return;

    const amount = parseFloat(paymentAmount);
    const selectedLoan = myLoans.find(loan => loan.id.toString() === selectedLoanId);

    if (!selectedLoan) {
      Alert.alert('Error', 'Préstamo no encontrado');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('abonos')
        .insert({
          prestamo_id: selectedLoanId,
          usuario_id: user.id,
          monto_abono: amount,
          fecha_abono: paymentDate,
          metodo_pago: 'efectivo',
          created_at: new Date(),
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Pago Registrado',
        'Tu pago ha sido registrado correctamente.',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              setShowPaymentModal(false);
              loadMyPayments();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error registering payment:', error);
      Alert.alert('Error', 'No se pudo registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const getLoanInfo = (loanId) => {
    return myLoans.find(loan => loan.id === loanId);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Registro de Pagos" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Mis préstamos activos */}
        <Card style={styles.card}>
          <Card.Title title="Mis Préstamos Activos" />
          <Card.Content>
            {myLoans.length === 0 ? (
              <Text style={styles.emptyText}>No tienes préstamos activos</Text>
            ) : (
              myLoans.map((loan, index) => (
                <View key={loan.id}>
                  <List.Item
                    title={`Préstamo #${loan.id}`}
                    description={`Monto: $${loan.monto_solicitado?.toLocaleString()} - Estado: ${loan.estado}`}
                  />
                  {index < myLoans.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Historial de pagos */}
        <Card style={styles.card}>
          <Card.Title title="Historial de Pagos" />
          <Card.Content>
            {payments.length === 0 ? (
              <Text style={styles.emptyText}>No tienes pagos registrados</Text>
            ) : (
              payments.slice(0, 10).map((payment, index) => {
                const loanInfo = getLoanInfo(payment.prestamo_id);
                return (
                  <View key={payment.id}>
                    <List.Item
                      title={`Pago - $${payment.monto_abono.toLocaleString()}`}
                      description={`Préstamo #${payment.prestamo_id} - ${payment.fecha_abono}`}
                    />
                    <Text style={styles.methodText}>{payment.metodo_pago}</Text>
                    {index < payments.slice(0, 10).length - 1 && <Divider />}
                  </View>
                );
              })
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB para registrar pago */}
      {myLoans.length > 0 && (
        <FAB
          icon="cash-plus"
          onPress={() => setShowPaymentModal(true)}
          style={styles.fab}
        />
      )}

      {/* Modal para registrar pago */}
      <Portal>
        <Modal
          visible={showPaymentModal}
          onDismiss={() => setShowPaymentModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Title title="Registrar Pago" />
            <Card.Content>
              <Text style={styles.infoText}>
                Registra los pagos que has realizado a tus préstamos
              </Text>

              {/* Selector de préstamo */}
              <Text style={styles.label}>Seleccionar Préstamo</Text>
              <View style={styles.pickerContainer}>
                {myLoans.map((loan) => (
                  <Button
                    key={loan.id}
                    mode={selectedLoanId === loan.id.toString() ? "contained" : "outlined"}
                    onPress={() => setSelectedLoanId(loan.id.toString())}
                    style={styles.loanButton}
                  >
                    Préstamo #{loan.id} - ${loan.monto_solicitado?.toLocaleString()}
                  </Button>
                ))}
              </View>

              <TextInput
                label="Monto del pago ($)"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                label="Fecha del pago (YYYY-MM-DD)"
                value={paymentDate}
                onChangeText={setPaymentDate}
                placeholder="Ej: 2024-12-25"
                style={styles.input}
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    resetForm();
                    setShowPaymentModal(false);
                  }}
                  style={styles.button}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={registerPayment}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Registrar Pago
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16 },
  card: { marginBottom: 16 },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
  },
  modalCard: {
    maxHeight: '80%',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  loanButton: {
    marginBottom: 8,
  },
  input: { marginBottom: 12 },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: { flex: 1, marginHorizontal: 4 },
  methodText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
});