import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, List, Divider } from 'react-native-paper';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../supabase';
import { validateLocationForMeeting } from '../../utils/GPSUtils';

export default function MeetingAttendance({ navigation }) {
  const { user } = useAuth();
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);

  useEffect(() => {
    loadUpcomingMeetings();
  }, []);

  const loadUpcomingMeetings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('reuniones')
        .select('*')
        .eq('estado', 'programada')
        .gte('fecha', today)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (error) throw error;
      setUpcomingMeetings(data || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
      Alert.alert('Error', 'No se pudieron cargar las reuniones');
    } finally {
      setLoading(false);
    }
  };

  const checkAttendance = async (meetingId) => {
    try {
      const { data, error } = await supabase
        .from('asistencia_reuniones')
        .select('id')
        .eq('reunion_id', meetingId)
        .eq('usuario_id', user.id)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  };

  const registerAttendance = async (meeting) => {
    setRegistering(meeting.id);

    try {
      // First check if already registered
      const alreadyRegistered = await checkAttendance(meeting.id);
      if (alreadyRegistered) {
        Alert.alert('Info', 'Ya has registrado tu asistencia a esta reunión');
        return;
      }

      // For in-person meetings, validate GPS location
      if (meeting.tipo === 'presencial') {
        const locationValidation = await validateLocationForMeeting({
          latitude: meeting.latitud || 0,
          longitude: meeting.longitud || 0,
        });

        if (!locationValidation.valid) {
          Alert.alert(
            'Ubicación Inválida',
            locationValidation.message,
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Register attendance
      const attendanceData = {
        reunion_id: meeting.id,
        usuario_id: user.id,
        fecha_asistencia: new Date().toISOString().split('T')[0],
        hora_asistencia: new Date().toTimeString().split(' ')[0],
        metodo_validacion: meeting.tipo === 'presencial' ? 'gps' : 'manual',
        created_at: new Date(),
      };

      const { error } = await supabase
        .from('asistencia_reuniones')
        .insert(attendanceData);

      if (error) throw error;

      Alert.alert('Éxito', 'Asistencia registrada correctamente');

      // Check if this triggers any fines for previous absences
      await checkForFines(meeting);

    } catch (error) {
      console.error('Error registering attendance:', error);
      Alert.alert('Error', 'No se pudo registrar la asistencia');
    } finally {
      setRegistering(null);
    }
  };

  const checkForFines = async (currentMeeting) => {
    try {
      // Get all meetings from the same month that the user missed
      const currentMonth = new Date(currentMeeting.fecha).getMonth() + 1;
      const currentYear = new Date(currentMeeting.fecha).getFullYear();

      const { data: monthlyMeetings, error } = await supabase
        .from('reuniones')
        .select('id, fecha')
        .eq('estado', 'finalizada')
        .gte('fecha', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('fecha', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (error) return;

      // Check attendance for each meeting
      let absences = 0;
      for (const meeting of monthlyMeetings) {
        const attended = await checkAttendance(meeting.id);
        if (!attended) absences++;
      }

      // Apply fine if absences >= threshold (configurable)
      if (absences >= 2) { // Example: fine after 2 absences
        const fineAmount = absences * 5000; // $5,000 per absence

        const { error: fineError } = await supabase
          .from('multas')
          .insert({
            usuario_id: user.id,
            tipo_multa: 'inasistencia_reunion',
            monto: fineAmount,
            descripcion: `Multa por ${absences} inasistencias a reuniones en ${currentMonth}/${currentYear}`,
            fecha_multa: new Date().toISOString().split('T')[0],
            estado: 'pendiente',
            created_at: new Date(),
          });

        if (!fineError) {
          Alert.alert(
            'Multa Aplicada',
            `Se ha aplicado una multa de $${fineAmount.toLocaleString()} por inasistencias a reuniones.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error checking fines:', error);
    }
  };

  const getMeetingStatus = async (meeting) => {
    const attended = await checkAttendance(meeting.id);
    return attended ? 'Registrado' : 'Pendiente';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Asistencia a Reuniones" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>Cargando reuniones...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Asistencia a Reuniones" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {upcomingMeetings.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.emptyText}>No hay reuniones programadas próximamente</Text>
            </Card.Content>
          </Card>
        ) : (
          upcomingMeetings.map((meeting, index) => (
            <Card key={meeting.id} style={styles.card}>
              <Card.Title
                title={meeting.titulo}
                subtitle={`${meeting.fecha} ${meeting.hora} - ${meeting.tipo}`}
              />
              <Card.Content>
                <Text style={styles.description}>{meeting.descripcion}</Text>

                {meeting.tipo === 'presencial' && meeting.ubicacion && (
                  <Text style={styles.location}>📍 {meeting.ubicacion}</Text>
                )}

                {meeting.tipo === 'virtual' && meeting.enlace_virtual && (
                  <Text style={styles.link}>🔗 {meeting.enlace_virtual}</Text>
                )}

                {meeting.costo_entrada > 0 && (
                  <Text style={styles.cost}>💰 Costo: ${meeting.costo_entrada}</Text>
                )}

                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={() => registerAttendance(meeting)}
                    loading={registering === meeting.id}
                    disabled={registering === meeting.id}
                    style={styles.attendanceButton}
                  >
                    Registrar Asistencia
                  </Button>
                </View>
              </Card.Content>
              {index < upcomingMeetings.length - 1 && <Divider />}
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
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
  link: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
  cost: {
    fontSize: 14,
    color: '#F57C00',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 12,
  },
  attendanceButton: {
    width: '100%',
  },
});