import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, List, Divider, Switch } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../supabase';

export default function MeetingScheduler({ navigation }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('presencial');
  const [location, setLocation] = useState('');
  const [virtualLink, setVirtualLink] = useState('');
  const [cost, setCost] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('reuniones')
        .select('*')
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
      Alert.alert('Error', 'No se pudieron cargar las reuniones');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setType('presencial');
    setLocation('');
    setVirtualLink('');
    setCost('');
    setMaxAttendees('');
  };

  const validateForm = () => {
    if (!title.trim() || !description.trim() || !date || !time) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return false;
    }

    if (type === 'presencial' && !location.trim()) {
      Alert.alert('Error', 'La ubicación es obligatoria para reuniones presenciales');
      return false;
    }

    if (type === 'virtual' && !virtualLink.trim()) {
      Alert.alert('Error', 'El enlace es obligatorio para reuniones virtuales');
      return false;
    }

    return true;
  };

  const scheduleMeeting = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const meetingData = {
        titulo: title,
        descripcion: description,
        fecha: date,
        hora: time,
        tipo: type,
        ubicacion: type === 'presencial' ? location : null,
        enlace_virtual: type === 'virtual' ? virtualLink : null,
        costo_entrada: cost ? parseFloat(cost) : 0,
        max_asistentes: maxAttendees ? parseInt(maxAttendees) : null,
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
      setShowForm(false);
      loadMeetings();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      Alert.alert('Error', 'No se pudo programar la reunión');
    } finally {
      setLoading(false);
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
            } catch (error) {
              console.error('Error canceling meeting:', error);
              Alert.alert('Error', 'No se pudo cancelar la reunión');
            }
          },
        },
      ]
    );
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

  if (loading && !showForm) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Programar Reuniones" />
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
        <Appbar.Content title="Programar Reuniones" />
        <Appbar.Action
          icon={showForm ? "close" : "plus"}
          onPress={() => setShowForm(!showForm)}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {showForm && (
          <Card style={styles.card}>
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

              <Text style={styles.label}>Tipo de reunión</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={type}
                  onValueChange={(value) => setType(value)}
                >
                  <Picker.Item label="Presencial" value="presencial" />
                  <Picker.Item label="Virtual" value="virtual" />
                </Picker>
              </View>

              {type === 'presencial' && (
                <TextInput
                  label="Ubicación"
                  value={location}
                  onChangeText={setLocation}
                  style={styles.input}
                />
              )}

              {type === 'virtual' && (
                <TextInput
                  label="Enlace virtual"
                  value={virtualLink}
                  onChangeText={setVirtualLink}
                  style={styles.input}
                />
              )}

              <TextInput
                label="Costo de entrada ($)"
                value={cost}
                onChangeText={setCost}
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                label="Máximo de asistentes"
                value={maxAttendees}
                onChangeText={setMaxAttendees}
                keyboardType="numeric"
                style={styles.input}
              />

              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  style={styles.button}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={scheduleMeeting}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Programar
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Lista de reuniones */}
        <Card style={styles.card}>
          <Card.Title title="Reuniones Programadas" />
          <Card.Content>
            {meetings.length === 0 ? (
              <Text style={styles.emptyText}>No hay reuniones programadas</Text>
            ) : (
              meetings.map((meeting, index) => (
                <View key={meeting.id}>
                  <List.Item
                    title={meeting.titulo}
                    description={`${meeting.fecha} ${meeting.hora} - ${meeting.tipo}`}
                    right={() => (
                      <View style={styles.meetingActions}>
                        <Text style={[styles.statusText, { color: getStatusColor(meeting.estado) }]}>
                          {getStatusText(meeting.estado)}
                        </Text>
                        {meeting.estado === 'programada' && (
                          <Button
                            mode="outlined"
                            onPress={() => cancelMeeting(meeting.id)}
                            style={styles.cancelButton}
                            compact
                          >
                            Cancelar
                          </Button>
                        )}
                      </View>
                    )}
                  />
                  {index < meetings.length - 1 && <Divider />}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: { marginBottom: 12 },
  label: { marginTop: 10, marginBottom: 5, fontWeight: 'bold' },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: { flex: 1, marginHorizontal: 4 },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
  meetingActions: { alignItems: 'flex-end' },
  statusText: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  cancelButton: { marginTop: 4 },
});