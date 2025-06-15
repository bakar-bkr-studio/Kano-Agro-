import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  locationFilter: any;
  setLocationFilter: (cb: (prev: any) => any) => void;
  priceRange: { min: string; max: string };
  setPriceRange: (cb: (prev: any) => any) => void;
}

/**
 * FiltersModal regroupe les filtres de recherche des annonces.
 */
export default function FiltersModal({ visible, onClose, locationFilter, setLocationFilter, priceRange, setPriceRange }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtres</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Localisation</Text>
              <TextInput
                style={styles.input}
                placeholder="État (ex: Kano)"
                value={locationFilter.etat || ''}
                onChangeText={text => setLocationFilter((prev:any) => ({ ...prev, etat: text }))}
              />
              <TextInput
                style={styles.input}
                placeholder="LGA"
                value={locationFilter.lga || ''}
                onChangeText={text => setLocationFilter((prev:any) => ({ ...prev, lga: text }))}
              />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fourchette de prix (₦)</Text>
              <View style={{ flexDirection: 'row' }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Min"
                  value={priceRange.min}
                  onChangeText={text => setPriceRange((prev) => ({ ...prev, min: text }))}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: 8 }]}
                  placeholder="Max"
                  value={priceRange.max}
                  onChangeText={text => setPriceRange((prev) => ({ ...prev, max: text }))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.clear} onPress={() => { setLocationFilter({}); setPriceRange({ min: '', max: '' }); }}>
              <Text style={styles.clearText}>Effacer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.apply} onPress={onClose}>
              <Text style={styles.applyText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#111827' },
  content: { paddingHorizontal: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#111827', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Inter-Regular', fontSize: 16, color: '#111827', marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  clear: { padding: 12 },
  clearText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#DC2626' },
  apply: { backgroundColor: '#16A34A', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  applyText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#FFFFFF' },
});
