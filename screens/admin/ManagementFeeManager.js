import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider, Switch } from 'react-native-paper';
import { supabase } from '../../supabase';

export default function ManagementFeeManager({ navigation }) {
  const [feeAmount, setFeeAmount] = useState('');
  const [autoDeduct, setAutoDeduct] = useState(true);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [associates, setAssociates] = useState([]);
  const [loadingAssociates, setLoadingAssociates] = useState(false);

  useEffect(() => {
    loadCurrentConfig();
    loadAssociates();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('cuota_manejo_anual, deduccion_automatica_cuota')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCurrentConfig(data);
        setFeeAmount(data.cuota_manejo_anual?.toString() || '');
        setAutoDeduct(data.deduccion_automatica_cuota || true);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadAssociates = async () => {
    setLoadingAssociates(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email')
        .eq('rol', 'asociado');

      if (error) throw error;
      setAssociates(data || []);
    } catch (error) {
      console.error('Error loading associates:', error);
      Alert.alert('Error', 'No se pudieron cargar los asociados');
    } finally {
      setLoadingAssociates(false);
    }
  };

  const updateFeeConfig = async () => {
    const feeValue = parseFloat(feeAmount);
    if (!feeAmount || isNaN(feeValue) || feeValue < 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido para la cuota de manejo');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('configuracion')
        .upsert({
          id: 1,
          cuota_manejo_anual: feeValue,
          deduccion_automatica_cuota: autoDeduct,
          updated_at: new Date(),
        });

      if (error) throw error;

      setCurrentConfig({
        cuota_manejo_anual: feeValue,
        deduccion_automatica_cuota: autoDeduct,
      });

      Alert.alert('Éxito', 'Configuración de cuota de manejo actualizada correctamente');
    } catch (error) {
      console.error('Error updating fee config:', error);
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const checkAssociateFeeStatus = async (associateId) => {
    try {
      const currentYear = new Date().getFullYear();

      // Check if fee has been paid this year
      const { data: payments, error } = await supabase
        .from('pagos_cuota_manejo')
        .select('monto, fecha_pago')
        .eq('usuario_id', associateId)
        .gte('fecha_pago', `${currentYear}-01-01`)
        .lte('fecha_pago', `${currentYear}-12-31`);

      if (error) throw error;

      const totalPaid = payments?.reduce((sum, payment) => sum + payment.monto, 0) || 0;
      const isPaid = totalPaid >= (currentConfig?.cuota_manejo_anual || 0);

      return {
        isPaid,
        totalPaid,
        remaining: Math.max(0, (currentConfig?.cuota_manejo_anual || 0) - totalPaid),
      };
    } catch (error) {
      console.error('Error checking fee status:', error);
      return { isPaid: false, totalPaid: 0, remaining: currentConfig?.cuota_manejo_anual || 0 };
    }
  };

  const applyAutomaticDeduction = async () => {
    if (!autoDeduct || !currentConfig?.cuota_manejo_anual) {
      Alert.alert('Error', 'La deducción automática no está habilitada o no hay cuota configurada');
      return;
    }

    Alert.alert(
      'Confirmar Deducción Automática',
      '¿Estás seguro de aplicar la deducción automática de cuota de manejo para asociados que no han pagado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: async () => {
            setLoading(true);
            try {
              // Get associates who haven't paid the annual fee
              const unpaidAssociates = [];
              for (const associate of associates) {
                const status = await checkAssociateFeeStatus(associate.id);
                if (!status.isPaid) {
                  unpaidAssociates.push({ ...associate, feeStatus: status });
                }
              }

              let deductionsApplied = 0;
              for (const associate of unpaidAssociates) {
                // Check if associate has enough savings to deduct
                const { data: savings, error } = await supabase
                  .from('ahorros')
                  .select('monto')
                  .eq('usuario_id', associate.id);

                if (error) continue;

                const totalSavings = savings?.reduce((sum, ahorro) => sum + ahorro.monto, 0) || 0;

                if (totalSavings >= associate.feeStatus.remaining) {
                  // Apply deduction by creating a negative savings record
                  const { error: deductionError } = await supabase
                    .from('ahorros')
                    .insert({
                      usuario_id: associate.id,
                      monto: -associate.feeStatus.remaining,
                      descripcion: `Deducción automática cuota de manejo ${new Date().getFullYear()}`,
                      fecha: new Date().toISOString().split('T')[0],
                      tipo: 'deduccion_cuota',
                      created_at: new Date(),
                    });

                  if (!deductionError) {
                    // Record the payment
                    await supabase
                      .from('pagos_cuota_manejo')
                      .insert({
                        usuario_id: associate.id,
                        monto: associate.feeStatus.remaining,
                        fecha_pago: new Date().toISOString().split('T')[0],
                        metodo_pago: 'deduccion_automatica',
                        created_at: new Date(),
                      });

                    deductionsApplied++;
                  }
                }
              }

              Alert.alert(
                'Deducción Completada',
                `Se aplicaron deducciones automáticas a ${deductionsApplied} asociados.`
              );
            } catch (error) {
              console.error('Error applying automatic deduction:', error);
              Alert.alert('Error', 'No se pudieron aplicar las deducciones automáticas');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Gestión de Cuota de Manejo" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Configuración de cuota de manejo */}
        <Card style={styles.card}>
          <Card.Title title="Configuración de Cuota Anual" />
          <Card.Content>
            <Text style={styles.currentFee}>
              Cuota actual: ${currentConfig?.cuota_manejo_anual?.toLocaleString() || 'No definida'}
            </Text>

            <TextInput
              label="Monto de cuota anual ($)"
              value={feeAmount}
              onChangeText={setFeeAmount}
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.switchContainer}>
              <Text>Deducción automática:</Text>
              <Switch
                value={autoDeduct}
                onValueChange={setAutoDeduct}
              />
            </View>

            <Button
              mode="contained"
              onPress={updateFeeConfig}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Actualizar Configuración
            </Button>
          </Card.Content>
        </Card>

        {/* Aplicar deducción automática */}
        {autoDeduct && (
          <Card style={styles.card}>
            <Card.Title title="Deducción Automática" />
            <Card.Content>
              <Text style={styles.infoText}>
                Aplicar deducción automática de cuota de manejo a asociados que no han pagado
                y tienen saldo suficiente en ahorros.
              </Text>
              <Button
                mode="outlined"
                onPress={applyAutomaticDeduction}
                loading={loading}
                disabled={loading}
                style={styles.deductionButton}
              >
                Aplicar Deducciones Automáticas
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Estado de asociados */}
        <Card style={styles.card}>
          <Card.Title title="Estado de Cuota de Manejo - Asociados" />
          <Card.Content>
            {loadingAssociates ? (
              <Text>Cargando asociados...</Text>
            ) : associates.length === 0 ? (
              <Text>No hay asociados registrados</Text>
            ) : (
              associates.map((associate, index) => (
                <View key={associate.id}>
                  <List.Item
                    title={associate.nombre}
                    description={associate.email}
                    right={() => (
                      <View style={styles.statusContainer}>
                        <Text style={styles.statusText}>
                          Estado: Calculando...
                        </Text>
                      </View>
                    )}
                  />
                  {index < associates.length - 1 && <Divider />}
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
  currentFee: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1976D2',
  },
  input: { marginBottom: 16 },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: { marginTop: 8 },
  deductionButton: { marginTop: 16 },
  statusContainer: { justifyContent: 'center' },
  statusText: { fontSize: 12, color: '#666' },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    marginBottom: 16,
  },
});