import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, Button, ActivityIndicator, StyleSheet } from 'react-native'
import { getAhorros } from '../../services/ahorros'

export default function AhorrosList({ navigation }) {
  const [ahorros, setAhorros] = useState([])
  const [loading, setLoading] = useState(true)

  //Usuario de prueba
  const usuarioId = "ID-DE-USUARIO-DE-PRUEBA"

  useEffect(() => {
    async function fetchAhorros() {
      try {
        const data = await getAhorros(usuarioId)
        setAhorros(data)
      } catch (error) {
        console.error("Error cargando ahorros:", error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAhorros()
  }, [])

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Ahorros</Text>

      {ahorros.length === 0 ? (
        <Text>No tienes registros de ahorros</Text>
      ) : (
        <FlatList
          data={ahorros}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>{item.tipo.toUpperCase()} - ${item.monto}</Text>
              <Text>{item.descripcion}</Text>
              <Text>{new Date(item.fecha).toLocaleDateString()}</Text>
            </View>
          )}
        />
      )}

      <Button
        title="Agregar Ahorro"
        onPress={() => navigation.navigate('AhorrosForm')}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  item: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },
})
