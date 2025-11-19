import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider, FAB, Portal, Modal } from 'react-native-paper';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';

export default function MeetingManagement({ navigation }) {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [registering, setRegistering] = useState(null);

  // Form fields for creating meetings
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    loadMeetings();
    loadUpcomingMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('reuniones')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
      Alert.alert('Error', 'No se pudieron cargar las reuniones');
    }
  };

  const loadUpcomingMeetings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('reuniones')
        .select('*')
        .eq('estado', 'programada')
        .gte('fecha', today)
        .order('fecha', { ascending: true });

      if (error) throw error;
      setUpcomingMeetings(data || []);
    } catch (error) {
      console.error('Error loading upcoming meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setLocation('');
  };

  const validateForm = () => {
    if (!title.trim() || !description.trim() || !date) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return false;
    }
    return true;
  };

  const createMeeting = async () => {
    if (!validateForm()) return;

    try {
      const meetingData = {
        titulo: title,
        descripcion: description,
        fecha: `${date}T${time || '00:00'}:00`,
        lugar: location,
        estado: 'programada',
        created_at: new Date(),
      };

      const { data, error } = await supabase
        .from('reuniones')
        .insert(meetingData)
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Éxito', 'Reunión programada correctamente');
      resetForm();
      setShowCreateModal(false);
      loadMeetings();
      loadUpcomingMeetings();
    } catch (error) {
      console.error('Error creating meeting:', error);
      Alert.alert('Error', 'No se pudo programar la reunión');
    }
  };

  const cancelMeeting = async (meetingId) => {
    Alert.alert(
      'Cancelar Reunión',
      '¿Estás seguro de que quieres cancelar esta reunión?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('reuniones')
                .update({ estado: 'cancelada' })
                .eq('id', meetingId);

              if (error) throw error;

              Alert.alert('Éxito', 'Reunión cancelada');
              loadMeetings();
              loadUpcomingMeetings();
            } catch (error) {
              console.error('Error canceling meeting:', error);
              Alert.alert('Error', 'No se pudo cancelar la reunión');
            }
          },
        },
      ]
    );
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
      const alreadyRegistered = await checkAttendance(meeting.id);
      if (alreadyRegistered) {
        Alert.alert('Info', 'Ya has registrado tu asistencia a esta reunión');
        return;
      }

      const attendanceData = {
        reunion_id: meeting.id,
        usuario_id: user.id,
        asistio: true,
        created_at: new Date(),
      };

      const { error } = await supabase
        .from('asistencia_reuniones')
        .insert(attendanceData);

      if (error) throw error;

      Alert.alert('Éxito', 'Asistencia registrada correctamente');
      loadUpcomingMeetings();

    } catch (error) {
      console.error('Error registering attendance:', error);
      Alert.alert('Error', 'No se pudo registrar la asistencia');
    } finally {
      setRegistering(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'programada': return '#4CAF50';
      case 'en_curso': return '#2196F3';
      case 'finalizada': return '#666';
      case 'cancelada': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'programada': return 'Programada';
      case 'en_curso': return 'En Curso';
      case 'finalizada': return 'Finalizada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Gestión de Reuniones" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Próximas reuniones - Asistencia */}
        <Card style={styles.card}>
          <Card.Title title="Próximas Reuniones" />
          <Card.Content>
            {upcomingMeetings.length === 0 ? (
              <Text style={styles.emptyText}>No hay reuniones programadas próximamente</Text>
            ) : (
              upcomingMeetings.map((meeting, index) => (
                <View key={meeting.id}>
                  <List.Item
                    title={meeting.titulo}
                    description={`${new Date(meeting.fecha).toLocaleDateString()} - ${meeting.lugar || 'Sin ubicación'}`}
                    right={() => (
                      <View style={styles.buttonContainer}>
                        <Button
                          mode="contained"
                          onPress={() => registerAttendance(meeting)}
                          loading={registering === meeting.id}
                          disabled={registering === meeting.id}
                          style={styles.attendanceButton}
                          compact
                        >
                          Asistir
                        </Button>
                      </View>
                    )}
                  />
                  {meeting.descripcion && (
                    <Text style={styles.description} numberOfLines={2}>
                      {meeting.descripcion}
                    </Text>
                  )}
                  {index < upcomingMeetings.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Todas las reuniones - Gestión */}
        <Card style={styles.card}>
          <Card.Title title="Todas las Reuniones" />
          <Card.Content>
            {meetings.length === 0 ? (
              <Text style={styles.emptyText}>No hay reuniones registradas</Text>
            ) : (
              meetings.slice(0, 10).map((meeting, index) => (
                <View key={meeting.id}>
                  <List.Item
                    title={meeting.titulo}
                    description={`${new Date(meeting.fecha).toLocaleDateString()} - ${meeting.lugar || 'Sin ubicación'}`}
                    right={() => (
                      <View style={styles.meetingActions}>
                        <Text style={[styles.statusText, { color: getStatusColor(meeting.estado) }]}>
                          {getStatusText(meeting.estado)}
                        </Text>
                      </View>
                    )}
                  />
                  {meeting.estado === 'programada' && (
                    <View style={styles.cancelContainer}>
                      <Button
                        mode="outlined"
                        onPress={() => cancelMeeting(meeting.id)}
                        style={styles.cancelButton}
                        compact
                      >
                        Cancelar
                      </Button>
                    </View>
                  )}
                  {index < meetings.slice(0, 10).length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB para crear reunión */}
      <FAB
        icon="plus"
        onPress={() => setShowCreateModal(true)}
        style={styles.fab}
      />

      {/* Modal para crear reunión */}
      <Portal>
        <Modal
          visible={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Title title="Nueva Reunión" />
            <Card.Content>
              <TextInput
                label="Título"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />

              <TextInput
                label="Descripción"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={styles.input}
              />

              <TextInput
                label="Fecha (YYYY-MM-DD)"
                value={date}
                onChangeText={setDate}
                placeholder="Ej: 2024-12-25"
                style={styles.input}
              />

              <TextInput
                label="Hora (HH:MM)"
                value={time}
                onChangeText={setTime}
                placeholder="Ej: 14:30"
                style={styles.input}
              />

              <TextInput
                label="Lugar"
                value={location}
                onChangeText={setLocation}
                style={styles.input}
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    resetForm();
                    setShowCreateModal(false);
                  }}
                  style={styles.button}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={createMeeting}
                  style={styles.button}
                >
                  Crear
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16 },
  card: { marginBottom: 16 },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
  },
  buttonContainer: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  attendanceButton: {
    marginVertical: 4,
  },
  meetingActions: { alignItems: 'flex-end', minWidth: 80 },
  statusText: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  cancelContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginRight: 16,
  },
  cancelButton: { marginTop: 4 },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
  },
  modalCard: {
    maxHeight: '80%',
  },
  input: { marginBottom: 12 },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: { flex: 1, marginHorizontal: 4 },
});