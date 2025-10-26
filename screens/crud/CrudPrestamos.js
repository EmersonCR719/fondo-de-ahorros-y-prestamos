import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider, FAB, Dialog, Portal, Chip } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';

export default function CrudPrestamos({ navigation, route }) {
  const { user } = useAuth();
  const { filterUserId } = route.params || {};
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (user?.rol !== 'admin') {
      Alert.alert('Acceso Denegado', 'Solo los administradores pueden acceder a esta sección');
      navigation.goBack();
      return;
    }
    loadLoans();
    loadUsers();
  }, [user, filterUserId]);

  // Form fields
  const [usuarioId, setUsuarioId] = useState(filterUserId || '');
  const [montoSolicitado, setMontoSolicitado] = useState('');
  const [tasaInteres, setTasaInteres] = useState('');
  const [proposito, setProposito] = useState('');
  const [estado, setEstado] = useState('pendiente');

  useEffect(() => {
    loadLoans();
    loadUsers();
  }, [filterUserId]);

  const loadLoans = async () => {
    try {
      let query = supabase
        .from('prestamos')
        .select(`
          *,
          usuarios (
            id,
            nombre,
            email,
            rol
          )
        `)
        .order('created_at', { ascending: false });

      if (filterUserId) {
        query = query.eq('usuario_id', filterUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error loading loans:', error);
      Alert.alert('Error', 'No se pudieron cargar los préstamos');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email, rol')
        .order('nombre');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const resetForm = () => {
    setUsuarioId(filterUserId || '');
    setMontoSolicitado('');
    setTasaInteres('');
    setProposito('');
    setEstado('pendiente');
    setEditingLoan(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogVisible(true);
  };

  const openEditDialog = (loan) => {
    setEditingLoan(loan);
    setUsuarioId(loan.usuario_id);
    setMontoSolicitado(loan.monto_solicitado.toString());
    setTasaInteres((loan.tasa_interes * 100).toString()); // Convert to percentage
    setProposito(loan.proposito || '');
    setEstado(loan.estado);
    setDialogVisible(true);
  };

  const validateForm = () => {
    if (!usuarioId || !montoSolicitado || !tasaInteres) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return false;
    }

    const amount = parseFloat(montoSolicitado);
    const rate = parseFloat(tasaInteres);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido mayor a 0');
      return false;
    }

    if (isNaN(rate) || rate <= 0 || rate > 100) {
      Alert.alert('Error', 'Por favor ingresa una tasa de interés válida (0-100%)');
      return false;
    }

    return true;
  };

  const saveLoan = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const loanData = {
        usuario_id: usuarioId,
        monto_solicitado: parseFloat(montoSolicitado),
        tasa_interes: parseFloat(tasaInteres) / 100, // Convert from percentage
        proposito: proposito.trim() || null,
        estado,
      };

      if (editingLoan) {
        // Update existing loan
        const { error } = await supabase
          .from('prestamos')
          .update(loanData)
          .eq('id', editingLoan.id);

        if (error) throw error;
        Alert.alert('Éxito', 'Préstamo actualizado correctamente');
      } else {
        // Create new loan
        loanData.created_at = new Date();
        const { error } = await supabase
          .from('prestamos')
          .insert(loanData);

        if (error) throw error;
        Alert.alert('Éxito', 'Préstamo registrado correctamente');
      }

      setDialogVisible(false);
      resetForm();
      loadLoans();
    } catch (error) {
      console.error('Error saving loan:', error);
      Alert.alert('Error', 'No se pudo guardar el préstamo');
    } finally {
      setLoading(false);
    }
  };

  const deleteLoan = async (loan) => {
    Alert.alert(
      'Eliminar Préstamo',
      `¿Estás seguro de que quieres eliminar este préstamo de $${loan.monto_solicitado.toLocaleString()}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('prestamos')
                .delete()
                .eq('id', loan.id);

              if (error) throw error;

              Alert.alert('Éxito', 'Préstamo eliminado correctamente');
              loadLoans();
            } catch (error) {
              console.error('Error deleting loan:', error);
              Alert.alert('Error', 'No se pudo eliminar el préstamo');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const approveLoan = async (loan) => {
    Alert.alert(
      'Aprobar Préstamo',
      `¿Estás seguro de que quieres aprobar este préstamo de $${loan.monto_solicitado.toLocaleString()}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('prestamos')
                .update({ estado: 'aprobado' })
                .eq('id', loan.id);

              if (error) throw error;

              Alert.alert('Éxito', 'Préstamo aprobado correctamente');
              loadLoans();
            } catch (error) {
              console.error('Error approving loan:', error);
              Alert.alert('Error', 'No se pudo aprobar el préstamo');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const rejectLoan = async (loan) => {
    Alert.alert(
      'Rechazar Préstamo',
      `¿Estás seguro de que quieres rechazar este préstamo de $${loan.monto_solicitado.toLocaleString()}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('prestamos')
                .update({ estado: 'rechazado' })
                .eq('id', loan.id);

              if (error) throw error;

              Alert.alert('Éxito', 'Préstamo rechazado');
              loadLoans();
            } catch (error) {
              console.error('Error rejecting loan:', error);
              Alert.alert('Error', 'No se pudo rechazar el préstamo');
            } finally {
              setLoading(false);
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
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'aprobado': return 'Aprobado';
      case 'rechazado': return 'Rechazado';
      case 'pendiente': return 'Pendiente';
      default: return status;
    }
  };

  const getTotalLoans = () => {
    return loans.reduce((total, loan) => total + loan.monto_solicitado, 0);
  };

  const getLoansByStatus = (status) => {
    return loans.filter(loan => loan.estado === status).length;
  };

  if (loading && loans.length === 0) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={filterUserId ? "Préstamos del Usuario" : "Gestión de Préstamos"} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>Cargando préstamos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={filterUserId ? "Préstamos del Usuario" : "Gestión de Préstamos"} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Summary Cards */}
        {!filterUserId && (
          <View style={styles.summaryContainer}>
            <Card style={[styles.summaryCard, styles.totalCard]}>
              <Card.Content>
                <Text style={styles.summaryValue}>${getTotalLoans().toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>Total Préstamos</Text>
              </Card.Content>
            </Card>

            <Card style={[styles.summaryCard, styles.approvedCard]}>
              <Card.Content>
                <Text style={styles.summaryValue}>{getLoansByStatus('aprobado')}</Text>
                <Text style={styles.summaryLabel}>Aprobados</Text>
              </Card.Content>
            </Card>

            <Card style={[styles.summaryCard, styles.pendingCard]}>
              <Card.Content>
                <Text style={styles.summaryValue}>{getLoansByStatus('pendiente')}</Text>
                <Text style={styles.summaryLabel}>Pendientes</Text>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Loans List */}
        <Card style={styles.card}>
          <Card.Title title={filterUserId ? "Historial de Préstamos" : "Lista de Préstamos"} />
          <Card.Content>
            {loans.length === 0 ? (
              <Text style={styles.emptyText}>
                {filterUserId ? "Este usuario no tiene préstamos registrados" : "No hay préstamos registrados"}
              </Text>
            ) : (
              loans.map((loan, index) => (
                <View key={loan.id}>
                  <List.Item
                    title={`$${loan.monto_solicitado.toLocaleString()} - ${(loan.tasa_interes * 100).toFixed(1)}%`}
                    description={
                      filterUserId
                        ? `${loan.proposito || 'Sin propósito'} - ${getStatusText(loan.estado)}`
                        : `${loan.usuarios?.nombre || 'Usuario desconocido'} - ${loan.proposito || 'Sin propósito'}`
                    }
                    right={() => (
                      <View style={styles.loanActions}>
                        <Chip
                          style={[styles.statusChip, { backgroundColor: getStatusColor(loan.estado) }]}
                        >
                          {getStatusText(loan.estado)}
                        </Chip>
                        <View style={styles.actionButtons}>
                          <Button
                            mode="outlined"
                            onPress={() => openEditDialog(loan)}
                            style={styles.editButton}
                            compact
                          >
                            Editar
                          </Button>
                          {loan.estado === 'pendiente' && (
                            <>
                              <Button
                                mode="outlined"
                                onPress={() => approveLoan(loan)}
                                style={styles.approveButton}
                                compact
                              >
                                Aprobar
                              </Button>
                              <Button
                                mode="outlined"
                                onPress={() => rejectLoan(loan)}
                                style={styles.rejectButton}
                                compact
                              >
                                Rechazar
                              </Button>
                            </>
                          )}
                          <Button
                            mode="outlined"
                            onPress={() => deleteLoan(loan)}
                            style={[styles.deleteButton]}
                            compact
                          >
                            Eliminar
                          </Button>
                        </View>
                      </View>
                    )}
                  />
                  {index < loans.length - 1 && <Divider />}
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
            {editingLoan ? 'Editar Préstamo' : 'Registrar Nuevo Préstamo'}
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
                      <Picker.Item key={user.id} label={`${user.nombre} (${user.rol})`} value={user.id} />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            <TextInput
              label="Monto solicitado ($)"
              value={montoSolicitado}
              onChangeText={setMontoSolicitado}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Tasa de interés (%)"
              value={tasaInteres}
              onChangeText={setTasaInteres}
              keyboardType="numeric"
              placeholder="Ejemplo: 2.5 para 2.5%"
              style={styles.input}
            />

            <TextInput
              label="Propósito (opcional)"
              value={proposito}
              onChangeText={setProposito}
              multiline
              numberOfLines={2}
              style={styles.input}
            />

            <Text style={styles.label}>Estado</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={estado}
                onValueChange={(itemValue) => setEstado(itemValue)}
              >
                <Picker.Item label="Pendiente" value="pendiente" />
                <Picker.Item label="Aprobado" value="aprobado" />
                <Picker.Item label="Rechazado" value="rechazado" />
              </Picker>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
            <Button onPress={saveLoan} loading={loading} disabled={loading}>
              {editingLoan ? 'Actualizar' : 'Registrar'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* FAB for creating new loan */}
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
  approvedCard: { backgroundColor: '#E8F5E8' },
  pendingCard: { backgroundColor: '#FFF3E0' },
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
  loanActions: {
    alignItems: 'flex-end',
    minWidth: 150,
  },
  statusChip: {
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  editButton: { marginRight: 4, marginBottom: 4 },
  approveButton: { marginRight: 4, marginBottom: 4 },
  rejectButton: {
    borderColor: '#FF9800',
    marginRight: 4,
    marginBottom: 4,
  },
  deleteButton: {
    borderColor: '#d32f2f',
    marginBottom: 4,
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
