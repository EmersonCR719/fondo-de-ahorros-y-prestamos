import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider, FAB, Dialog, Portal, Chip } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';

export default function CrudUsuarios({ navigation }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (user?.rol !== 'admin') {
      Alert.alert('Acceso Denegado', 'Solo los administradores pueden acceder a esta sección');
      navigation.goBack();
      return;
    }
    loadUsers();
  }, [user]);

  // Form fields
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [rol, setRol] = useState('cliente');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNombre('');
    setEmail('');
    setPassword('');
    setFechaNacimiento('');
    setRol('cliente');
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogVisible(true);
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setNombre(user.nombre);
    setEmail(user.email);
    setPassword(''); // Don't show existing password
    setFechaNacimiento(user.fecha_nacimiento);
    setRol(user.rol);
    setDialogVisible(true);
  };

  const validateForm = () => {
    if (!nombre.trim() || !email.trim() || !fechaNacimiento) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return false;
    }

    if (!editingUser && !password.trim()) {
      Alert.alert('Error', 'La contraseña es obligatoria para nuevos usuarios');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return false;
    }

    return true;
  };

  const saveUser = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        nombre: nombre.trim(),
        email: email.trim(),
        fecha_nacimiento: fechaNacimiento,
        rol,
        acepta_terminos: true,
      };

      if (password.trim()) {
        userData.password_hash = password.trim();
      }

      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('usuarios')
          .update(userData)
          .eq('id', editingUser.id);

        if (error) throw error;
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
      } else {
        // Create new user
        userData.created_at = new Date();
        const { error } = await supabase
          .from('usuarios')
          .insert(userData);

        if (error) throw error;
        Alert.alert('Éxito', 'Usuario creado correctamente');
      }

      setDialogVisible(false);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Error', 'No se pudo guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (user) => {
    Alert.alert(
      'Eliminar Usuario',
      `¿Estás seguro de que quieres eliminar a ${user.nombre}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('usuarios')
                .delete()
                .eq('id', user.id);

              if (error) throw error;

              Alert.alert('Éxito', 'Usuario eliminado correctamente');
              loadUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#F44336';
      case 'asociado': return '#4CAF50';
      case 'cliente': return '#2196F3';
      default: return '#666';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'asociado': return 'Asociado';
      case 'cliente': return 'Cliente';
      default: return role;
    }
  };

  if (loading && users.length === 0) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Gestión de Usuarios" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>Cargando usuarios...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Gestión de Usuarios" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={[styles.summaryCard, styles.totalCard]}>
            <Card.Content>
              <Text style={styles.summaryValue}>{users.length}</Text>
              <Text style={styles.summaryLabel}>Total Usuarios</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, styles.associatesCard]}>
            <Card.Content>
              <Text style={styles.summaryValue}>
                {users.filter(u => u.rol === 'asociado').length}
              </Text>
              <Text style={styles.summaryLabel}>Asociados</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, styles.clientsCard]}>
            <Card.Content>
              <Text style={styles.summaryValue}>
                {users.filter(u => u.rol === 'cliente').length}
              </Text>
              <Text style={styles.summaryLabel}>Clientes</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Users List */}
        <Card style={styles.card}>
          <Card.Title title="Lista de Usuarios" />
          <Card.Content>
            {users.length === 0 ? (
              <Text style={styles.emptyText}>No hay usuarios registrados</Text>
            ) : (
              users.map((user, index) => (
                <View key={user.id}>
                  <List.Item
                    title={user.nombre}
                    description={user.email}
                    right={() => (
                      <View style={styles.userActions}>
                        <Chip
                          style={[styles.roleChip, { backgroundColor: getRoleColor(user.rol) }]}
                          textStyle={{ color: 'white' }}
                        >
                          {getRoleText(user.rol)}
                        </Chip>
                        <View style={styles.actionButtons}>
                          <Button
                            mode="outlined"
                            onPress={() => openEditDialog(user)}
                            style={styles.editButton}
                            compact
                          >
                            Editar
                          </Button>
                          <Button
                            mode="outlined"
                            onPress={() => deleteUser(user)}
                            style={[styles.deleteButton]}
                            compact
                          >
                            Eliminar
                          </Button>
                        </View>
                      </View>
                    )}
                  />
                  {index < users.length - 1 && <Divider />}
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
            {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nombre completo"
              value={nombre}
              onChangeText={setNombre}
              style={styles.input}
            />
            <TextInput
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            {!editingUser && (
              <TextInput
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
              />
            )}
            <TextInput
              label="Fecha de nacimiento (YYYY-MM-DD)"
              value={fechaNacimiento}
              onChangeText={setFechaNacimiento}
              placeholder="Ejemplo: 1990-05-15"
              style={styles.input}
            />

            <Text style={styles.label}>Rol del usuario</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={rol}
                onValueChange={(itemValue) => setRol(itemValue)}
              >
                <Picker.Item label="Cliente" value="cliente" />
                <Picker.Item label="Asociado" value="asociado" />
                <Picker.Item label="Administrador" value="admin" />
              </Picker>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
            <Button onPress={saveUser} loading={loading} disabled={loading}>
              {editingUser ? 'Actualizar' : 'Crear'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* FAB for creating new user */}
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
  associatesCard: { backgroundColor: '#E8F5E8' },
  clientsCard: { backgroundColor: '#E3F2FD' },
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
  userActions: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  roleChip: {
    marginBottom: 8,
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
