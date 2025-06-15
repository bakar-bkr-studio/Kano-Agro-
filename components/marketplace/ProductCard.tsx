import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, AlertTriangle, Leaf, ShoppingCart, Edit3, Trash2 } from 'lucide-react-native';
import { AnnonceWithProfile } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface ProductCardProps {
  annonce: AnnonceWithProfile;
  user: User | null;
  distanceText: string | null;
  onEdit: (annonce: AnnonceWithProfile) => void;
  onDelete: (id: string) => void;
  onBuy: (annonce: AnnonceWithProfile) => void;
  onReport: (id: string) => void;
  onRequireAuth: () => void;
}

/**
 * ProductCard affiche une annonce individuelle dans la liste.
 * Les actions d'achat et le nom du vendeur sont masqués si l'utilisateur n'est pas connecté.
 */
export default function ProductCard({
  annonce,
  user,
  distanceText,
  onEdit,
  onDelete,
  onBuy,
  onReport,
  onRequireAuth,
}: ProductCardProps) {
  const isOwner = user?.id === annonce.vendeur_id;
  const handleBuyPress = () => {
    if (!user) return onRequireAuth();
    onBuy(annonce);
  };
  const handleSellerPress = () => {
    if (!user) return onRequireAuth();
  };
  return (
    <View style={styles.card}>
      {annonce.images && annonce.images[0] ? (
        <Image source={{ uri: annonce.images[0] }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Leaf size={32} color="#6B7280" />
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.name}>{annonce.titre}</Text>
          <TouchableOpacity style={styles.report} onPress={() => onReport(annonce.id)}>
            <AlertTriangle size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <Text style={styles.price}>{annonce.prix} {annonce.unite_prix}</Text>
        <View style={styles.sellerRow}>
          <TouchableOpacity onPress={handleSellerPress}>
            <Text style={styles.sellerName}>
              {user ? annonce.profiles?.nom_complet || 'Vendeur anonyme' : '******'}
            </Text>
          </TouchableOpacity>
        </View>
        {annonce.localisation && (
          <View style={styles.locationRow}>
            <MapPin size={12} color="#6B7280" />
            <Text style={styles.location}>{annonce.localisation}</Text>
            {distanceText && <Text style={styles.distance}> • {distanceText}</Text>}
          </View>
        )}
        <Text style={styles.stock}>{annonce.quantite_disponible} disponibles</Text>
        {isOwner ? (
          <View style={styles.ownerActions}>
            <TouchableOpacity style={styles.editButton} onPress={() => onEdit(annonce)}>
              <Edit3 size={16} color="#3B82F6" />
              <Text style={styles.editText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(annonce.id)}>
              <Trash2 size={16} color="#DC2626" />
              <Text style={styles.deleteText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buyerActions}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={user ? () => {} : onRequireAuth}
            >
              <Text style={styles.contactText}>Contacter</Text>
            </TouchableOpacity>
            {user && (
              <TouchableOpacity style={styles.buyButton} onPress={handleBuyPress}>
                <ShoppingCart size={16} color="#FFFFFF" />
                <Text style={styles.buyText}>Acheter</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  image: { width: 100, height: 140 },
  placeholder: {
    width: 100,
    height: 140,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#111827', flex: 1, marginRight: 8 },
  report: { padding: 4 },
  price: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#16A34A', marginBottom: 8 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sellerName: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#374151' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  location: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#6B7280', marginLeft: 4 },
  distance: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#16A34A' },
  stock: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#059669', marginBottom: 12 },
  ownerActions: { flexDirection: 'row', gap: 8 },
  buyerActions: { flexDirection: 'row', gap: 8 },
  editButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, flex: 1, justifyContent: 'center' },
  editText: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#3B82F6', marginLeft: 4 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, flex: 1, justifyContent: 'center' },
  deleteText: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#DC2626', marginLeft: 4 },
  contactButton: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  contactText: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#374151' },
  buyButton: { flex: 1, backgroundColor: '#16A34A', paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buyText: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#FFFFFF', marginLeft: 4 },
});
