import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, TextInput, Button, Text } from 'react-native-paper';
import { supabase } from '../supabase';

export default function Register() {
  const [usuario, setUsuario] = useState('');
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleRegister = async () => {
    if (!usuario.trim() || !correo.trim() || !contraseña.trim()) {
      setMensaje('Por favor completa todos los campos.');
      return;
    }

    // Registrar usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: contraseña,
      options: {
        data: { usuario }, // Guardamos el nombre de usuario en metadata
      },
    });

    if (error) {
      setMensaje(`Error: ${error.message}`);
    } else {
      setMensaje('Registro exitoso. Revisa tu correo para confirmar la cuenta.');
      setUsuario('');
      setCorreo('');
      setContraseña('');
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Crear una cuenta" />
      </Appbar.Header>

      <TextInput
        label="Usuario"
        value={usuario}
        onChangeText={setUsuario}
        style={styles.input}
      />
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

      <Button mode="contained" onPress={handleRegister} style={styles.button}>
        Registrarme
      </Button>

      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  input: { marginBottom: 12 },
  button: { marginTop: 10 },
  mensaje: { marginTop: 15, textAlign: 'center', color: 'blue' },
});
