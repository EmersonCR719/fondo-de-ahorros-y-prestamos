import React, { useRef, useState } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { Appbar, Text, Button, Card } from 'react-native-paper';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';
import Svg, { Path } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const signatureWidth = screenWidth - 64;
const signatureHeight = 300;

export default function SignatureCapture({ navigation, route }) {
  const { user } = useAuth();
  const [signature, setSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const { onSignatureCaptured, context = 'general' } = route.params || {};

  const handleTouchStart = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const newPath = `M ${locationX} ${locationY}`;
    setCurrentPath(newPath);
    setIsDrawing(true);
  };

  const handleTouchMove = (event) => {
    if (!isDrawing) return;

    const { locationX, locationY } = event.nativeEvent;
    const newPath = `${currentPath} L ${locationX} ${locationY}`;
    setCurrentPath(newPath);
  };

  const handleTouchEnd = () => {
    if (isDrawing) {
      setSignature(signature + currentPath);
      setCurrentPath('');
      setIsDrawing(false);
    }
  };

  const clearSignature = () => {
    setSignature('');
    setCurrentPath('');
    setIsDrawing(false);
  };

  const saveSignature = async () => {
    if (!signature.trim()) {
      Alert.alert('Error', 'Por favor firma antes de guardar');
      return;
    }

    setLoading(true);
    try {
      // Convert SVG path to base64 image (simplified approach)
      const svgData = `
        <svg width="${signatureWidth}" height="${signatureHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="white"/>
          <path d="${signature}" stroke="black" stroke-width="2" fill="none"/>
        </svg>
      `;

      // Convert SVG to blob
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });

      // Upload to Supabase Storage
      const fileName = `signature_${user.id}_${context}_${Date.now()}.svg`;
      const filePath = `firmas/${fileName}`;

      const { data, error } = await supabase.storage
        .from('firmas_digitales')
        .upload(filePath, svgBlob, {
          contentType: 'image/svg+xml',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('firmas_digitales')
        .getPublicUrl(filePath);

      const signatureUrl = urlData.publicUrl;

      // Save signature record
      const { error: dbError } = await supabase
        .from('firmas_digitales')
        .insert({
          usuario_id: user.id,
          firma_url: signatureUrl,
          contexto: context,
          fecha_firma: new Date().toISOString(),
          created_at: new Date(),
        });

      if (dbError) throw dbError;

      Alert.alert('Éxito', 'Firma guardada correctamente');

      if (onSignatureCaptured) {
        onSignatureCaptured(signatureUrl);
      }

      navigation.goBack();

    } catch (error) {
      console.error('Error saving signature:', error);
      Alert.alert('Error', 'No se pudo guardar la firma');
    } finally {
      setLoading(false);
    }
  };

  const getContextTitle = () => {
    switch (context) {
      case 'savings':
        return 'Firma para Ahorro';
      case 'loan':
        return 'Firma para Préstamo';
      case 'loan_payment':
        return 'Firma para Pago de Préstamo';
      default:
        return 'Captura de Firma';
    }
  };

  const getContextDescription = () => {
    switch (context) {
      case 'savings':
        return 'Firma para confirmar el depósito de ahorro';
      case 'loan':
        return 'Firma para aceptar los términos del préstamo';
      case 'loan_payment':
        return 'Firma para confirmar el pago del préstamo';
      default:
        return 'Por favor firma en el área designada';
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={getContextTitle()} />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={styles.instructionCard}>
          <Card.Content>
            <Text style={styles.instructionTitle}>Instrucciones</Text>
            <Text style={styles.instructionText}>
              {getContextDescription()}. Usa tu dedo para firmar en el área blanca.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.signatureCard}>
          <Card.Content style={styles.signatureContainer}>
            <View
              style={styles.signatureArea}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <Svg width={signatureWidth} height={signatureHeight}>
                <Path
                  d={signature}
                  stroke="black"
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {isDrawing && (
                  <Path
                    d={currentPath}
                    stroke="black"
                    strokeWidth={2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </Svg>

              {!signature && !isDrawing && (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>Firma aquí</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={clearSignature}
            style={styles.button}
            disabled={!signature && !isDrawing}
          >
            Limpiar
          </Button>

          <Button
            mode="contained"
            onPress={saveSignature}
            loading={loading}
            disabled={loading || (!signature && !isDrawing)}
            style={styles.button}
          >
            Guardar Firma
          </Button>
        </View>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>Información Legal</Text>
            <Text style={styles.infoText}>
              Esta firma digital tiene el mismo valor legal que una firma manuscrita
              y será almacenada de forma segura para verificar la autenticidad de tus transacciones.
            </Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  instructionCard: { marginBottom: 16 },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  signatureCard: { marginBottom: 16 },
  signatureContainer: {
    alignItems: 'center',
    padding: 10,
  },
  signatureArea: {
    width: signatureWidth,
    height: signatureHeight,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    position: 'relative',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#ccc',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: { flex: 1, marginHorizontal: 4 },
  infoCard: { marginTop: 16 },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});