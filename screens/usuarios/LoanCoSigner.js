import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, List, Divider, Searchbar } from 'react-native-paper';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';

export default function LoanCoSigner({ navigation }) {
  const { user } = useAuth();
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
            email
          )
        `)
        .eq('estado', 'pendiente')
        .neq('usuario_id', user.id) // Exclude user's own loans
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

  const approveAsCoSigner = async (loanId) => {
    Alert.alert(
      'Confirmar Codeudor',
      '¿Estás seguro de que quieres ser codeudor solidario de este préstamo? Esto significa que te comprometes a respaldar financieramente este préstamo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              // In a real implementation, you might want to create a separate table for co-signers
              // For now, we'll just update the loan status or add a note
              const { error } = await supabase
                .from('prestamos')
                .update({
                  estado: 'aprobado',
                  fecha_aprobacion: new Date().toISOString().split('T')[0],
                  updated_at: new Date(),
                })
                .eq('id', loanId);

              if (error) throw error;

              Alert.alert('Éxito', 'Has sido registrado como codeudor solidario');
              loadPendingLoans();
            } catch (error) {
              console.error('Error approving as co-signer:', error);
              Alert.alert('Error', 'No se pudo registrar como codeudor');
            }
          },
        },
      ]
    );
  };

  const filteredLoans = pendingLoans.filter(loan =>
    loan.usuarios?.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.usuarios?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Codeudor Solidario" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Información */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.infoTitle}>Ser Codeudor Solidario</Text>
            <Text style={styles.infoText}>
              Como codeudor solidario, te comprometes a respaldar financieramente el préstamo solicitado.
              Asegúrate de conocer bien al solicitante y evaluar su capacidad de pago antes de aceptar.
            </Text>
          </Card.Content>
        </Card>

        {/* Buscador */}
        <Card style={styles.card}>
          <Card.Content>
            <Searchbar
              placeholder="Buscar por nombre o email"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />
          </Card.Content>
        </Card>

        {/* Lista de solicitudes pendientes */}
        <Card style={styles.card}>
          <Card.Title title="Solicitudes Pendientes" />
          <Card.Content>
            {loading ? (
              <Text>Cargando solicitudes...</Text>
            ) : filteredLoans.length === 0 ? (
              <Text style={styles.emptyText}>
                {searchQuery ? 'No se encontraron solicitudes con ese criterio' : 'No hay solicitudes pendientes'}
              </Text>
            ) : (
              filteredLoans.map((loan, index) => (
                <View key={loan.id}>
                  <List.Item
                    title={`Solicitud de ${loan.usuarios?.nombre || 'Usuario'}`}
                    description={`Monto: $${loan.monto_solicitado?.toLocaleString()} - ${loan.fecha_solicitud}`}
                    right={() => (
                      <Button
                        mode="contained"
                        onPress={() => approveAsCoSigner(loan.id)}
                        style={styles.approveButton}
                        compact
                      >
                        Aceptar
                      </Button>
                    )}
                  />
                  {loan.proposito && (
                    <Text style={styles.purposeText}>Propósito: {loan.proposito}</Text>
                  )}
                  {index < filteredLoans.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16 },
  card: { marginBottom: 16 },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  searchbar: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
  approveButton: {
    marginVertical: 4,
  },
  purposeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
});