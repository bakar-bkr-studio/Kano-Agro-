import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { User } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
}

/**
 * AuthPrompt est affiché lorsque l'utilisateur tente une action réservée aux membres.
 */
export default function AuthPrompt({ visible, onClose, onLogin }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <User size={32} color="#6B7280" />
          <Text style={styles.title}>Pour effectuer une transaction, veuillez vous connecter.</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={onLogin}>
              <Text style={styles.buttonText}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onClose}>
              <Text style={[styles.buttonText, styles.cancelText]}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '80%', alignItems: 'center' },
  title: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#111827', textAlign: 'center', marginVertical: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  button: { backgroundColor: '#16A34A', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  buttonText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#FFFFFF' },
  cancel: { backgroundColor: '#F3F4F6' },
  cancelText: { color: '#111827' },
});
