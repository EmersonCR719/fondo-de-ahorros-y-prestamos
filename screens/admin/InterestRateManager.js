import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider } from 'react-native-paper';
import { supabase } from '../../supabase';

export default function InterestRateManager({ navigation }) {
  const [associateRate, setAssociateRate] = useState('');
  const [clientRate, setClientRate] = useState('');
  const [currentRates, setCurrentRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nextAdjustment, setNextAdjustment] = useState('');

  useEffect(() => {
    loadCurrentRates();
  }, []);

  const loadCurrentRates = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('tasa_interes_asociados, tasa_interes_clientes, proxima_actualizacion')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCurrentRates(data);
        setAssociateRate((data.tasa_interes_asociados * 100).toString());
        setClientRate((data.tasa_interes_clientes * 100).toString());
        setNextAdjustment(data.proxima_actualizacion || '');
      } else {
        // Valores por defecto
        setAssociateRate('2');
        setClientRate('2.5');
      }
    } catch (error) {
      console.error('Error loading rates:', error);
    }
  };

  const updateInterestRates = async () => {
    const associateValue = parseFloat(associateRate);
    const clientValue = parseFloat(clientRate);

    if (!associateValue || !clientValue || associateValue < 0 || clientValue < 0) {
      Alert.alert('Error', 'Por favor ingresa tasas de interés válidas');
      return;
    }

    if (associateValue > 10 || clientValue > 10) {
      Alert.alert('Advertencia', 'Las tasas de interés parecen muy altas. ¿Estás seguro?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => saveRates(associateValue / 100, clientValue / 100)
        }
      ]);
      return;
    }

    await saveRates(associateValue / 100, clientValue / 100);
  };

  const saveRates = async (associateDecimal, clientDecimal) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('configuracion')
        .upsert({
          tasa_interes_asociados: associateDecimal,
          tasa_interes_clientes: clientDecimal,
          proxima_actualizacion: nextAdjustment || null,
          updated_at: new Date(),
        });

      if (error) throw error;

      setCurrentRates({
        tasa_interes_asociados: associateDecimal,
        tasa_interes_clientes: clientDecimal,
        proxima_actualizacion: nextAdjustment,
      });

      Alert.alert('Éxito', 'Tasas de interés actualizadas correctamente');
    } catch (error) {
      console.error('Error updating rates:', error);
      Alert.alert('Error', 'No se pudieron actualizar las tasas');
    } finally {
      setLoading(false);
    }
  };

  const getActiveLoansCount = async () => {
    try {
      const { count: associateLoans, error: error1 } = await supabase
        .from('prestamos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'aprobado')
        .eq('tasa_interes', currentRates?.tasa_interes_asociados || 0.02);

      const { count: clientLoans, error: error2 } = await supabase
        .from('prestamos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'aprobado')
        .eq('tasa_interes', currentRates?.tasa_interes_clientes || 0.025);

      if (error1 || error2) return { associateLoans: 0, clientLoans: 0 };

      return {
        associateLoans: associateLoans || 0,
        clientLoans: clientLoans || 0,
      };
    } catch (error) {
      console.error('Error counting loans:', error);
      return { associateLoans: 0, clientLoans: 0 };
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Gestión de Tasas de Interés" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Tasas actuales */}
        <Card style={styles.card}>
          <Card.Title title="Tasas de Interés Actuales" />
          <Card.Content>
            <Text style={styles.currentRate}>
              Asociados: {currentRates?.tasa_interes_asociados ? (currentRates.tasa_interes_asociados * 100).toFixed(1) : '2.0'}%
            </Text>
            <Text style={styles.currentRate}>
              Clientes: {currentRates?.tasa_interes_clientes ? (currentRates.tasa_interes_clientes * 100).toFixed(1) : '2.5'}%
            </Text>
            {currentRates?.proxima_actualizacion && (
              <Text style={styles.nextAdjustment}>
                Próxima actualización: {new Date(currentRates.proxima_actualizacion).toLocaleDateString()}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Configuración de tasas */}
        <Card style={styles.card}>
          <Card.Title title="Actualizar Tasas de Interés" />
          <Card.Content>
            <TextInput
              label="Tasa para Asociados (%)"
              value={associateRate}
              onChangeText={setAssociateRate}
              keyboardType="numeric"
              style={styles.input}
              placeholder="Ej: 2.0"
            />

            <TextInput
              label="Tasa para Clientes (%)"
              value={clientRate}
              onChangeText={setClientRate}
              keyboardType="numeric"
              style={styles.input}
              placeholder="Ej: 2.5"
            />

            <TextInput
              label="Próxima actualización (YYYY-MM-DD)"
              value={nextAdjustment}
              onChangeText={setNextAdjustment}
              placeholder="Fecha de próxima revisión"
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={updateInterestRates}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Actualizar Tasas
            </Button>
          </Card.Content>
        </Card>

        {/* Información adicional */}
        <Card style={styles.card}>
          <Card.Title title="Información Importante" />
          <Card.Content>
            <Text style={styles.infoText}>
              • Las tasas de interés se aplican automáticamente a nuevos préstamos.{'\n'}
              • Los préstamos existentes mantienen su tasa original.{'\n'}
              • Se recomienda actualizar las tasas anualmente.{'\n'}
              • Las tasas se expresan en porcentaje anual (ej: 2.5 = 2.5%).{'\n'}
              • Los cambios afectan solo a préstamos futuros, no a los existentes.
            </Text>
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
  currentRate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  nextAdjustment: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  input: { marginBottom: 12 },
  button: { marginTop: 16 },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
});