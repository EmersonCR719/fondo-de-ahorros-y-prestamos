import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, List, Divider, Chip } from 'react-native-paper';
import { supabase } from '../../supabase';

export default function LoanApproval({ navigation }) {
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingLoan, setProcessingLoan] = useState(null);

  useEffect(() => {
    loadPendingLoans();
  }, []);

  const loadPendingLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('prestamos')
        .select(`
          *,
          usuarios (
            nombre,
            email,
            rol
          )
        `)
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingLoans(data || []);
    } catch (error) {
      console.error('Error loading pending loans:', error);
      Alert.alert('Error', 'No se pudieron cargar las solicitudes de préstamo');
    } finally {
      setLoading(false);
    }
  };

  const approveLoan = async (loan) => {
    setProcessingLoan(loan.id);
    try {
      const { error } = await supabase
        .from('prestamos')
        .update({
          estado: 'aprobado',
          fecha_aprobacion: new Date().toISOString(),
          updated_at: new Date(),
        })
        .eq('id', loan.id);

      if (error) throw error;

      Alert.alert('Éxito', 'Préstamo aprobado correctamente');
      loadPendingLoans();
    } catch (error) {
      console.error('Error approving loan:', error);
      Alert.alert('Error', 'No se pudo aprobar el préstamo');
    } finally {
      setProcessingLoan(null);
    }
  };

  const rejectLoan = async (loan) => {
    Alert.alert(
      'Rechazar Préstamo',
      '¿Estás seguro de que quieres rechazar esta solicitud?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            setProcessingLoan(loan.id);
            try {
              const { error } = await supabase
                .from('prestamos')
                .update({
                  estado: 'rechazado',
                  updated_at: new Date(),
                })
                .eq('id', loan.id);

              if (error) throw error;

              Alert.alert('Éxito', 'Préstamo rechazado');
              loadPendingLoans();
            } catch (error) {
              console.error('Error rejecting loan:', error);
              Alert.alert('Error', 'No se pudo rechazar el préstamo');
            } finally {
              setProcessingLoan(null);
            }
          },
        },
      ]
    );
  };

  const getInterestRateText = (rate) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Aprobación de Préstamos" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>Cargando solicitudes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Aprobación de Préstamos" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {pendingLoans.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.emptyText}>No hay solicitudes de préstamo pendientes</Text>
            </Card.Content>
          </Card>
        ) : (
          pendingLoans.map((loan, index) => (
            <Card key={loan.id} style={styles.card}>
              <Card.Title
                title={`Solicitud #${loan.id}`}
                subtitle={`${loan.usuarios?.nombre} (${loan.usuarios?.rol})`}
              />
              <Card.Content>
                <View style={styles.loanDetails}>
                  <Text style={styles.detailText}>
                    Monto solicitado: ${loan.monto_solicitado?.toLocaleString()}
                  </Text>
                  <Text style={styles.detailText}>
                    Tasa de interés: {getInterestRateText(loan.tasa_interes)}
                  </Text>
                  <Text style={styles.detailText}>
                    Pago mensual: ${loan.pago_mensual?.toFixed(2)}
                  </Text>
                  <Text style={styles.detailText}>
                    Propósito: {loan.proposito}
                  </Text>
                  <Text style={styles.detailText}>
                    Fecha solicitud: {new Date(loan.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={() => approveLoan(loan)}
                    loading={processingLoan === loan.id}
                    disabled={processingLoan === loan.id}
                    style={[styles.button, styles.approveButton]}
                  >
                    Aprobar
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => rejectLoan(loan)}
                    loading={processingLoan === loan.id}
                    disabled={processingLoan === loan.id}
                    style={[styles.button, styles.rejectButton]}
                  >
                    Rechazar
                  </Button>
                </View>
              </Card.Content>
              {index < pendingLoans.length - 1 && <Divider />}
            </Card>
          ))
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
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  loanDetails: { marginBottom: 16 },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: { flex: 1, marginHorizontal: 4 },
  approveButton: { backgroundColor: '#4CAF50' },
  rejectButton: { borderColor: '#F44336' },
});