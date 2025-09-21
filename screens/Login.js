import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, TextInput, Button, Text } from 'react-native-paper';
import { supabase } from '../supabase';

export default function Login({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleLogin = async () => {
    if (!correo.trim() || !contraseña.trim()) {
      setMensaje('Por favor completa todos los campos.');
      return;
    }

    // Intentar iniciar sesión con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contraseña,
    });

    if (error) {
      setMensaje(`Error: ${error.message}`);
    } else {
      setMensaje('¡Inicio de sesión exitoso!');
      console.log('Usuario:', data.user);   // Datos del usuario
      console.log('Sesión:', data.session); // Token de sesión (JWT)
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
          ¿No tienes cuenta? <Text style={styles.linkHighlight}>Regístrate</Text>
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
