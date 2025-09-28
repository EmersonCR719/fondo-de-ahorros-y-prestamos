import React, { useState } from 'react'
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native'
import { registrarAhorro } from '../../services/ahorros'

export default function AhorrosForm({ navigation }) {
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)

  //Usuario de prueba
  const usuarioId = "ID-DE-USUARIO-DE-PRUEBA"

  const handleGuardar = async () => {
    if (!monto) {
      Alert.alert("Error", "Debes ingresar un monto")
      return
    }

    setLoading(true)
    try {
      await registrarAhorro(usuarioId, parseFloat(monto), descripcion, null) // firma = null por ahora
      Alert.alert("Éxito", "Ahorro registrado correctamente")
      navigation.goBack() // vuelve a la lista
    } catch (error) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo Ahorro</Text>

      <Text>Monto</Text>
      <TextInput
        style={styles.input}
        value={monto}
        onChangeText={setMonto}
        keyboardType="numeric"
        placeholder="Ej: 100000"
      />

      <Text>Descripción</Text>
      <TextInput
        style={styles.input}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Ej: Ahorro mensual"
      />

      <Button title={loading ? "Guardando..." : "Guardar"} onPress={handleGuardar} disabled={loading} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
})
