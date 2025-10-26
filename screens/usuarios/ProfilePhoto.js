import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { Appbar, Text, Button, Card } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../supabase';

export default function ProfilePhoto({ navigation, route }) {
  const { user } = useAuth();
  const [photoUri, setPhotoUri] = useState(user?.foto_perfil || null);
  const [loading, setLoading] = useState(false);
  const { onPhotoSelected } = route.params || {};

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos permisos para acceder a la cámara y galería de fotos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const selectFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileName = `profile_${user.id}_${Date.now()}.jpg`;
      const filePath = `profiles/${fileName}`;

      const { data, error } = await supabase.storage
        .from('fotos_perfil')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('fotos_perfil')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  };

  const savePhoto = async () => {
    if (!photoUri) {
      Alert.alert('Error', 'Por favor selecciona una foto primero.');
      return;
    }

    setLoading(true);
    try {
      let photoUrl = photoUri;

      // Si es una nueva foto (no es una URL existente), subirla
      if (!photoUri.startsWith('http')) {
        photoUrl = await uploadPhoto(photoUri);
      }

      // Actualizar el perfil del usuario
      const { error } = await supabase
        .from('usuarios')
        .update({ foto_perfil: photoUrl })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Éxito', 'Foto de perfil actualizada correctamente.');

      if (onPhotoSelected) {
        onPhotoSelected(photoUrl);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la foto de perfil.');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = () => {
    Alert.alert(
      'Eliminar foto',
      '¿Estás seguro de que quieres eliminar tu foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('usuarios')
                .update({ foto_perfil: null })
                .eq('id', user.id);

              if (error) throw error;

              setPhotoUri(null);
              Alert.alert('Éxito', 'Foto de perfil eliminada.');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la foto.');
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
        <Appbar.Content title="Foto de Perfil" />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={styles.photoCard}>
          <Card.Content style={styles.photoContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Sin foto</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={takePhoto}
            style={styles.button}
            icon="camera"
          >
            Tomar Foto
          </Button>

          <Button
            mode="outlined"
            onPress={selectFromGallery}
            style={styles.button}
            icon="image"
          >
            Seleccionar de Galería
          </Button>

          {photoUri && (
            <Button
              mode="outlined"
              onPress={removePhoto}
              style={[styles.button, styles.removeButton]}
              icon="delete"
            >
              Eliminar Foto
            </Button>
          )}
        </View>

        <Button
          mode="contained"
          onPress={savePhoto}
          style={styles.saveButton}
          loading={loading}
          disabled={loading}
        >
          Guardar Foto
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  photoCard: { marginBottom: 20 },
  photoContainer: {
    alignItems: 'center',
    padding: 20,
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  placeholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    marginBottom: 10,
  },
  removeButton: {
    borderColor: '#d32f2f',
  },
  saveButton: {
    marginTop: 20,
  },
});