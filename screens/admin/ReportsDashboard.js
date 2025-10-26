import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Appbar, Text, Card, List, Divider, Chip } from 'react-native-paper';
import { supabase } from '../../supabase';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function ReportsDashboard({ navigation }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    generateReports();
  }, [selectedPeriod]);

  const generateReports = async () => {
    try {
      const now = new Date();
      let startDate;

      switch (selectedPeriod) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = now.toISOString().split('T')[0];

      // Get savings data
      const { data: savings, error: savingsError } = await supabase
        .from('ahorros')
        .select('monto, fecha, usuarios(rol)')
        .gte('fecha', startDateStr)
        .lte('fecha', endDateStr);

      if (savingsError) throw savingsError;

      // Get loans data
      const { data: loans, error: loansError } = await supabase
        .from('prestamos')
        .select('monto_solicitado, estado, created_at, usuarios(rol)')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      if (loansError) throw loansError;

      // Get users data
      const { data: users, error: usersError } = await supabase
        .from('usuarios')
        .select('rol, created_at');

      if (usersError) throw usersError;

      // Process data for charts
      const savingsByRole = {
        asociado: savings?.filter(s => s.usuarios?.rol === 'asociado').reduce((sum, s) => sum + s.monto, 0) || 0,
        cliente: savings?.filter(s => s.usuarios?.rol === 'cliente').reduce((sum, s) => sum + s.monto, 0) || 0,
      };

      const loansByStatus = {
        aprobado: loans?.filter(l => l.estado === 'aprobado').length || 0,
        rechazado: loans?.filter(l => l.estado === 'rechazado').length || 0,
        pendiente: loans?.filter(l => l.estado === 'pendiente').length || 0,
      };

      const usersByRole = {
        asociado: users?.filter(u => u.rol === 'asociado').length || 0,
        cliente: users?.filter(u => u.rol === 'cliente').length || 0,
        admin: users?.filter(u => u.rol === 'admin').length || 0,
      };

      // Monthly savings trend (last 6 months)
      const monthlySavings = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const monthSavings = savings?.filter(s => {
          const saveDate = new Date(s.fecha);
          return saveDate >= monthStart && saveDate <= monthEnd;
        }).reduce((sum, s) => sum + s.monto, 0) || 0;

        monthlySavings.push({
          month: monthStart.toLocaleDateString('es-CO', { month: 'short' }),
          amount: monthSavings,
        });
      }

      setReportData({
        savingsByRole,
        loansByStatus,
        usersByRole,
        monthlySavings,
        totals: {
          totalSavings: savings?.reduce((sum, s) => sum + s.monto, 0) || 0,
          totalLoans: loans?.reduce((sum, l) => sum + l.monto_solicitado, 0) || 0,
          totalUsers: users?.length || 0,
        },
      });
    } catch (error) {
      console.error('Error generating reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Reportes y Estadísticas" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>Generando reportes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Reportes y Estadísticas" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Period Selector */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.periodSelector}>
              <Chip
                selected={selectedPeriod === 'month'}
                onPress={() => setSelectedPeriod('month')}
                style={styles.chip}
              >
                Este Mes
              </Chip>
              <Chip
                selected={selectedPeriod === 'quarter'}
                onPress={() => setSelectedPeriod('quarter')}
                style={styles.chip}
              >
                Este Trimestre
              </Chip>
              <Chip
                selected={selectedPeriod === 'year'}
                onPress={() => setSelectedPeriod('year')}
                style={styles.chip}
              >
                Este Año
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={[styles.summaryCard, styles.savingsCard]}>
            <Card.Content>
              <Text style={styles.summaryValue}>${reportData?.totals.totalSavings.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Ahorros Totales</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, styles.loansCard]}>
            <Card.Content>
              <Text style={styles.summaryValue}>${reportData?.totals.totalLoans.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Préstamos Otorgados</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, styles.usersCard]}>
            <Card.Content>
              <Text style={styles.summaryValue}>{reportData?.totals.totalUsers}</Text>
              <Text style={styles.summaryLabel}>Total Usuarios</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Charts */}
        {reportData?.monthlySavings && (
          <Card style={styles.card}>
            <Card.Title title="Tendencia de Ahorros (Últimos 6 meses)" />
            <Card.Content>
              <LineChart
                data={{
                  labels: reportData.monthlySavings.map(item => item.month),
                  datasets: [{
                    data: reportData.monthlySavings.map(item => item.amount),
                  }],
                }}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        )}

        {reportData?.savingsByRole && (
          <Card style={styles.card}>
            <Card.Title title="Ahorros por Tipo de Usuario" />
            <Card.Content>
              <BarChart
                data={{
                  labels: ['Asociados', 'Clientes'],
                  datasets: [{
                    data: [
                      reportData.savingsByRole.asociado,
                      reportData.savingsByRole.cliente,
                    ],
                  }],
                }}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
              />
            </Card.Content>
          </Card>
        )}

        {reportData?.loansByStatus && (
          <Card style={styles.card}>
            <Card.Title title="Estado de Solicitudes de Préstamo" />
            <Card.Content>
              <PieChart
                data={[
                  {
                    name: 'Aprobados',
                    population: reportData.loansByStatus.aprobado,
                    color: '#4CAF50',
                    legendFontColor: '#333',
                    legendFontSize: 12,
                  },
                  {
                    name: 'Pendientes',
                    population: reportData.loansByStatus.pendiente,
                    color: '#FF9800',
                    legendFontColor: '#333',
                    legendFontSize: 12,
                  },
                  {
                    name: 'Rechazados',
                    population: reportData.loansByStatus.rechazado,
                    color: '#F44336',
                    legendFontColor: '#333',
                    legendFontSize: 12,
                  },
                ]}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        )}

        {/* User Distribution */}
        {reportData?.usersByRole && (
          <Card style={styles.card}>
            <Card.Title title="Distribución de Usuarios" />
            <Card.Content>
              <List.Item
                title="Asociados"
                description={`${reportData.usersByRole.asociado} usuarios`}
                right={() => <Text style={styles.userCount}>{reportData.usersByRole.asociado}</Text>}
              />
              <Divider />
              <List.Item
                title="Clientes"
                description={`${reportData.usersByRole.cliente} usuarios`}
                right={() => <Text style={styles.userCount}>{reportData.usersByRole.cliente}</Text>}
              />
              <Divider />
              <List.Item
                title="Administradores"
                description={`${reportData.usersByRole.admin} usuarios`}
                right={() => <Text style={styles.userCount}>{reportData.usersByRole.admin}</Text>}
              />
            </Card.Content>
          </Card>
        )}
      </ScrollView>
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
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chip: { marginHorizontal: 4 },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: { flex: 1, marginHorizontal: 4 },
  savingsCard: { backgroundColor: '#E8F5E8' },
  loansCard: { backgroundColor: '#E3F2FD' },
  usersCard: { backgroundColor: '#F3E5F5' },
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
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  userCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
});