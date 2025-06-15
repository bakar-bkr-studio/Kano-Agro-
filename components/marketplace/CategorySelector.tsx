import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Categorie } from '@/lib/supabase';

interface Props {
  categories: Categorie[];
  selected: string;
  onSelect: (id: string) => void;
}

/**
 * CategorySelector affiche la barre horizontale des catégories.
 * Elle est compacte pour un meilleur rendu sur mobile.
 */
export default function CategorySelector({ categories, selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {categories.map(cat => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.card, selected === cat.id && styles.active]}
          onPress={() => onSelect(cat.id)}
        >
          <Text style={[styles.text, selected === cat.id && styles.textActive]}>{cat.nom}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  card: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
  active: { backgroundColor: '#16A34A' },
  text: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#16A34A' },
  textActive: { color: '#FFFFFF' },
});
