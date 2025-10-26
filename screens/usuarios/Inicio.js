import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function Inicio({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/budget.png')}
          style={styles.logo}
        />
        <Text style={styles.headerText}>FAP</Text>
        <Text style={styles.subHeader}>Fondo de ahorros y prestamos</Text>
      </View>

      {/* Imagen principal */}
      <Image
        source={require('../../assets/pigImg.jpg')}
        style={styles.pigImage}
      />

      {/* Botón con navegación */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Login')} 
      >
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>

      {/* Texto pequeño debajo */}
      <Text style={styles.footerText}>
        Realiza tus ahorros de la mejor forma con nosotros
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    backgroundColor: '#00C853',
    paddingVertical: 40,
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  subHeader: {
    fontSize: 14,
    color: '#000',
    marginTop: 2,
  },
  pigImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginVertical: 80,
  },
  button: {
    backgroundColor: '#00C853',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 12,
    color: '#333',
    marginTop: 10,
  },
});
