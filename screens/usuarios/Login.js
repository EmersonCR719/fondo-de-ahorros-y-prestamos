import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, TextInput, Button, Text } from 'react-native-paper';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';

export default function Login({ navigation }) {
  const { login } = useAuth();
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleLogin = async () => {
    if (!correo.trim() || !contraseña.trim()) {
      setMensaje('Por favor completa todos los campos.');
      return;
    }

    // Buscar usuario en la tabla `usuarios`
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', correo)
      .single(); // trae solo un usuario

    if (error || !data) {
      setMensaje('Correo no registrado.');
      return;
    }

    // Comparar contraseña (sin encriptar, por ahora)
    if (data.password_hash === contraseña) {
      setMensaje('¡Inicio de sesión exitoso!');
      console.log('Usuario:', data);

      // Set user in auth context
      login(data);

      setTimeout(() => {
        if (data.rol === 'admin') {
          navigation.navigate('Admin', { screen: 'AdminPanel', params: { usuario: data } });
        } else {
          navigation.navigate('Ahorros', { screen: 'AhorrosList', params: { usuario: data } });
        }
      }, 1000);
    } else {
      setMensaje('Contraseña incorrecta.');
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Iniciar sesión" />
      </Appbar.Header>

      <TextInput
        label="Correo electrónico"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label="Contraseña"
        value={contraseña}
        onChangeText={setContraseña}
        secureTextEntry
        style={styles.input}
      />

      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        Iniciar sesión
      </Button>

      {/* Enlace a registro */}
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>
          ¿No tienes cuenta?{' '}
          <Text style={styles.linkHighlight}>Regístrate</Text>
        </Text>
      </TouchableOpacity>

      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  input: { marginBottom: 12 },
  button: { marginTop: 10 },
  mensaje: { marginTop: 15, textAlign: 'center', color: 'blue' },
  linkText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#333',
    fontSize: 14,
  },
  linkHighlight: {
    color: '#00C853',
    fontWeight: 'bold',
  },
});
