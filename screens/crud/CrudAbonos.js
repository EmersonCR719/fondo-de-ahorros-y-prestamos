import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider, FAB, Dialog, Portal, Chip } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';

export default function CrudAbonos({ navigation, route }) {
  const { user } = useAuth();
  const { filterUserId, filterLoanId } = route.params || {};
  const [payments, setPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (user?.rol !== 'admin') {
      Alert.alert('Acceso Denegado', 'Solo los administradores pueden acceder a esta sección');
      navigation.goBack();
      return;
    }
    loadPayments();
    loadLoans();
    loadUsers();
  }, [user, filterUserId, filterLoanId]);

  // Form fields
  const [prestamoId, setPrestamoId] = useState(filterLoanId || '');
  const [usuarioId, setUsuarioId] = useState(filterUserId || '');
  const [montoAbono, setMontoAbono] = useState('');
  const [fechaAbono, setFechaAbono] = useState(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState('transferencia');

  useEffect(() => {
    loadPayments();
    loadLoans();
    loadUsers();
  }, [filterUserId, filterLoanId]);

  const loadPayments = async () => {
    try {
      let query = supabase
        .from('abonos')
        .select(`
          *,
          prestamos (
            id,
            monto_solicitado,
            tasa_interes,
            usuarios (
              id,
              nombre,
              email
            )
          )
        `)
        .order('fecha_abono', { ascending: false });

      if (filterUserId) {
        query = query.eq('usuario_id', filterUserId);
      }

      if (filterLoanId) {
        query = query.eq('prestamo_id', filterLoanId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      Alert.alert('Error', 'No se pudieron cargar los abonos');
    } finally {
      setLoading(false);
    }
  };

  const loadLoans = async () => {
    try {
      let query = supabase
        .from('prestamos')
        .select(`
          id,
          monto_solicitado,
          estado,
          usuarios (
            id,
            nombre
          )
        `)
        .eq('estado', 'aprobado')
        .order('created_at', { ascending: false });

      if (filterUserId) {
        query = query.eq('usuario_id', filterUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error loading loans:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email')
        .order('nombre');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const resetForm = () => {
    setPrestamoId(filterLoanId || '');
    setUsuarioId(filterUserId || '');
    setMontoAbono('');
    setFechaAbono(new Date().toISOString().split('T')[0]);
    setMetodoPago('transferencia');
    setEditingPayment(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogVisible(true);
  };

  const openEditDialog = (payment) => {
    setEditingPayment(payment);
    setPrestamoId(payment.prestamo_id);
    setUsuarioId(payment.usuario_id);
    setMontoAbono(payment.monto_abono.toString());
    setFechaAbono(payment.fecha_abono);
    setMetodoPago(payment.metodo_pago || 'transferencia');
    setDialogVisible(true);
  };

  const validateForm = () => {
    if (!prestamoId || !usuarioId || !montoAbono || !fechaAbono) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return false;
    }

    const amount = parseFloat(montoAbono);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido mayor a 0');
      return false;
    }

    return true;
  };

  const savePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const paymentData = {
        prestamo_id: prestamoId,
        usuario_id: usuarioId,
        monto_abono: parseFloat(montoAbono),
        fecha_abono: fechaAbono,
        metodo_pago: metodoPago,
      };

      if (editingPayment) {
        // Update existing payment
        const { error } = await supabase
          .from('abonos')
          .update(paymentData)
          .eq('id', editingPayment.id);

        if (error) throw error;
        Alert.alert('Éxito', 'Abono actualizado correctamente');
      } else {
        // Create new payment
        const { error } = await supabase
          .from('abonos')
          .insert(paymentData);

        if (error) throw error;
        Alert.alert('Éxito', 'Abono registrado correctamente');
      }

      setDialogVisible(false);
      resetForm();
      loadPayments();
    } catch (error) {
      console.error('Error saving payment:', error);
      Alert.alert('Error', 'No se pudo guardar el abono');
    } finally {
      setLoading(false);
    }
  };

  const deletePayment = async (payment) => {
    Alert.alert(
      'Eliminar Abono',
      `¿Estás seguro de que quieres eliminar este abono de $${payment.monto_abono.toLocaleString()}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('abonos')
                .delete()
                .eq('id', payment.id);

              if (error) throw error;

              Alert.alert('Éxito', 'Abono eliminado correctamente');
              loadPayments();
            } catch (error) {
              console.error('Error deleting payment:', error);
              Alert.alert('Error', 'No se pudo eliminar el abono');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getTotalPayments = () => {
    return payments.reduce((total, payment) => total + payment.monto_abono, 0);
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'transferencia': return 'Transferencia';
      case 'efectivo': return 'Efectivo';
      case 'qr_scan': return 'Escaneo QR';
      default: return method;
    }
  };

  const getLoanInfo = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    return loan ? `Préstamo: $${loan.monto_solicitado.toLocaleString()}` : 'Préstamo desconocido';
  };

  if (loading && payments.length === 0) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={filterUserId ? "Abonos del Usuario" : "Gestión de Abonos"} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>Cargando abonos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={filterUserId ? "Abonos del Usuario" : "Gestión de Abonos"} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={[styles.summaryCard, styles.totalCard]}>
            <Card.Content>
              <Text style={styles.summaryValue}>${getTotalPayments().toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Total Abonos</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, styles.countCard]}>
            <Card.Content>
              <Text style={styles.summaryValue}>{payments.length}</Text>
              <Text style={styles.summaryLabel}>Registros</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Payments List */}
        <Card style={styles.card}>
          <Card.Title title={filterUserId ? "Historial de Abonos" : "Lista de Abonos"} />
          <Card.Content>
            {payments.length === 0 ? (
              <Text style={styles.emptyText}>
                {filterUserId ? "Este usuario no tiene abonos registrados" : "No hay abonos registrados"}
              </Text>
            ) : (
              payments.map((payment, index) => (
                <View key={payment.id}>
                  <List.Item
                    title={`$${payment.monto_abono.toLocaleString()} - ${payment.fecha_abono}`}
                    description={
                      filterUserId
                        ? `${getPaymentMethodText(payment.metodo_pago)} - ${getLoanInfo(payment.prestamo_id)}`
                        : `${payment.prestamos?.usuarios?.nombre || 'Usuario desconocido'} - ${getPaymentMethodText(payment.metodo_pago)}`
                    }
                    right={() => (
                      <View style={styles.paymentActions}>
                        <Chip style={styles.amountChip}>
                          ${payment.monto_abono.toLocaleString()}
                        </Chip>
                        <View style={styles.actionButtons}>
                          <Button
                            mode="outlined"
                            onPress={() => openEditDialog(payment)}
                            style={styles.editButton}
                            compact
                          >
                            Editar
                          </Button>
                          <Button
                            mode="outlined"
                            onPress={() => deletePayment(payment)}
                            style={[styles.deleteButton]}
                            compact
                          >
                            Eliminar
                          </Button>
                        </View>
                      </View>
                    )}
                  />
                  {index < payments.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Create/Edit Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {editingPayment ? 'Editar Abono' : 'Registrar Nuevo Abono'}
          </Dialog.Title>
          <Dialog.Content>
            {!filterUserId && (
              <>
                <Text style={styles.label}>Usuario</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={usuarioId}
                    onValueChange={(itemValue) => setUsuarioId(itemValue)}
                  >
                    <Picker.Item label="Seleccionar usuario..." value="" />
                    {users.map(user => (
                      <Picker.Item key={user.id} label={user.nombre} value={user.id} />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            {!filterLoanId && (
              <>
                <Text style={styles.label}>Préstamo</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={prestamoId}
                    onValueChange={(itemValue) => setPrestamoId(itemValue)}
                  >
                    <Picker.Item label="Seleccionar préstamo..." value="" />
                    {loans.map(loan => (
                      <Picker.Item
                        key={loan.id}
                        label={`${loan.usuarios?.nombre || 'Usuario'} - $${loan.monto_solicitado.toLocaleString()}`}
                        value={loan.id}
                      />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            <TextInput
              label="Monto del abono ($)"
              value={montoAbono}
              onChangeText={setMontoAbono}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Fecha del abono (YYYY-MM-DD)"
              value={fechaAbono}
              onChangeText={setFechaAbono}
              placeholder="Ejemplo: 2024-12-25"
              style={styles.input}
            />

            <Text style={styles.label}>Método de pago</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={metodoPago}
                onValueChange={(itemValue) => setMetodoPago(itemValue)}
              >
                <Picker.Item label="Transferencia" value="transferencia" />
                <Picker.Item label="Efectivo" value="efectivo" />
                <Picker.Item label="Escaneo QR" value="qr_scan" />
              </Picker>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
            <Button onPress={savePayment} loading={loading} disabled={loading}>
              {editingPayment ? 'Actualizar' : 'Registrar'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* FAB for creating new payment */}
      <FAB
        icon="plus"
        onPress={openCreateDialog}
        style={styles.fab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16 },
  card: { marginBottom: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: { flex: 1, marginHorizontal: 4 },
  totalCard: { backgroundColor: '#E8F5E8' },
  countCard: { backgroundColor: '#E3F2FD' },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1976D2',
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
  paymentActions: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  amountChip: {
    marginBottom: 8,
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: { marginRight: 8 },
  deleteButton: {
    borderColor: '#d32f2f',
  },
  input: { marginBottom: 12 },
  label: { marginTop: 10, marginBottom: 5, fontWeight: 'bold' },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
