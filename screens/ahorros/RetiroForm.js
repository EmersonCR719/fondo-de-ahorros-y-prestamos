import React, { useState } from 'react'
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { registrarRetiro } from '../../services/ahorros'

export default function AhorrosRetiro({ navigation }) {
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaRetiro, setFechaRetiro] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [loading, setLoading] = useState(false)

  //Usuario de prueba
  const usuarioId = "ID-DE-USUARIO-DE-PRUEBA"

  const handleGuardar = async () => {
    if (!monto) {
      Alert.alert("Error", "Debes ingresar un monto")
      return
    }

    // Validar que la fecha sea al menos 1 mes después de hoy
    const hoy = new Date()
    const minFecha = new Date()
    minFecha.setMonth(hoy.getMonth() + 1)

    if (fechaRetiro < minFecha) {
      Alert.alert("Error", "La fecha de retiro debe ser al menos dentro de un mes")
      return
    }

    setLoading(true)
    try {
      await registrarRetiro(usuarioId, parseFloat(monto), descripcion, fechaRetiro)
      Alert.alert("Éxito", "Retiro programado correctamente")
      navigation.goBack()
    } catch (error) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Programar Retiro</Text>

      <Text>Monto</Text>
      <TextInput
        style={styles.input}
        value={monto}
        onChangeText={setMonto}
        keyboardType="numeric"
        placeholder="Ej: 50000"
      />

      <Text>Descripción</Text>
      <TextInput
        style={styles.input}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Ej: Retiro parcial"
      />

      <Text>Fecha de Retiro</Text>
      <Button title="Seleccionar fecha" onPress={() => setShowDatePicker(true)} />

      {showDatePicker && (
        <DateTimePicker
          value={fechaRetiro}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false)
            if (selectedDate) {
              setFechaRetiro(selectedDate)
            }
          }}
        />
      )}

      <Text style={styles.fechaText}>Seleccionada: {fechaRetiro.toLocaleDateString()}</Text>

      <Button
        title={loading ? "Guardando..." : "Programar Retiro"}
        onPress={handleGuardar}
        disabled={loading}
      />
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
  fechaText: {
    marginVertical: 10,
    fontSize: 16,
  },
})
