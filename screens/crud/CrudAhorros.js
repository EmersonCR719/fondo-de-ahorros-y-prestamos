import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider, FAB, Dialog, Portal, Chip } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';

export default function CrudAhorros({ navigation, route }) {
  const { user } = useAuth();
  const { filterUserId } = route.params || {};
  const [savings, setSavings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingSaving, setEditingSaving] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (user?.rol !== 'admin') {
      Alert.alert('Acceso Denegado', 'Solo los administradores pueden acceder a esta sección');
      navigation.goBack();
      return;
    }
    loadSavings();
    loadUsers();
  }, [user, filterUserId]);

  // Form fields
  const [usuarioId, setUsuarioId] = useState(filterUserId || '');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadSavings();
    loadUsers();
  }, [filterUserId]);

  const loadSavings = async () => {
    try {
      let query = supabase
        .from('ahorros')
        .select(`
          *,
          usuarios (
            id,
            nombre,
            email
          )
        `)
        .order('fecha', { ascending: false });

      if (filterUserId) {
        query = query.eq('usuario_id', filterUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSavings(data || []);
    } catch (error) {
      console.error('Error loading savings:', error);
      Alert.alert('Error', 'No se pudieron cargar los ahorros');
    } finally {
      setLoading(false);
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
    setUsuarioId(filterUserId || '');
    setMonto('');
    setDescripcion('');
    setFecha(new Date().toISOString().split('T')[0]);
    setEditingSaving(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogVisible(true);
  };

  const openEditDialog = (saving) => {
    setEditingSaving(saving);
    setUsuarioId(saving.usuario_id);
    setMonto(saving.monto.toString());
    setDescripcion(saving.descripcion || '');
    setFecha(saving.fecha);
    setDialogVisible(true);
  };

  const validateForm = () => {
    if (!usuarioId || !monto || !fecha) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return false;
    }

    const amount = parseFloat(monto);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido mayor a 0');
      return false;
    }

    return true;
  };

  const saveSaving = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const savingData = {
        usuario_id: usuarioId,
        monto: parseFloat(monto),
        descripcion: descripcion.trim() || null,
        fecha,
      };

      if (editingSaving) {
        // Update existing saving
        const { error } = await supabase
          .from('ahorros')
          .update(savingData)
          .eq('id', editingSaving.id);

        if (error) throw error;
        Alert.alert('Éxito', 'Ahorro actualizado correctamente');
      } else {
        // Create new saving
        savingData.created_at = new Date();
        const { error } = await supabase
          .from('ahorros')
          .insert(savingData);

        if (error) throw error;
        Alert.alert('Éxito', 'Ahorro registrado correctamente');
      }

      setDialogVisible(false);
      resetForm();
      loadSavings();
    } catch (error) {
      console.error('Error saving saving:', error);
      Alert.alert('Error', 'No se pudo guardar el ahorro');
    } finally {
      setLoading(false);
    }
  };

  const deleteSaving = async (saving) => {
    Alert.alert(
      'Eliminar Ahorro',
      `¿Estás seguro de que quieres eliminar este ahorro de $${saving.monto.toLocaleString()}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('ahorros')
                .delete()
                .eq('id', saving.id);

              if (error) throw error;

              Alert.alert('Éxito', 'Ahorro eliminado correctamente');
              loadSavings();
            } catch (error) {
              console.error('Error deleting saving:', error);
              Alert.alert('Error', 'No se pudo eliminar el ahorro');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getTotalSavings = () => {
    return savings.reduce((total, saving) => total + saving.monto, 0);
  };

  const getUserSavings = (userId) => {
    return savings
      .filter(saving => saving.usuario_id === userId)
      .reduce((total, saving) => total + saving.monto, 0);
  };

  if (loading && savings.length === 0) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={filterUserId ? "Ahorros del Usuario" : "Gestión de Ahorros"} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>Cargando ahorros...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={filterUserId ? "Ahorros del Usuario" : "Gestión de Ahorros"} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Summary Cards */}
        {!filterUserId && (
          <View style={styles.summaryContainer}>
            <Card style={[styles.summaryCard, styles.totalCard]}>
              <Card.Content>
                <Text style={styles.summaryValue}>${getTotalSavings().toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>Total Ahorros</Text>
              </Card.Content>
            </Card>

            <Card style={[styles.summaryCard, styles.countCard]}>
              <Card.Content>
                <Text style={styles.summaryValue}>{savings.length}</Text>
                <Text style={styles.summaryLabel}>Registros</Text>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Savings List */}
        <Card style={styles.card}>
          <Card.Title title={filterUserId ? "Historial de Ahorros" : "Lista de Ahorros"} />
          <Card.Content>
            {savings.length === 0 ? (
              <Text style={styles.emptyText}>
                {filterUserId ? "Este usuario no tiene ahorros registrados" : "No hay ahorros registrados"}
              </Text>
            ) : (
              savings.map((saving, index) => (
                <View key={saving.id}>
                  <List.Item
                    title={`$${saving.monto.toLocaleString()} - ${saving.fecha}`}
                    description={
                      filterUserId
                        ? (saving.descripcion || 'Sin descripción')
                        : `${saving.usuarios?.nombre || 'Usuario desconocido'} - ${saving.descripcion || 'Sin descripción'}`
                    }
                    right={() => (
                      <View style={styles.savingActions}>
                        <Chip style={styles.amountChip}>
                          ${saving.monto.toLocaleString()}
                        </Chip>
                        <View style={styles.actionButtons}>
                          <Button
                            mode="outlined"
                            onPress={() => openEditDialog(saving)}
                            style={styles.editButton}
                            compact
                          >
                            Editar
                          </Button>
                          <Button
                            mode="outlined"
                            onPress={() => deleteSaving(saving)}
                            style={[styles.deleteButton]}
                            compact
                          >
                            Eliminar
                          </Button>
                        </View>
                      </View>
                    )}
                  />
                  {index < savings.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* User Savings Summary (when not filtered) */}
        {!filterUserId && users.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Resumen por Usuario" />
            <Card.Content>
              {users.map((user, index) => {
                const userTotal = getUserSavings(user.id);
                if (userTotal === 0) return null;

                return (
                  <View key={user.id}>
                    <List.Item
                      title={user.nombre}
                      description={user.email}
                      right={() => (
                        <Chip style={styles.userTotalChip}>
                          ${userTotal.toLocaleString()}
                        </Chip>
                      )}
                    />
                    {index < users.length - 1 && <Divider />}
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Create/Edit Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {editingSaving ? 'Editar Ahorro' : 'Registrar Nuevo Ahorro'}
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

            <TextInput
              label="Monto ($)"
              value={monto}
              onChangeText={setMonto}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Descripción (opcional)"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              numberOfLines={2}
              style={styles.input}
            />

            <TextInput
              label="Fecha (YYYY-MM-DD)"
              value={fecha}
              onChangeText={setFecha}
              placeholder="Ejemplo: 2024-12-25"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
            <Button onPress={saveSaving} loading={loading} disabled={loading}>
              {editingSaving ? 'Actualizar' : 'Registrar'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* FAB for creating new saving */}
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
  savingActions: {
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
  userTotalChip: {
    backgroundColor: '#2196F3',
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
