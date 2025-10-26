import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Appbar, Text, Button, Card, List, Divider } from 'react-native-paper';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../supabase';

export default function QRScanner({ navigation, route }) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scanType, setScanType] = useState('payment'); // payment, identification, loan_payment
  const [recentScans, setRecentScans] = useState([]);

  useEffect(() => {
    // Permissions removed - expo-barcode-scanner dependency removed
    setHasPermission(false); // Disable scanner functionality

    loadRecentScans();
  }, []);

  const loadRecentScans = async () => {
    try {
      const { data, error } = await supabase
        .from('escanes_qr')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentScans(data || []);
    } catch (error) {
      console.error('Error loading recent scans:', error);
    }
  };

  // handleBarCodeScanned function removed - expo-barcode-scanner dependency removed

  // processQRData function removed - expo-barcode-scanner dependency removed

  // processPayment function removed - expo-barcode-scanner dependency removed

  // processIdentification function removed - expo-barcode-scanner dependency removed

  // processLoanPayment function removed - expo-barcode-scanner dependency removed

  // logQRScan function removed - expo-barcode-scanner dependency removed

  const getScanTypeText = (type) => {
    switch (type) {
      case 'payment': return 'Pago';
      case 'identification': return 'Identificación';
      case 'loan_payment': return 'Pago de Préstamo';
      default: return type;
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Escáner QR" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>Solicitando permisos de cámara...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Escáner QR" />
        </Appbar.Header>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Se requieren permisos de cámara para escanear códigos QR
          </Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Volver
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Escáner QR" />
      </Appbar.Header>

      <View style={styles.content}>
        {/* Scan Type Selector */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.scanTypeContainer}>
              <TouchableOpacity
                style={[styles.scanTypeButton, scanType === 'payment' && styles.activeScanType]}
                onPress={() => setScanType('payment')}
              >
                <Text style={[styles.scanTypeText, scanType === 'payment' && styles.activeScanTypeText]}>
                  Pago
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scanTypeButton, scanType === 'identification' && styles.activeScanType]}
                onPress={() => setScanType('identification')}
              >
                <Text style={[styles.scanTypeText, scanType === 'identification' && styles.activeScanTypeText]}>
                  Identificación
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scanTypeButton, scanType === 'loan_payment' && styles.activeScanType]}
                onPress={() => setScanType('loan_payment')}
              >
                <Text style={[styles.scanTypeText, scanType === 'loan_payment' && styles.activeScanTypeText]}>
                  Pago Préstamo
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Scanner */}
        <Card style={styles.scannerCard}>
          <Card.Content style={styles.scannerContainer}>
            <View style={styles.scannedContainer}>
              <Text style={styles.scannedText}>Escáner QR no disponible</Text>
              <Text style={styles.instructionText}>
                La funcionalidad de escáner QR ha sido deshabilitada temporalmente.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Instructions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.instructionTitle}>
              Funcionalidad deshabilitada
            </Text>
            <Text style={styles.instructionText}>
              El escáner QR está temporalmente fuera de servicio. Contacta al administrador para más información.
            </Text>
          </Card.Content>
        </Card>

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Escaneos Recientes" />
            <Card.Content>
              {recentScans.slice(0, 5).map((scan, index) => (
                <View key={scan.id}>
                  <List.Item
                    title={`${getScanTypeText(scan.tipo_escan)} - ${new Date(scan.fecha_escan).toLocaleDateString()}`}
                    description={scan.resultado?.message || 'Escaneo procesado'}
                  />
                  {index < Math.min(recentScans.length - 1, 4) && <Divider />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  card: { marginBottom: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  scanTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scanTypeButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
    alignItems: 'center',
  },
  activeScanType: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  scanTypeText: {
    fontSize: 12,
    color: '#666',
  },
  activeScanTypeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scannerCard: { marginBottom: 16 },
  scannerContainer: {
    alignItems: 'center',
    padding: 10,
  },
  scanner: {
    width: 300,
    height: 300,
  },
  scannedContainer: {
    alignItems: 'center',
    padding: 20,
  },
  scannedText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#4CAF50',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});