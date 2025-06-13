import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { X, Bell, BellOff, Smartphone, MessageSquare, Mail } from 'lucide-react-native';

interface AlertPreference {
  id: string;
  type: string;
  label: string;
  description: string;
  enabled: boolean;
  methods: {
    push: boolean;
    sms: boolean;
    email: boolean;
  };
}

interface WeatherAlertModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (preferences: AlertPreference[]) => void;
}

export default function WeatherAlertModal({ visible, onClose, onSave }: WeatherAlertModalProps) {
  const [alertPreferences, setAlertPreferences] = React.useState<AlertPreference[]>([
    {
      id: 'drought',
      type: 'drought',
      label: 'Alerte Sécheresse',
      description: 'Prévient quand les conditions sèches risquent d\'affecter vos cultures',
      enabled: true,
      methods: { push: true, sms: true, email: false },
    },
    {
      id: 'flood',
      type: 'flood',
      label: 'Alerte Inondation',
      description: 'Prévient des risques d\'inondation dans votre région',
      enabled: true,
      methods: { push: true, sms: true, email: false },
    },
    {
      id: 'storm',
      type: 'storm',
      label: 'Alerte Orage',
      description: 'Prévient des orages violents et vents forts',
      enabled: true,
      methods: { push: true, sms: false, email: false },
    },
    {
      id: 'heat',
      type: 'heat',
      label: 'Alerte Canicule',
      description: 'Prévient des vagues de chaleur extrême',
      enabled: true,
      methods: { push: true, sms: false, email: false },
    },
    {
      id: 'frost',
      type: 'frost',
      label: 'Alerte Gel',
      description: 'Prévient des risques de gel (rare mais possible)',
      enabled: false,
      methods: { push: true, sms: false, email: false },
    },
    {
      id: 'wind',
      type: 'wind',
      label: 'Alerte Vent Fort',
      description: 'Prévient des vents forts (Harmattan, tempêtes)',
      enabled: true,
      methods: { push: true, sms: false, email: false },
    },
  ]);

  const toggleAlert = (id: string) => {
    setAlertPreferences(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
      )
    );
  };

  const toggleMethod = (alertId: string, method: 'push' | 'sms' | 'email') => {
    setAlertPreferences(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? {
              ...alert,
              methods: { ...alert.methods, [method]: !alert.methods[method] },
            }
          : alert
      )
    );
  };

  const handleSave = () => {
    onSave(alertPreferences);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Configuration des Alertes</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              Configurez les alertes météo que vous souhaitez recevoir et choisissez comment être notifié.
            </Text>

            {alertPreferences.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertLabel}>{alert.label}</Text>
                    <Text style={styles.alertDescription}>{alert.description}</Text>
                  </View>
                  <Switch
                    value={alert.enabled}
                    onValueChange={() => toggleAlert(alert.id)}
                    trackColor={{ false: '#E5E7EB', true: '#16A34A' }}
                    thumbColor={alert.enabled ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>

                {alert.enabled && (
                  <View style={styles.methodsContainer}>
                    <Text style={styles.methodsTitle}>Méthodes de notification :</Text>
                    <View style={styles.methodsGrid}>
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          alert.methods.push && styles.methodButtonActive,
                        ]}
                        onPress={() => toggleMethod(alert.id, 'push')}
                      >
                        <Smartphone
                          size={16}
                          color={alert.methods.push ? '#FFFFFF' : '#6B7280'}
                        />
                        <Text
                          style={[
                            styles.methodText,
                            alert.methods.push && styles.methodTextActive,
                          ]}
                        >
                          Push
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          alert.methods.sms && styles.methodButtonActive,
                        ]}
                        onPress={() => toggleMethod(alert.id, 'sms')}
                      >
                        <MessageSquare
                          size={16}
                          color={alert.methods.sms ? '#FFFFFF' : '#6B7280'}
                        />
                        <Text
                          style={[
                            styles.methodText,
                            alert.methods.sms && styles.methodTextActive,
                          ]}
                        >
                          SMS
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          alert.methods.email && styles.methodButtonActive,
                        ]}
                        onPress={() => toggleMethod(alert.id, 'email')}
                      >
                        <Mail
                          size={16}
                          color={alert.methods.email ? '#FFFFFF' : '#6B7280'}
                        />
                        <Text
                          style={[
                            styles.methodText,
                            alert.methods.email && styles.methodTextActive,
                          ]}
                        >
                          Email
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}

            <View style={styles.infoSection}>
              <Bell size={20} color="#3B82F6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>À propos des alertes</Text>
                <Text style={styles.infoText}>
                  • Les alertes SMS sont utiles en zone de faible connexion internet{'\n'}
                  • Les notifications push nécessitent l'application installée{'\n'}
                  • Les alertes sont basées sur les données de NiMet{'\n'}
                  • Vous pouvez modifier ces paramètres à tout moment
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  alertCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  alertInfo: {
    flex: 1,
    marginRight: 12,
  },
  alertLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  alertDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  methodsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  methodsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  methodsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  methodButtonActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  methodText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  methodTextActive: {
    color: '#FFFFFF',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});