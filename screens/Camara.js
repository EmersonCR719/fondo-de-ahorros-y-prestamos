import { StatusBar } from 'expo-status-bar';
import React, {useState, useEffect} from "react";
import {View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, } from 'react-native';
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
 
export default function clase() {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
 
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === "granted" && mediaStatus.status === "granted");
    })();
  }, []);
 
  const takePhoto = async () => {
    if (!hasPermission) {
      alert("La app necesita permisos para usar la cámara y guardar fotos.");
      return;
    }
 
    setLoading(true);
    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });
 
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
 
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync("Mis Fotos", asset, false);
 
        console.log(" Foto guardada:", uri);
      }
    } catch (error) {
      console.error("Error al tomar la foto:", error);
    } finally {
      setLoading(false);
    }
  };
 
  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5252" />
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
      <Text style={styles.title}>Mi primera APP utilizando la Cámara</Text>
 
      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <Text style={styles.buttonText}>Abrir Cámara</Text>
      </TouchableOpacity>
 
      {loading && <ActivityIndicator size="large" color="#FF5252" style={{marginTop:20}}/>}

      {/* Aquí añadimos la vista previa de la foto */}
      {imageUri && (
        <View style={styles.imageContainer}>
          <Text style={styles.previewText}>Foto tomada:</Text>
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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title:{fontSize:25, fontWeight:"bold", marginBottom:20},
  button:{
    backgroundColor:"#FF5252",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius:10,
  },
  buttonText: { color: "#fff", fontSize: 18 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageContainer: { marginTop: 20, alignItems: "center" },
  previewText: { fontSize: 16, marginBottom: 10 },
  imagePreview: { width: 300, height: 400, borderRadius: 10 },
});
