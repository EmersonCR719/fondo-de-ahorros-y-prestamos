import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider } from 'react-native-paper';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../supabase';

export default function StatementGenerator({ navigation }) {
  const { user } = useAuth();
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const generateStatement = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

      // Get savings data
      const { data: savings, error: savingsError } = await supabase
        .from('ahorros')
        .select('*')
        .eq('usuario_id', user.id)
        .gte('fecha', startDate)
        .lte('fecha', endDate)
        .order('fecha', { ascending: true });

      if (savingsError) throw savingsError;

      // Get loan payments
      const { data: loanPayments, error: paymentsError } = await supabase
        .from('abonos')
        .select(`
          *,
          prestamos (
            tasa_interes,
            monto_solicitado
          )
        `)
        .eq('usuario_id', user.id)
        .gte('fecha_abono', startDate)
        .lte('fecha_abono', endDate)
        .order('fecha_abono', { ascending: true });

      if (paymentsError) throw paymentsError;

      // Get fines
      const { data: fines, error: finesError } = await supabase
        .from('multas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('estado', 'pagada')
        .gte('fecha_multa', startDate)
        .lte('fecha_multa', endDate)
        .order('fecha_multa', { ascending: true });

      if (finesError) throw finesError;

      // Get management fee payments
      const { data: feePayments, error: feeError } = await supabase
        .from('pagos_cuota_manejo')
        .select('*')
        .eq('usuario_id', user.id)
        .gte('fecha_pago', startDate)
        .lte('fecha_pago', endDate)
        .order('fecha_pago', { ascending: true });

      if (feeError) throw feeError;

      // Calculate totals
      const totalSavings = savings?.reduce((sum, ahorro) => sum + ahorro.monto, 0) || 0;
      const totalLoanPayments = loanPayments?.reduce((sum, payment) => sum + payment.monto_abono, 0) || 0;
      const totalFines = fines?.reduce((sum, fine) => sum + fine.monto, 0) || 0;
      const totalFees = feePayments?.reduce((sum, fee) => sum + fee.monto, 0) || 0;

      // Calculate interest earned (simplified - 1% monthly on average balance)
      const avgBalance = totalSavings * 0.5; // Simplified calculation
      const interestEarned = avgBalance * 0.01 * (selectedMonth === 2 ? 28 : 30) / 365;

      // Calculate net balance
      const netBalance = totalSavings + interestEarned - totalLoanPayments - totalFines - totalFees;

      const statementData = {
        period: `${months[selectedMonth - 1]} ${selectedYear}`,
        startDate,
        endDate,
        summary: {
          totalSavings,
          totalLoanPayments,
          totalFines,
          totalFees,
          interestEarned,
          netBalance,
        },
        details: {
          savings: savings || [],
          loanPayments: loanPayments || [],
          fines: fines || [],
          feePayments: feePayments || [],
        },
        generatedAt: new Date().toISOString(),
      };

      setStatement(statementData);
    } catch (error) {
      console.error('Error generating statement:', error);
      Alert.alert('Error', 'No se pudo generar el estado de cuenta');
    } finally {
      setLoading(false);
    }
  };

  const shareStatement = () => {
    if (!statement) return;

    const shareText = `
ESTADO DE CUENTA - ${statement.period}
FAP - Fondo de Ahorros y Préstamos

RESUMEN:
• Ahorros del período: $${statement.summary.totalSavings.toLocaleString()}
• Intereses ganados: $${statement.summary.interestEarned.toFixed(2)}
• Abonos a préstamos: $${statement.summary.totalLoanPayments.toLocaleString()}
• Multas pagadas: $${statement.summary.totalFines.toLocaleString()}
• Cuotas de manejo: $${statement.summary.totalFees.toLocaleString()}

SALDO NETO: $${statement.summary.netBalance.toFixed(2)}

Generado el: ${new Date(statement.generatedAt).toLocaleString()}
    `.trim();

    // In a real app, you would use Share API or other sharing mechanism
    Alert.alert('Compartir Estado', 'Funcionalidad de compartir próximamente disponible');
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Estado de Cuenta" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Period Selection */}
        <Card style={styles.card}>
          <Card.Title title="Seleccionar Período" />
          <Card.Content>
            <View style={styles.periodContainer}>
              <TextInput
                label="Mes"
                value={selectedMonth.toString()}
                onChangeText={(value) => setSelectedMonth(parseInt(value) || 1)}
                keyboardType="numeric"
                style={styles.periodInput}
              />
              <TextInput
                label="Año"
                value={selectedYear.toString()}
                onChangeText={(value) => setSelectedYear(parseInt(value) || new Date().getFullYear())}
                keyboardType="numeric"
                style={styles.periodInput}
              />
            </View>

            <Button
              mode="contained"
              onPress={generateStatement}
              loading={loading}
              disabled={loading}
              style={styles.generateButton}
            >
              Generar Estado
            </Button>
          </Card.Content>
        </Card>

        {/* Statement Display */}
        {statement && (
          <>
            <Card style={styles.card}>
              <Card.Title title={`Estado de Cuenta - ${statement.period}`} />
              <Card.Content>
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryTitle}>RESUMEN</Text>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Ahorros del período:</Text>
                    <Text style={styles.summaryValue}>${statement.summary.totalSavings.toLocaleString()}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Intereses ganados:</Text>
                    <Text style={styles.summaryValue}>${statement.summary.interestEarned.toFixed(2)}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Abonos a préstamos:</Text>
                    <Text style={[styles.summaryValue, styles.negative]}>${statement.summary.totalLoanPayments.toLocaleString()}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Multas pagadas:</Text>
                    <Text style={[styles.summaryValue, styles.negative]}>${statement.summary.totalFines.toLocaleString()}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Cuotas de manejo:</Text>
                    <Text style={[styles.summaryValue, styles.negative]}>${statement.summary.totalFees.toLocaleString()}</Text>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, styles.netBalance]}>SALDO NETO:</Text>
                    <Text style={[styles.summaryValue, styles.netBalance]}>
                      ${statement.summary.netBalance.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <Button
                  mode="outlined"
                  onPress={shareStatement}
                  style={styles.shareButton}
                  icon="share"
                >
                  Compartir Estado
                </Button>
              </Card.Content>
            </Card>

            {/* Detailed Breakdown */}
            {statement.details.savings.length > 0 && (
              <Card style={styles.card}>
                <Card.Title title="Detalle de Ahorros" />
                <Card.Content>
                  {statement.details.savings.map((saving, index) => (
                    <View key={saving.id}>
                      <List.Item
                        title={`${saving.fecha} - ${saving.descripcion || 'Ahorro'}`}
                        description={`$${saving.monto.toLocaleString()}`}
                      />
                      {index < statement.details.savings.length - 1 && <Divider />}
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16 },
  card: { marginBottom: 16 },
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodInput: { flex: 1, marginHorizontal: 4 },
  generateButton: { marginTop: 16 },
  summaryContainer: { marginBottom: 16 },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  negative: {
    color: '#F44336',
  },
  netBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  divider: { marginVertical: 12 },
  shareButton: { marginTop: 16 },
});