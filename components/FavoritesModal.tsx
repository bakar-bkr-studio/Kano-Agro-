import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';

export interface FavoriteItem {
  id: string;
  titre: string;
  image?: string;
}

interface FavoritesModalProps {
  visible: boolean;
  favorites: FavoriteItem[];
  onClose: () => void;
  onSelect: (id: string) => void;
}

export default function FavoritesModal({
  visible,
  favorites,
  onClose,
  onSelect,
}: FavoritesModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Mes Favoris</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.list}>
            {favorites.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Aucun favori pour l'instant</Text>
              </View>
            ) : (
              favorites.map((fav) => (
                <TouchableOpacity key={fav.id} style={styles.item} onPress={() => onSelect(fav.id)}>
                  {fav.image ? (
                    <Image source={{ uri: fav.image }} style={styles.image} />
                  ) : (
                    <View style={styles.placeholder} />
                  )}
                  <Text style={styles.itemTitle}>{fav.titre}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  title: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#111827' },
  list: { paddingHorizontal: 20, paddingVertical: 16 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#6B7280' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  image: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  placeholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  itemTitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#111827' },
});
