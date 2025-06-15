import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { Camera, Navigation, X } from 'lucide-react-native';
import { Categorie, Profile } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';

interface Props {
  formData: any;
  setFormData: (cb: (prev: any) => any) => void;
  formErrors: Record<string, string>;
  categories: Categorie[];
  profile: Profile | null;
  editingAnnonce: string | null;
  pickImage: () => void;
  removeImage: (index: number) => void;
  uploadingImage: boolean;
  handleSubmit: () => void;
  resetForm: () => void;
  onCancel: () => void;
}

/**
 * ProductForm regroupe le formulaire de création/modification d'une annonce.
 * Le champ "unité" est désormais une liste déroulante avec les valeurs courantes.
 */
export default function ProductForm(props: Props) {
  const {
    formData,
    setFormData,
    formErrors,
    categories,
    profile,
    editingAnnonce,
    pickImage,
    removeImage,
    uploadingImage,
    handleSubmit,
    resetForm,
    onCancel,
  } = props;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={() => { resetForm(); onCancel(); }}>
          <Text style={styles.cancelButton}>Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>{editingAnnonce ? "Modifier l'annonce" : 'Vendre un Produit'}</Text>
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={styles.saveButton}>{editingAnnonce ? 'Modifier' : 'Publier'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Photos du produit *</Text>
          <Text style={styles.formSubLabel}>Ajoutez jusqu'à 5 photos (recommandé: 3-5 photos)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
            {formData.images.map((uri: string, index: number) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
            {formData.images.length < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage} disabled={uploadingImage}>
                {uploadingImage ? (
                  <ActivityIndicator color="#6B7280" />
                ) : (
                  <>
                    <Camera size={24} color="#6B7280" />
                    <Text style={styles.addImageText}>Ajouter</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
          {formErrors.images && <Text style={styles.errorText}>{formErrors.images}</Text>}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Nom du produit *</Text>
          <TextInput
            style={[styles.textInput, formErrors.titre && styles.textInputError]}
            placeholder="Ex: Tomates fraîches"
            placeholderTextColor="#9CA3AF"
            value={formData.titre}
            onChangeText={(text) => setFormData((prev: any) => ({ ...prev, titre: text }))}
          />
          {formErrors.titre && <Text style={styles.errorText}>{formErrors.titre}</Text>}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Catégorie *</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryOption, formData.categorie_id === category.id && styles.categoryOptionSelected]}
                onPress={() => setFormData((prev: any) => ({ ...prev, categorie_id: category.id }))}
              >
                <Text style={[styles.categoryOptionText, formData.categorie_id === category.id && styles.categoryOptionTextSelected]}>
                  {category.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {formErrors.categorie_id && <Text style={styles.errorText}>{formErrors.categorie_id}</Text>}
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formSection, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.formLabel}>Prix *</Text>
            <TextInput
              style={[styles.textInput, formErrors.prix && styles.textInputError]}
              placeholder="500"
              placeholderTextColor="#9CA3AF"
              value={formData.prix}
              onChangeText={(text) => setFormData((prev: any) => ({ ...prev, prix: text }))}
              keyboardType="numeric"
            />
            {formErrors.prix && <Text style={styles.errorText}>{formErrors.prix}</Text>}
          </View>
          <View style={[styles.formSection, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.formLabel}>Unité *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.unite_prix}
                onValueChange={(itemValue) => setFormData((prev: any) => ({ ...prev, unite_prix: itemValue }))}
              >
                {['₦/kg','₦/g','₦/sac','₦/tonne','₦/litre','₦/pièce'].map(u => (
                  <Picker.Item key={u} label={u} value={u} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Quantité disponible *</Text>
          <TextInput
            style={[styles.textInput, formErrors.quantite_disponible && styles.textInputError]}
            placeholder="50 kg"
            placeholderTextColor="#9CA3AF"
            value={formData.quantite_disponible}
            onChangeText={(text) => setFormData((prev: any) => ({ ...prev, quantite_disponible: text }))}
          />
          {formErrors.quantite_disponible && <Text style={styles.errorText}>{formErrors.quantite_disponible}</Text>}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Décrivez votre produit..."
            placeholderTextColor="#9CA3AF"
            value={formData.description}
            onChangeText={(text) => setFormData((prev: any) => ({ ...prev, description: text }))}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Localisation</Text>
          <View style={styles.locationInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={profile?.etat ? `${profile.etat}, Nigeria` : 'Ex: Kano, Nigeria'}
              placeholderTextColor="#9CA3AF"
              value={formData.localisation}
              onChangeText={(text) => setFormData((prev: any) => ({ ...prev, localisation: text }))}
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => {
                if (profile?.etat) {
                  setFormData((prev: any) => ({ ...prev, localisation: `${profile.etat}, Nigeria` }));
                }
              }}
            >
              <Navigation size={16} color="#16A34A" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.publishButton} onPress={handleSubmit}>
          <Text style={styles.publishButtonText}>{editingAnnonce ? "Modifier l'annonce" : 'Publier mon annonce'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  cancelButton: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#DC2626' },
  formTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#111827' },
  saveButton: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#16A34A' },
  formContent: { paddingHorizontal: 20 },
  formSection: { marginBottom: 16 },
  formLabel: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#111827', marginBottom: 8 },
  formSubLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#6B7280', marginBottom: 12 },
  textInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Inter-Regular', fontSize: 16, color: '#111827' },
  textInputError: { borderColor: '#DC2626' },
  textArea: { height: 100, textAlignVertical: 'top' },
  errorText: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#DC2626', marginTop: 4 },
  imageContainer: { flexDirection: 'row' },
  imageWrapper: { position: 'relative', marginRight: 12 },
  previewImage: { width: 80, height: 80, borderRadius: 8 },
  removeImageButton: { position: 'absolute', top: -8, right: -8, backgroundColor: '#DC2626', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  addImageButton: { width: 80, height: 80, borderRadius: 8, borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  addImageText: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#6B7280', marginTop: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryOption: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  categoryOptionSelected: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  categoryOptionText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#111827' },
  categoryOptionTextSelected: { color: '#FFFFFF' },
  formRow: { flexDirection: 'row' },
  pickerWrapper: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, overflow: 'hidden' },
  locationInputContainer: { flexDirection: 'row', alignItems: 'center' },
  locationButton: { position: 'absolute', right: 12, padding: 8 },
  publishButton: { backgroundColor: '#16A34A', paddingVertical: 16, borderRadius: 16, marginBottom: 40 },
  publishButtonText: { fontFamily: 'Inter-Bold', fontSize: 16, color: '#FFFFFF', textAlign: 'center' },
});
