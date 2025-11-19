import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider } from 'react-native-paper';
import { supabase } from '../../supabase';

export default function SavingsQuotaManager({ navigation }) {
  const [quota, setQuota] = useState('');
  const [currentQuota, setCurrentQuota] = useState(null);
  const [loading, setLoading] = useState(false);
  const [associates, setAssociates] = useState([]);
  const [loadingAssociates, setLoadingAssociates] = useState(false);

  useEffect(() => {
    loadCurrentQuota();
    loadAssociates();
  }, []);

  const loadCurrentQuota = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('cuota_minima_mensual')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCurrentQuota(data.cuota_minima_mensual);
        setQuota(data.cuota_minima_mensual.toString());
      }
    } catch (error) {
      console.error('Error loading quota:', error);
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

  const updateQuota = async () => {
    const quotaValue = parseFloat(quota);
    if (!quota || isNaN(quotaValue) || quotaValue <= 0) {
      Alert.alert('Error', 'Por favor ingresa una cuota válida mayor a 0');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('configuracion')
        .upsert({
          cuota_minima_mensual: quotaValue,
          updated_at: new Date(),
        });

      if (error) throw error;

      setCurrentQuota(quotaValue);
      Alert.alert('Éxito', 'Cuota mínima mensual actualizada correctamente');
    } catch (error) {
      console.error('Error updating quota:', error);
      Alert.alert('Error', 'No se pudo actualizar la cuota');
    } finally {
      setLoading(false);
    }
  };

  const checkAssociateCompliance = async (associateId) => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('ahorros')
        .select('monto')
        .eq('usuario_id', associateId)
        .gte('fecha', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('fecha', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (error) throw error;

      const totalSaved = data?.reduce((sum, ahorro) => sum + ahorro.monto, 0) || 0;
      return {
        totalSaved,
        isCompliant: totalSaved >= currentQuota,
        remaining: Math.max(0, currentQuota - totalSaved),
      };
    } catch (error) {
      console.error('Error checking compliance:', error);
      return { totalSaved: 0, isCompliant: false, remaining: currentQuota };
    }
  };

  const viewAssociateSavings = (associate) => {
    navigation.navigate('CrudAhorros', { filterUserId: associate.id });
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Gestión de Cuotas de Ahorro" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Configuración de cuota mínima */}
        <Card style={styles.card}>
          <Card.Title title="Cuota Mínima Mensual" />
          <Card.Content>
            <Text style={styles.currentQuota}>
              Cuota actual: ${currentQuota?.toLocaleString() || 'No definida'}
            </Text>

            <TextInput
              label="Nueva cuota mínima ($)"
              value={quota}
              onChangeText={setQuota}
              keyboardType="numeric"
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={updateQuota}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Actualizar Cuota
            </Button>
          </Card.Content>
        </Card>

        {/* Lista de asociados */}
        <Card style={styles.card}>
          <Card.Title title="Estado de Cumplimiento - Asociados" />
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
                      <Button
                        mode="outlined"
                        onPress={() => viewAssociateSavings(associate)}
                        style={styles.viewButton}
                      >
                        Ver Ahorros
                      </Button>
                    )}
                  />
                  {index < associates.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Información adicional */}
        <Card style={styles.card}>
          <Card.Title title="Información Importante" />
          <Card.Content>
            <Text style={styles.infoText}>
              • Los asociados deben cumplir con la cuota mínima mensual.{'\n'}
              • Si no se cumple, se puede descontar del ahorro acumulado.{'\n'}
              • Los retiros antes de fin de año pierden todas las ganancias.{'\n'}
              • La cuota se puede ajustar anualmente por el administrador.
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
  currentQuota: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1976D2',
  },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
  viewButton: { marginVertical: 4 },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
});