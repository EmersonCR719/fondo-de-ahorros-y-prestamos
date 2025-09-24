import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";

export default function Camara() {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(cameraStatus === "granted" && mediaStatus === "granted");
    })();
  }, []);

  const takePhoto = async () => {
    if (!hasPermission) {
      alert("La app necesita permisos para usar la cámara y la galería.");
      return;
    }

    setLoading(true);
    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // cuadrado para foto de perfil
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);

        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync("Mis Fotos", asset, false);

        console.log("Foto tomada:", uri);
      }
    } catch (error) {
      console.error("Error al tomar la foto:", error);
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    if (!hasPermission) {
      alert("La app necesita permisos para usar la galería.");
      return;
    }

    setLoading(true);
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1], // cuadrado para foto de perfil
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        console.log("Foto seleccionada:", uri);
      }
    } catch (error) {
      console.error("Error al seleccionar foto:", error);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text>Cargando permisos…</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ textAlign: "center" }}>
          No tienes permisos de cámara y galería. Por favor actívalos en la configuración.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Elige tu foto de perfil</Text>

      {/* Botones de acción */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Usar Cámara</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={pickFromGallery}>
          <Text style={styles.buttonText}>Galería</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#00C853" style={{ marginTop: 20 }} />}

      {/* Vista previa de la foto */}
      {imageUri && (
        <View style={styles.imageContainer}>
          <Text style={styles.previewText}>Vista previa:</Text>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333" },
  buttonRow: { flexDirection: "row", marginBottom: 20 },
  button: {
    backgroundColor: "#00C853", // verde principal de tu app
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  secondaryButton: {
    backgroundColor: "#FF5252", // rojo secundario
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageContainer: { marginTop: 20, alignItems: "center" },
  previewText: { fontSize: 16, marginBottom: 10, color: "#555" },
  imagePreview: { width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: "#00C853" },
});
