import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

const NOTIFICATION_STORAGE_KEY = 'notification_settings';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request permissions
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

// Save notification settings
export const saveNotificationSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
};

// Get notification settings
export const getNotificationSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return settings ? JSON.parse(settings) : {
      meetingReminders: true,
      paymentReminders: true,
      loanReminders: true,
      savingsReminders: true,
      generalNotifications: true,
    };
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return {
      meetingReminders: true,
      paymentReminders: true,
      loanReminders: true,
      savingsReminders: true,
      generalNotifications: true,
    };
  }
};

// Schedule meeting reminder
export const scheduleMeetingReminder = async (meeting) => {
  const settings = await getNotificationSettings();
  if (!settings.meetingReminders) return;

  try {
    // Calculate reminder time (1 hour before meeting)
    const meetingDateTime = new Date(`${meeting.fecha}T${meeting.hora}`);
    const reminderTime = new Date(meetingDateTime.getTime() - (60 * 60 * 1000)); // 1 hour before

    // Only schedule if reminder time is in the future
    if (reminderTime > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recordatorio de Reunión',
          body: `Tienes una reunión programada: ${meeting.titulo}`,
          data: { meetingId: meeting.id, type: 'meeting_reminder' },
        },
        trigger: reminderTime,
      });
    }

    // Also schedule attendance reminder (15 minutes before)
    const attendanceReminder = new Date(meetingDateTime.getTime() - (15 * 60 * 1000));
    if (attendanceReminder > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Asistencia a Reunión',
          body: `Recuerda registrar tu asistencia a: ${meeting.titulo}`,
          data: { meetingId: meeting.id, type: 'attendance_reminder' },
        },
        trigger: attendanceReminder,
      });
    }
  } catch (error) {
    console.error('Error scheduling meeting reminder:', error);
  }
};

// Schedule payment reminder
export const schedulePaymentReminder = async (title, body, triggerDate, data = {}) => {
  const settings = await getNotificationSettings();
  if (!settings.paymentReminders) return;

  try {
    if (triggerDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { ...data, type: 'payment_reminder' },
        },
        trigger: triggerDate,
      });
    }
  } catch (error) {
    console.error('Error scheduling payment reminder:', error);
  }
};

// Schedule loan reminder
export const scheduleLoanReminder = async (loan, daysBeforeDue = 3) => {
  const settings = await getNotificationSettings();
  if (!settings.loanReminders) return;

  try {
    // Calculate next payment due date (simplified - monthly payments)
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    nextPaymentDate.setDate(1); // First day of next month

    const reminderDate = new Date(nextPaymentDate.getTime() - (daysBeforeDue * 24 * 60 * 60 * 1000));

    if (reminderDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recordatorio de Pago de Préstamo',
          body: `Tu próximo pago de $${calculateMonthlyPayment(loan).toLocaleString()} vence pronto`,
          data: { loanId: loan.id, type: 'loan_reminder' },
        },
        trigger: reminderDate,
      });
    }
  } catch (error) {
    console.error('Error scheduling loan reminder:', error);
  }
};

// Schedule savings reminder
export const scheduleSavingsReminder = async (userId) => {
  const settings = await getNotificationSettings();
  if (!settings.savingsReminders) return;

  try {
    // Schedule monthly savings reminder (first day of each month)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio de Ahorro',
        body: 'Es momento de hacer tu aporte mensual al ahorro',
        data: { userId, type: 'savings_reminder' },
      },
      trigger: nextMonth,
    });
  } catch (error) {
    console.error('Error scheduling savings reminder:', error);
  }
};

// Send immediate notification
export const sendImmediateNotification = async (title, body, data = {}) => {
  const settings = await getNotificationSettings();
  if (!settings.generalNotifications) return;

  try {
    await Notifications.presentNotificationAsync({
      title,
      body,
      data,
    });
  } catch (error) {
    console.error('Error sending immediate notification:', error);
  }
};

// Calculate monthly payment for loan
const calculateMonthlyPayment = (loan) => {
  const principal = loan.monto_solicitado;
  const annualRate = loan.tasa_interes;
  const monthlyRate = annualRate / 12;
  const termMonths = 12; // Assuming 1-year loans

  if (monthlyRate === 0) return principal / termMonths;

  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
         (Math.pow(1 + monthlyRate, termMonths) - 1);
};

// Cancel all notifications
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

// Get scheduled notifications
export const getScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Initialize notification service
export const initializeNotifications = async () => {
  try {
    const settings = await Notifications.getPermissionsAsync();
    return settings.granted;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
};

// Schedule recurring reminders for active user
export const scheduleUserReminders = async (user) => {
  if (!user) return;

  try {
    // Cancel existing notifications first
    await cancelAllNotifications();

    // Schedule savings reminder
    await scheduleSavingsReminder(user.id);

    // Schedule loan reminders for active loans
    const { data: activeLoans } = await supabase
      .from('prestamos')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('estado', 'aprobado');

    for (const loan of activeLoans || []) {
      await scheduleLoanReminder(loan);
    }

    // Schedule meeting reminders for upcoming meetings
    const today = new Date().toISOString().split('T')[0];
    const { data: upcomingMeetings } = await supabase
      .from('reuniones')
      .select('*')
      .eq('estado', 'programada')
      .gte('fecha', today)
      .order('fecha', { ascending: true })
      .limit(5); // Next 5 meetings

    for (const meeting of upcomingMeetings || []) {
      await scheduleMeetingReminder(meeting);
    }

  } catch (error) {
    console.error('Error scheduling user reminders:', error);
  }
};