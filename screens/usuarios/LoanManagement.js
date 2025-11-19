import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider, FAB, Portal, Modal } from 'react-native-paper';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';

export default function LoanManagement({ navigation }) {
  const { user } = useAuth();
  const [myLoans, setMyLoans] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCoSignerModal, setShowCoSignerModal] = useState(false);
  const [registering, setRegistering] = useState(null);

  // Form fields for loan request
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    loadMyLoans();
    loadPendingLoans();
  }, []);

  const loadMyLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('prestamos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyLoans(data || []);
    } catch (error) {
      console.error('Error loading my loans:', error);
    }
  };

  const loadPendingLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('prestamos')
        .select(`
          *,
          usuarios (
            nombre,
            email
          )
        `)
        .eq('estado', 'pendiente')
        .neq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingLoans(data || []);
    } catch (error) {
      console.error('Error loading pending loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setPurpose('');
  };

  const validateForm = () => {
    const loanAmount = parseFloat(amount);
    if (!loanAmount || loanAmount <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return false;
    }

    if (!purpose.trim()) {
      Alert.alert('Error', 'Por favor describe el propósito del préstamo');
      return false;
    }

    return true;
  };

  const submitLoanRequest = async () => {
    if (!validateForm()) return;

    const loanAmount = parseFloat(amount);

    // Check if user has any pending loan requests
    const pendingLoans = myLoans.filter(loan => loan.estado === 'pendiente');
    if (pendingLoans.length > 0) {
      Alert.alert('Error', 'Ya tienes una solicitud de préstamo pendiente');
      return;
    }

    setLoading(true);
    try {
      const interestRate = user.rol === 'asociado' ? 0.02 : 0.025;

      const { data, error } = await supabase
        .from('prestamos')
        .insert({
          usuario_id: user.id,
          monto_solicitado: loanAmount,
          tasa_interes: interestRate,
          plazo_meses: 12,
          estado: 'pendiente',
          fecha_solicitud: new Date().toISOString().split('T')[0],
          created_at: new Date(),
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Solicitud Enviada',
        'Tu solicitud de préstamo ha sido enviada para revisión.',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              setShowRequestModal(false);
              loadMyLoans();
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

  const approveAsCoSigner = async (loanId) => {
    Alert.alert(
      'Confirmar Codeudor',
      '¿Estás seguro de que quieres ser codeudor solidario de este préstamo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('prestamos')
                .update({
                  estado: 'aprobado',
                  fecha_aprobacion: new Date().toISOString().split('T')[0],
                  updated_at: new Date(),
                })
                .eq('id', loanId);

              if (error) throw error;

              Alert.alert('Éxito', 'Has sido registrado como codeudor solidario');
              loadPendingLoans();
            } catch (error) {
              console.error('Error approving as co-signer:', error);
              Alert.alert('Error', 'No se pudo registrar como codeudor');
            }
          },
        },
      ]
    );
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
        <Appbar.Content title="Gestión de Préstamos" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Mis préstamos */}
        <Card style={styles.card}>
          <Card.Title title="Mis Préstamos" />
          <Card.Content>
            {myLoans.length === 0 ? (
              <Text style={styles.emptyText}>No tienes préstamos registrados</Text>
            ) : (
              myLoans.map((loan, index) => (
                <View key={loan.id}>
                  <List.Item
                    title={`Préstamo #${loan.id}`}
                    description={`Monto: $${loan.monto_solicitado?.toLocaleString()}`}
                    right={() => (
                      <View style={styles.statusContainer}>
                        <Text style={[styles.statusText, { color: getStatusColor(loan.estado) }]}>
                          {getStatusText(loan.estado)}
                        </Text>
                      </View>
                    )}
                  />
                  {index < myLoans.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Solicitudes pendientes para codeudor */}
        {user.rol === 'asociado' && (
          <Card style={styles.card}>
            <Card.Title title="Solicitudes Pendientes (Codeudor)" />
            <Card.Content>
              {pendingLoans.length === 0 ? (
                <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
              ) : (
                pendingLoans.map((loan, index) => (
                  <View key={loan.id}>
                    <List.Item
                      title={`Solicitud de ${loan.usuarios?.nombre || 'Usuario'}`}
                      description={`Monto: $${loan.monto_solicitado?.toLocaleString()}`}
                      right={() => (
                        <View style={styles.buttonContainer}>
                          <Button
                            mode="contained"
                            onPress={() => approveAsCoSigner(loan.id)}
                            style={styles.approveButton}
                            compact
                          >
                            Aceptar
                          </Button>
                        </View>
                      )}
                    />
                    {loan.proposito && (
                      <Text style={styles.purposeText} numberOfLines={1}>
                        Propósito: {loan.proposito}
                      </Text>
                    )}
                    {index < pendingLoans.length - 1 && <Divider />}
                  </View>
                ))
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* FAB para solicitar préstamo */}
      <FAB
        icon="plus"
        onPress={() => setShowRequestModal(true)}
        style={styles.fab}
      />

      {/* Modal para solicitar préstamo */}
      <Portal>
        <Modal
          visible={showRequestModal}
          onDismiss={() => setShowRequestModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Title title="Solicitar Préstamo" />
            <Card.Content>
              <Text style={styles.infoText}>
                Tasa de interés: {user.rol === 'asociado' ? '2%' : '2.5%'} anual
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
                  Pago mensual estimado: ${(parseFloat(amount) * (user.rol === 'asociado' ? 0.02 : 0.025) / 12).toFixed(2)}
                </Text>
              )}

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    resetForm();
                    setShowRequestModal(false);
                  }}
                  style={styles.button}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={submitLoanRequest}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Solicitar
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
  statusContainer: { alignItems: 'flex-end', minWidth: 80 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  buttonContainer: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  approveButton: {
    marginVertical: 4,
  },
  purposeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
    fontStyle: 'italic',
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
  input: { marginBottom: 12 },
  calculationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: { flex: 1, marginHorizontal: 4 },
});