import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { X, CheckCircle } from 'lucide-react-native';

interface SortOption {
  key: string;
  label: string;
  icon: any;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  options: SortOption[];
  selected: string;
  onSelect: (key: string) => void;
}

/**
 * SortModal permet à l'utilisateur de choisir l'ordre d'affichage des annonces.
 */
export default function SortModal({ visible, onClose, options, selected, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Trier par</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {options.map(opt => {
            const Icon = opt.icon;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.option, selected === opt.key && styles.optionSelected]}
                onPress={() => { onSelect(opt.key); onClose(); }}
              >
                <Icon size={20} color={selected === opt.key ? '#16A34A' : '#6B7280'} />
                <Text style={[styles.optionText, selected === opt.key && styles.optionTextSelected]}>
                  {opt.label}
                </Text>
                {selected === opt.key && <CheckCircle size={20} color="#16A34A" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#111827' },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  optionSelected: { backgroundColor: '#F0FDF4' },
  optionText: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: '#111827' },
  optionTextSelected: { color: '#16A34A' },
});
