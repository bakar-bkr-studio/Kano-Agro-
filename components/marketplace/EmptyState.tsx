import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Package, Plus } from 'lucide-react-native';

interface Props {
  message: string;
  onSell?: () => void;
}

/**
 * EmptyState s'affiche lorsqu'aucune annonce n'est disponible.
 */
export default function EmptyState({ message, onSell }: Props) {
  return (
    <View style={styles.container}>
      <Package size={48} color="#6B7280" />
      <Text style={styles.title}>Aucun produit trouvé</Text>
      <Text style={styles.text}>{message}</Text>
      {onSell && (
        <TouchableOpacity style={styles.button} onPress={onSell}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.buttonText}>Être le premier à vendre</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 40 },
  title: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#111827', marginTop: 16, marginBottom: 8 },
  text: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 40, marginBottom: 16 },
  button: { backgroundColor: '#16A34A', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  buttonText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#FFFFFF', marginLeft: 4 },
});
