import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native'
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit'
import { obtenerAhorros, obtenerRetiros } from '../../services/ahorros'
import { useAuth } from '../../AuthContext'

export default function ReportesScreen() {
  const { user } = useAuth()
  const [ahorros, setAhorros] = useState([])
  const [retiros, setRetiros] = useState([])

  const usuarioId = user?.id

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataAhorros = await obtenerAhorros(usuarioId)
        const dataRetiros = await obtenerRetiros(usuarioId)
        setAhorros(dataAhorros)
        setRetiros(dataRetiros)
      } catch (error) {
        console.error(error)
      }
    }
    fetchData()
  }, [])

  // --- Preparar datos para gráficos ---
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

  const ahorrosPorMes = new Array(12).fill(0)
  ahorros.forEach(a => {
    const mes = new Date(a.fecha).getMonth()
    ahorrosPorMes[mes] += a.monto
  })

  const retirosPorMes = new Array(12).fill(0)
  retiros.forEach(r => {
    const mes = new Date(r.fecha_retiro).getMonth()
    retirosPorMes[mes] += r.monto
  })

  const chartConfig = {
    backgroundColor: '#1cc910',
    backgroundGradientFrom: '#eff3ff',
    backgroundGradientTo: '#efefef',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Reportes</Text>

      {/* Ahorros por mes */}
      <Text style={styles.subtitle}>Ahorros por Mes</Text>
      <BarChart
        data={{
          labels: meses,
          datasets: [{ data: ahorrosPorMes }],
        }}
        width={Dimensions.get("window").width - 16}
        height={220}
        chartConfig={chartConfig}
        style={styles.chart}
      />

      {/* Retiros por mes */}
      <Text style={styles.subtitle}>Retiros por Mes</Text>
      <LineChart
        data={{
          labels: meses,
          datasets: [{ data: retirosPorMes }],
        }}
        width={Dimensions.get("window").width - 16}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />

      {/* Comparación Ahorros vs Retiros */}
      <Text style={styles.subtitle}>Ahorros vs Retiros</Text>
      <PieChart
        data={[
          {
            name: "Ahorros",
            amount: ahorros.reduce((sum, a) => sum + a.monto, 0),
            color: "#4CAF50",
            legendFontColor: "#333",
            legendFontSize: 14,
          },
          {
            name: "Retiros",
            amount: retiros.reduce((sum, r) => sum + r.monto, 0),
            color: "#F44336",
            legendFontColor: "#333",
            legendFontSize: 14,
          },
        ]}
        width={Dimensions.get("window").width - 16}
        height={220}
        accessor="amount"
        backgroundColor="transparent"
        chartConfig={chartConfig}
        style={styles.chart}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginVertical: 12, textAlign: "center" },
  subtitle: { fontSize: 18, fontWeight: "600", marginVertical: 8 },
  chart: { marginVertical: 8, borderRadius: 16 },
})
