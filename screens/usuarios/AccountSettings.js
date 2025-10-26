import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Appbar, Text, Button, Card, Switch, List, Divider } from 'react-native-paper';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../supabase';

export default function AccountSettings({ navigation }) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.',
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

              logout();
              navigation.navigate('Inicio');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la cuenta');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          onPress: () => {
            logout();
            navigation.navigate('Inicio');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Configuración de cuenta" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Información del usuario */}
        <Card style={styles.card}>
          <Card.Title title="Información de la cuenta" />
          <Card.Content>
            <View style={styles.userInfo}>
              {user?.foto_perfil && (
                <Image source={{ uri: user.foto_perfil }} style={styles.profileImage} />
              )}
              <View style={styles.userDetails}>
                <Text style={styles.infoText}>Nombre: {user?.nombre || 'N/A'}</Text>
                <Text style={styles.infoText}>Email: {user?.email || 'N/A'}</Text>
                <Text style={styles.infoText}>Rol: {user?.rol || 'N/A'}</Text>
              </View>
            </View>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('ProfilePhoto')}
              style={styles.photoButton}
              icon="camera"
            >
              {user?.foto_perfil ? 'Cambiar Foto' : 'Agregar Foto'}
            </Button>
          </Card.Content>
        </Card>

        {/* Configuración */}
        <Card style={styles.card}>
          <Card.Title title="Configuración" />
          <Card.Content>
            <List.Item
              title="Notificaciones push"
              description="Recibir notificaciones de la app"
              right={() => (
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Autenticación biométrica"
              description="Usar huella o Face ID"
              right={() => (
                <Switch
                  value={biometric}
                  onValueChange={setBiometric}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Modo oscuro"
              description="Cambiar apariencia de la app"
              right={() => (
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Privacidad y seguridad */}
        <Card style={styles.card}>
          <Card.Title title="Privacidad y seguridad" />
          <Card.Content>
            <List.Item
              title="Cambiar contraseña"
              description="Actualizar tu contraseña"
              right={() => <List.Icon icon="chevron-right" />}
              onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
            />
            <Divider />
            <List.Item
              title="Datos personales"
              description="Gestionar información personal"
              right={() => <List.Icon icon="chevron-right" />}
              onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
            />
            <Divider />
            <List.Item
              title="Descargar mis datos"
              description="Obtener copia de tus datos"
              right={() => <List.Icon icon="chevron-right" />}
              onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
            />
          </Card.Content>
        </Card>

        {/* Acciones de cuenta */}
        <Card style={styles.card}>
          <Card.Title title="Acciones de cuenta" />
          <Card.Content>
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.button}
            >
              Cerrar sesión
            </Button>
            <Button
              mode="outlined"
              onPress={handleDeleteAccount}
              style={[styles.button, styles.deleteButton]}
              loading={loading}
              disabled={loading}
            >
              Eliminar cuenta
            </Button>
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
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
  deleteButton: {
    borderColor: '#d32f2f',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  photoButton: {
    marginTop: 10,
  },
});