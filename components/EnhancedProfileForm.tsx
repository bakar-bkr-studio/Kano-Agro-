import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Building, 
  Globe, 
  Users, 
  Leaf,
  Camera,
  Navigation
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface EnhancedProfileFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EnhancedProfileForm({ visible, onClose, onSuccess }: EnhancedProfileFormProps) {
  const { user, createProfileIfMissing } = useAuth();
  const { etats, cultures, getCulturesByCategory, getEtatsByRegion } = useProfile();
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Obligatoires
    nom_complet: '',
    langue_preferee: 'Hausa' as 'Hausa' | 'Anglais' | 'Français',
    etat: '',
    sexe: '' as 'Homme' | 'Femme' | 'Préfère ne pas dire' | '',
    type_utilisateur: 'producteur' as 'producteur' | 'acheteur' | 'prestataire_service' | 'agent' | 'cooperative' | 'transformateur',
    
    // Optionnels
    nom_societe: '',
    telephone: '',
    lga: '',
    village_quartier: '',
    age_fourchette: '' as '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '65+' | '',
    cultures_pratiquees: [] as string[],
    superficie_fourchette: '' as 'Moins de 1 ha' | '1-3 ha' | '3-10 ha' | '10-50 ha' | 'Plus de 50 ha' | '',
    coordonnees_gps: null as { latitude: number; longitude: number } | null,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.nom_complet.trim()) {
        errors.nom_complet = 'Le nom complet est obligatoire';
      }
      if (!formData.langue_preferee) {
        errors.langue_preferee = 'Veuillez sélectionner une langue';
      }
      if (!formData.sexe) {
        errors.sexe = 'Veuillez indiquer votre sexe';
      }
    }

    if (step === 2) {
      if (!formData.etat) {
        errors.etat = 'Veuillez sélectionner votre état';
      }
      if (!formData.type_utilisateur) {
        errors.type_utilisateur = 'Veuillez sélectionner votre type d\'utilisateur';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès à la localisation est nécessaire pour cette fonctionnalité.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setFormData(prev => ({
        ...prev,
        coordonnees_gps: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
      }));

      Alert.alert('Succès', 'Position GPS enregistrée avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position GPS.');
    }
  };

  const toggleCulture = (cultureName: string) => {
    setFormData(prev => ({
      ...prev,
      cultures_pratiquees: prev.cultures_pratiquees.includes(cultureName)
        ? prev.cultures_pratiquees.filter(c => c !== cultureName)
        : [...prev.cultures_pratiquees, cultureName]
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        nom_complet: formData.nom_complet,
        nom_societe: formData.nom_societe === '' ? null : formData.nom_societe,
        telephone: formData.telephone === '' ? null : formData.telephone,
        langue_preferee: formData.langue_preferee,
        etat: formData.etat,
        lga: formData.lga === '' ? null : formData.lga,
        village_quartier: formData.village_quartier === '' ? null : formData.village_quartier,
        sexe: formData.sexe,
        age_fourchette: formData.age_fourchette === '' ? null : formData.age_fourchette,
        type_utilisateur: formData.type_utilisateur,
        cultures_pratiquees: formData.cultures_pratiquees,
        superficie_fourchette: formData.superficie_fourchette === '' ? null : formData.superficie_fourchette,
        coordonnees_gps: formData.coordonnees_gps ? 
          `(${formData.coordonnees_gps.latitude},${formData.coordonnees_gps.longitude})` : null,
      };

      const { error } = await createProfileIfMissing(profileData);
      
      if (error) {
        Alert.alert('Erreur', 'Impossible de créer le profil. Veuillez réessayer.');
      } else {
        Alert.alert('Succès', 'Profil créé avec succès !');
        onSuccess();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const culturesGrouped = getCulturesByCategory();
  const etatsGrouped = getEtatsByRegion();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>Profil Complet</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{currentStep}/3</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Informations Personnelles</Text>
            <Text style={styles.stepSubtitle}>Renseignez vos informations de base</Text>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Nom complet *</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#6B7280" />
                <TextInput
                  style={[styles.textInput, formErrors.nom_complet && styles.textInputError]}
                  placeholder="Votre nom complet"
                  placeholderTextColor="#9CA3AF"
                  value={formData.nom_complet}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, nom_complet: text }))}
                />
              </View>
              {formErrors.nom_complet && <Text style={styles.errorText}>{formErrors.nom_complet}</Text>}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Nom de société/coopérative (optionnel)</Text>
              <View style={styles.inputContainer}>
                <Building size={20} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nom de votre société ou coopérative"
                  placeholderTextColor="#9CA3AF"
                  value={formData.nom_societe}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, nom_societe: text }))}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Téléphone</Text>
              <View style={styles.inputContainer}>
                <Phone size={20} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Votre numéro de téléphone"
                  placeholderTextColor="#9CA3AF"
                  value={formData.telephone}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, telephone: text }))}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Langue préférée *</Text>
              <View style={styles.optionsGrid}>
                {['Hausa', 'Anglais', 'Français'].map((langue) => (
                  <TouchableOpacity
                    key={langue}
                    style={[
                      styles.optionButton,
                      formData.langue_preferee === langue && styles.optionButtonSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, langue_preferee: langue as any }))}
                  >
                    <Globe size={16} color={formData.langue_preferee === langue ? "#FFFFFF" : "#6B7280"} />
                    <Text style={[
                      styles.optionText,
                      formData.langue_preferee === langue && styles.optionTextSelected
                    ]}>
                      {langue}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formErrors.langue_preferee && <Text style={styles.errorText}>{formErrors.langue_preferee}</Text>}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Sexe *</Text>
              <View style={styles.optionsGrid}>
                {['Homme', 'Femme', 'Préfère ne pas dire'].map((sexe) => (
                  <TouchableOpacity
                    key={sexe}
                    style={[
                      styles.optionButton,
                      formData.sexe === sexe && styles.optionButtonSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, sexe: sexe as any }))}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.sexe === sexe && styles.optionTextSelected
                    ]}>
                      {sexe}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formErrors.sexe && <Text style={styles.errorText}>{formErrors.sexe}</Text>}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Âge (optionnel)</Text>
              <View style={styles.optionsGrid}>
                {['18-25', '26-35', '36-45', '46-55', '56-65', '65+'].map((age) => (
                  <TouchableOpacity
                    key={age}
                    style={[
                      styles.optionButton,
                      formData.age_fourchette === age && styles.optionButtonSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, age_fourchette: age as any }))}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.age_fourchette === age && styles.optionTextSelected
                    ]}>
                      {age} ans
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Localisation et Activité</Text>
            <Text style={styles.stepSubtitle}>Indiquez votre localisation et votre activité principale</Text>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>État *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                <View style={styles.statesContainer}>
                  {Object.entries(etatsGrouped).map(([region, etatsRegion]) => (
                    <View key={region} style={styles.regionGroup}>
                      <Text style={styles.regionTitle}>{region}</Text>
                      <View style={styles.statesGrid}>
                        {etatsRegion.map((etat) => (
                          <TouchableOpacity
                            key={etat.id}
                            style={[
                              styles.stateButton,
                              formData.etat === etat.nom && styles.stateButtonSelected
                            ]}
                            onPress={() => setFormData(prev => ({ ...prev, etat: etat.nom }))}
                          >
                            <Text style={[
                              styles.stateText,
                              formData.etat === etat.nom && styles.stateTextSelected
                            ]}>
                              {etat.nom}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
              {formErrors.etat && <Text style={styles.errorText}>{formErrors.etat}</Text>}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>LGA (Local Government Area)</Text>
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Kano Municipal"
                  placeholderTextColor="#9CA3AF"
                  value={formData.lga}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, lga: text }))}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Village/Quartier</Text>
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Sabon Gari"
                  placeholderTextColor="#9CA3AF"
                  value={formData.village_quartier}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, village_quartier: text }))}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Position GPS</Text>
              <TouchableOpacity style={styles.gpsButton} onPress={getCurrentLocation}>
                <Navigation size={20} color="#16A34A" />
                <Text style={styles.gpsButtonText}>
                  {formData.coordonnees_gps ? 'Position enregistrée ✓' : 'Utiliser ma position GPS'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Type d'utilisateur *</Text>
              <View style={styles.optionsGrid}>
                {[
                  { key: 'producteur', label: 'Producteur/Agriculteur' },
                  { key: 'acheteur', label: 'Acheteur' },
                  { key: 'prestataire_service', label: 'Prestataire de service' },
                  { key: 'agent', label: 'Agent agricole' },
                  { key: 'cooperative', label: 'Coopérative' },
                  { key: 'transformateur', label: 'Transformateur' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.optionButton,
                      formData.type_utilisateur === type.key && styles.optionButtonSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type_utilisateur: type.key as any }))}
                  >
                    <Users size={16} color={formData.type_utilisateur === type.key ? "#FFFFFF" : "#6B7280"} />
                    <Text style={[
                      styles.optionText,
                      formData.type_utilisateur === type.key && styles.optionTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formErrors.type_utilisateur && <Text style={styles.errorText}>{formErrors.type_utilisateur}</Text>}
            </View>
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Activité Agricole</Text>
            <Text style={styles.stepSubtitle}>Détails sur votre activité agricole (optionnel)</Text>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Superficie exploitée</Text>
              <View style={styles.optionsGrid}>
                {['Moins de 1 ha', '1-3 ha', '3-10 ha', '10-50 ha', 'Plus de 50 ha'].map((superficie) => (
                  <TouchableOpacity
                    key={superficie}
                    style={[
                      styles.optionButton,
                      formData.superficie_fourchette === superficie && styles.optionButtonSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, superficie_fourchette: superficie as any }))}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.superficie_fourchette === superficie && styles.optionTextSelected
                    ]}>
                      {superficie}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Cultures pratiquées</Text>
              <Text style={styles.formSubLabel}>Sélectionnez toutes les cultures que vous pratiquez</Text>
              
              {Object.entries(culturesGrouped).map(([categorie, culturesList]) => (
                <View key={categorie} style={styles.cultureCategory}>
                  <Text style={styles.categoryTitle}>{categorie}</Text>
                  <View style={styles.culturesGrid}>
                    {culturesList.map((culture) => (
                      <TouchableOpacity
                        key={culture.id}
                        style={[
                          styles.cultureButton,
                          formData.cultures_pratiquees.includes(culture.nom) && styles.cultureButtonSelected
                        ]}
                        onPress={() => toggleCulture(culture.nom)}
                      >
                        <Leaf size={14} color={formData.cultures_pratiquees.includes(culture.nom) ? "#FFFFFF" : "#16A34A"} />
                        <Text style={[
                          styles.cultureText,
                          formData.cultures_pratiquees.includes(culture.nom) && styles.cultureTextSelected
                        ]}>
                          {culture.nom}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
              <Text style={styles.previousButtonText}>Précédent</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.nextButton, { flex: currentStep === 1 ? 1 : 0.6 }]} 
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentStep === 3 ? 'Terminer' : 'Suivant'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
  },
  stepIndicator: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    paddingVertical: 24,
  },
  stepTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#111827',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
  },
  formSubLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  textInputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 120,
  },
  optionButtonSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  optionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  horizontalScroll: {
    maxHeight: 300,
  },
  statesContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  regionGroup: {
    minWidth: 200,
  },
  regionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#16A34A',
    marginBottom: 8,
  },
  statesGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  stateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  stateButtonSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  stateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
  },
  stateTextSelected: {
    color: '#FFFFFF',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  gpsButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#16A34A',
    marginLeft: 8,
  },
  cultureCategory: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  culturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cultureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  cultureButtonSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  cultureText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#374151',
    marginLeft: 4,
  },
  cultureTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  previousButton: {
    flex: 0.4,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  previousButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
  },
  nextButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});