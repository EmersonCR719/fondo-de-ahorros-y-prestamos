import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, TextInput, Button, Text, Checkbox } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../supabase';

export default function Register({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [rol, setRol] = useState('cliente'); // valor por defecto
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Validar mayoría de edad y fecha no futura
  const esMayorDeEdad = (fecha) => {
    const hoy = new Date();
    const nacimiento = new Date(fecha);

    // Verificar que la fecha no sea futura
    if (nacimiento > hoy) {
      return false;
    }

    const edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    return (
      edad > 18 || (edad === 18 && mes >= 0 && hoy.getDate() >= nacimiento.getDate())
    );
  };

  const handleRegister = async () => {
    if (!usuario.trim() || !correo.trim() || !contraseña.trim() || !fechaNacimiento.trim()) {
      setMensaje('Por favor completa todos los campos.');
      return;
    }

    if (!aceptaTerminos) {
      setMensaje('Debes aceptar los Términos y Condiciones para registrarte.');
      return;
    }

    if (!esMayorDeEdad(fechaNacimiento)) {
      const nacimiento = new Date(fechaNacimiento);
      const hoy = new Date();
      if (nacimiento > hoy) {
        setMensaje('La fecha de nacimiento no puede ser futura.');
      } else {
        setMensaje('Debes ser mayor de 18 años para registrarte.');
      }
      return;
    }

    // Verificar si ya existe el correo
    const { data: existente, error: errorCheck } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', correo)
      .maybeSingle();

    if (errorCheck) {
      setMensaje(`Error verificando usuario: ${errorCheck.message}`);
      return;
    }

    if (existente) {
      setMensaje('Este correo ya está registrado.');
      return;
    }

    // Insertar en la tabla usuarios
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          nombre: usuario,
          email: correo,
          password: contraseña, // sin encriptar por ahora
          rol: rol,
          fecha_nacimiento: fechaNacimiento,
          acepta_terminos: true, // se guarda aceptación
          created_at: new Date(),
        },
      ])
      .select()
      .single();

    if (error) {
      setMensaje(`Error: ${error.message}`);
    } else {
      setMensaje('Registro exitoso. Ya puedes iniciar sesión.');
      setUsuario('');
      setCorreo('');
      setContraseña('');
      setFechaNacimiento('');
      setRol('cliente');
      setAceptaTerminos(false);
      console.log('Nuevo usuario:', data);
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
      <TextInput
        label="Fecha de nacimiento (YYYY-MM-DD)"
        value={fechaNacimiento}
        onChangeText={setFechaNacimiento}
        placeholder="Ejemplo: 2000-05-20"
        style={styles.input}
      />

      <Text style={styles.label}>Selecciona tu rol</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={rol}
          onValueChange={(itemValue) => setRol(itemValue)}
        >
          <Picker.Item label="Cliente" value="cliente" />
          <Picker.Item label="Asociado" value="asociado" />
        </Picker>
      </View>

      {/* Checkbox de Términos y Condiciones */}
      <View style={styles.checkboxContainer}>
        <Checkbox
          status={aceptaTerminos ? 'checked' : 'unchecked'}
          onPress={() => setAceptaTerminos(!aceptaTerminos)}
          color="#00C853"
        />
        <TouchableOpacity onPress={() => navigation.navigate('TermsAndConditions', {
          onAccept: () => setAceptaTerminos(true)
        })}>
          <Text style={styles.checkboxText}>
            Acepto los <Text style={styles.linkBold}>Términos y Condiciones</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Button
        mode="contained"
        onPress={handleRegister}
        style={styles.button}
      >
        Registrarme
      </Button>

      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

      {/* Link para iniciar sesión */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>
          ¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  input: { marginBottom: 12 },
  button: { marginTop: 10 },
  mensaje: { marginTop: 15, textAlign: 'center', color: 'blue' },
  link: { marginTop: 20, textAlign: 'center', color: '#333' },
  linkBold: { color: '#00C853', fontWeight: 'bold' },
  label: { marginTop: 10, marginBottom: 5, fontWeight: 'bold' },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxText: {
    fontSize: 15,
    color: '#333',
  },
});
