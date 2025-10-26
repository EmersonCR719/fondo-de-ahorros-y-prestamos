import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Text, Button } from 'react-native-paper';

export default function TermsAndConditions({ navigation, route }) {
  const { onAccept } = route.params || {};

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Términos y Condiciones" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>TÉRMINOS Y CONDICIONES</Text>
        <Text style={styles.subtitle}>Fondo de Ahorros y Préstamos "FAP"</Text>

        <Text style={styles.sectionTitle}>1. ACEPTACIÓN DE TÉRMINOS</Text>
        <Text style={styles.text}>
          Al registrarse y utilizar la aplicación móvil del Fondo de Ahorros y Préstamos "FAP",
          usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con
          estos términos, no debe utilizar esta aplicación.
        </Text>

        <Text style={styles.sectionTitle}>2. REQUISITOS DE REGISTRO</Text>
        <Text style={styles.text}>
          • Debe ser mayor de 18 años.{'\n'}
          • Proporcionar información veraz y actualizada.{'\n'}
          • Mantener la confidencialidad de sus credenciales de acceso.{'\n'}
          • Aceptar los términos y condiciones para completar el registro.
        </Text>

        <Text style={styles.sectionTitle}>3. SERVICIOS OFRECIDOS</Text>
        <Text style={styles.text}>
          La aplicación permite:{'\n'}
          • Gestión de ahorros personales.{'\n'}
          • Solicitud y gestión de préstamos.{'\n'}
          • Programación y asistencia a reuniones.{'\n'}
          • Generación de estados de cuenta.{'\n'}
          • Reportes y estadísticas.
        </Text>

        <Text style={styles.sectionTitle}>4. AHORROS</Text>
        <Text style={styles.text}>
          • Los asociados deben cumplir con una cuota mínima mensual.{'\n'}
          • Los retiros antes de finalizar el año implican pérdida de ganancias.{'\n'}
          • Se cobra una cuota de manejo anual.{'\n'}
          • Los ahorros pueden ser presenciales o virtuales.
        </Text>

        <Text style={styles.sectionTitle}>5. PRÉSTAMOS</Text>
        <Text style={styles.text}>
          • Tasa de interés: 2% para asociados, 2.5% para clientes.{'\n'}
          • Los asociados pueden aprobar préstamos como codeudores.{'\n'}
          • Los abonos se registran con fecha y monto.{'\n'}
          • Las tasas pueden ajustarse anualmente por el administrador.
        </Text>

        <Text style={styles.sectionTitle}>6. REUNIONES</Text>
        <Text style={styles.text}>
          • Las reuniones pueden ser presenciales o virtuales.{'\n'}
          • La asistencia a reuniones presenciales requiere validación GPS.{'\n'}
          • Se aplican multas por inasistencia.{'\n'}
          • Se envían recordatorios por notificaciones push.
        </Text>

        <Text style={styles.sectionTitle}>7. PRIVACIDAD Y DATOS</Text>
        <Text style={styles.text}>
          • Sus datos personales serán tratados conforme a la ley de protección de datos.{'\n'}
          • Utilizamos GPS para validar ubicación en ahorros y reuniones.{'\n'}
          • Las fotos de perfil y firmas digitales son opcionales.{'\n'}
          • Puede solicitar la eliminación de sus datos en cualquier momento.
        </Text>

        <Text style={styles.sectionTitle}>8. RESPONSABILIDADES</Text>
        <Text style={styles.text}>
          • El usuario es responsable de la veracidad de la información proporcionada.{'\n'}
          • El fondo no se hace responsable por pérdidas derivadas de uso indebido.{'\n'}
          • Los asociados asumen responsabilidad solidaria en préstamos aprobados.
        </Text>

        <Text style={styles.sectionTitle}>9. MODIFICACIONES</Text>
        <Text style={styles.text}>
          El fondo se reserva el derecho de modificar estos términos en cualquier momento.
          Los cambios serán notificados a través de la aplicación.
        </Text>

        <Text style={styles.sectionTitle}>10. LEGISLACIÓN APLICABLE</Text>
        <Text style={styles.text}>
          Estos términos se rigen por las leyes de la República de Colombia.
          Cualquier disputa será resuelta en los tribunales competentes.
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleAccept}
            style={styles.acceptButton}
          >
            Aceptar Términos
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1976D2',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 15,
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 50,
  },
  acceptButton: {
    paddingVertical: 8,
  },
});