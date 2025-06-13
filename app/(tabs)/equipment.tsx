import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, RefreshControl, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Plus, Search, Filter, MapPin, Star, Calendar, Truck, Wrench, Tractor, Clock, X, Camera, Navigation, Heart, Phone, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Package, TrendingUp, Zap, Settings, Droplets } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useEquipements, EquipementInsert } from '@/hooks/useEquipements';
import AuthModal from '@/components/AuthModal';
import EnhancedProfileForm from '@/components/EnhancedProfileForm';

const { width: screenWidth } = Dimensions.get('window');

const categoryIcons = {
  'Tracteurs': Tractor,
  'Outils de labour': Wrench,
  'Outils de semis': Package,
  'Outils de récolte': Settings,
  'Transport': Truck,
  'Irrigation': Droplets,
  'Transformation': Settings,
  'Autres': Package,
};

export default function EquipmentScreen() {
  const { user, profile } = useAuth();
  const { equipements, categories, loading, error, loadEquipements, createEquipement, updateEquipement, deleteEquipement, createReservation } = useEquipements();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEnhancedProfileForm, setShowEnhancedProfileForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [editingEquipment, setEditingEquipment] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState<EquipementInsert>({
    nom: '',
    description: '',
    prix_jour: 0,
    prix_semaine: 0,
    prix_mois: 0,
    devise: '₦',
    categorie_id: '',
    images: [],
    localisation: '',
    zone_service: '',
    conditions_location: '',
  });

  const [reservationData, setReservationData] = useState({
    date_debut: '',
    date_fin: '',
    message: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  // Get user location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Load equipment when filters change
  useEffect(() => {
    loadFilteredEquipements();
  }, [selectedCategory, searchQuery]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadFilteredEquipements = async () => {
    const filters: any = {};
    
    if (selectedCategory !== 'all') {
      filters.categorie = selectedCategory;
    }
    
    if (searchQuery) {
      filters.search = searchQuery;
    }
    
    if (userLocation) {
      filters.userLocation = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      };
    }

    await loadEquipements(filters);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      errors.nom = 'Le nom du matériel est obligatoire';
    }

    if (!formData.prix_jour || formData.prix_jour <= 0) {
      errors.prix_jour = 'Le prix par jour doit être supérieur à 0';
    }

    // Validate price hierarchy and constraints
    if (formData.prix_semaine && formData.prix_semaine > 0) {
      if (formData.prix_semaine <= 0) {
        errors.prix_semaine = 'Le prix par semaine doit être supérieur à 0';
      } else if (formData.prix_semaine < formData.prix_jour) {
        errors.prix_semaine = 'Le prix par semaine doit être supérieur ou égal au prix par jour';
      }
    }

    if (formData.prix_mois && formData.prix_mois > 0) {
      if (formData.prix_mois <= 0) {
        errors.prix_mois = 'Le prix par mois doit être supérieur à 0';
      } else if (formData.prix_semaine && formData.prix_semaine > 0 && formData.prix_mois < formData.prix_semaine) {
        errors.prix_mois = 'Le prix par mois doit être supérieur ou égal au prix par semaine';
      } else if ((!formData.prix_semaine || formData.prix_semaine <= 0) && formData.prix_mois < formData.prix_jour) {
        errors.prix_mois = 'Le prix par mois doit être supérieur ou égal au prix par jour';
      }
    }

    if (!formData.categorie_id) {
      errors.categorie_id = 'Veuillez sélectionner une catégorie';
    }

    if (!formData.description?.trim()) {
      errors.description = 'La description est obligatoire';
    }

    if (!formData.images || formData.images.length === 0) {
      errors.images = 'Ajoutez au moins une photo de votre matériel';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddButtonPress = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!profile) {
      Alert.alert(
        'Profil incomplet',
        'Vous devez compléter votre profil avant de pouvoir louer du matériel.',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Compléter le profil', 
            onPress: () => setShowEnhancedProfileForm(true) 
          }
        ]
      );
      return;
    }

    setShowAddForm(true);
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    // Clean up the data before sending to ensure proper types and null values for empty fields
    const equipmentData = {
      ...formData,
      localisation: formData.localisation || profile?.etat || 'Non spécifiée',
      // Ensure price fields are either positive numbers or null/undefined
      prix_semaine: formData.prix_semaine && formData.prix_semaine > 0 ? formData.prix_semaine : undefined,
      prix_mois: formData.prix_mois && formData.prix_mois > 0 ? formData.prix_mois : undefined,
    };

    let result;
    if (editingEquipment) {
      result = await updateEquipement(editingEquipment, equipmentData);
    } else {
      result = await createEquipement(equipmentData);
    }

    if (result.error) {
      Alert.alert('Erreur', result.error);
    } else {
      Alert.alert(
        'Succès',
        editingEquipment ? 'Annonce mise à jour avec succès !' : 'Votre annonce de location a été publiée avec succès !',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              setShowAddForm(false);
            }
          }
        ]
      );
    }
  };

  const handleEdit = (equipment: any) => {
    setFormData({
      nom: equipment.nom,
      description: equipment.description || '',
      prix_jour: equipment.prix_jour,
      prix_semaine: equipment.prix_semaine || 0,
      prix_mois: equipment.prix_mois || 0,
      devise: equipment.devise,
      categorie_id: equipment.categorie_id || '',
      images: equipment.images || [],
      localisation: equipment.localisation || '',
      zone_service: equipment.zone_service || '',
      conditions_location: equipment.conditions_location || '',
    });
    setEditingEquipment(equipment.id);
    setShowAddForm(true);
  };

  const handleDelete = (equipmentId: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette annonce ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteEquipement(equipmentId);
            if (error) {
              Alert.alert('Erreur', error);
            } else {
              Alert.alert('Succès', 'Annonce supprimée avec succès');
            }
          },
        },
      ]
    );
  };

  const handleReservation = (equipment: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (equipment.statut !== 'disponible') {
      Alert.alert('Non disponible', 'Ce matériel n\'est pas disponible actuellement.');
      return;
    }

    setSelectedEquipment(equipment);
    setShowReservationModal(true);
  };

  const submitReservation = async () => {
    if (!selectedEquipment || !reservationData.date_debut || !reservationData.date_fin) {
      Alert.alert('Erreur', 'Veuillez sélectionner les dates de réservation');
      return;
    }

    const startDate = new Date(reservationData.date_debut);
    const endDate = new Date(reservationData.date_fin);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const prixTotal = days * selectedEquipment.prix_jour;

    const result = await createReservation({
      equipement_id: selectedEquipment.id,
      date_debut: reservationData.date_debut,
      date_fin: reservationData.date_fin,
      prix_total: prixTotal,
      message: reservationData.message,
    });

    if (result.error) {
      Alert.alert('Erreur', result.error);
    } else {
      Alert.alert(
        'Réservation envoyée',
        'Votre demande de réservation a été envoyée au propriétaire. Vous recevrez une confirmation bientôt.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowReservationModal(false);
              setReservationData({ date_debut: '', date_fin: '', message: '' });
            }
          }
        ]
      );
    }
  };

  const toggleFavorite = (equipmentId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(equipmentId)) {
        newFavorites.delete(equipmentId);
      } else {
        newFavorites.add(equipmentId);
      }
      return newFavorites;
    });
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      prix_jour: 0,
      prix_semaine: 0,
      prix_mois: 0,
      devise: '₦',
      categorie_id: '',
      images: [],
      localisation: '',
      zone_service: '',
      conditions_location: '',
    });
    setFormErrors({});
    setEditingEquipment(null);
  };

  const pickImage = async () => {
    if (formData.images && formData.images.length >= 5) {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter maximum 5 photos');
      return;
    }

    setUploadingImage(true);
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), result.assets[0].uri],
      }));
      
      if (formErrors.images) {
        setFormErrors(prev => ({ ...prev, images: '' }));
      }
    }
    
    setUploadingImage(false);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFilteredEquipements();
    setRefreshing(false);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getDistanceText = (equipment: any) => {
    if (!userLocation || !equipment.coordonnees_gps) return null;
    
    // Parse point format "(lat,lon)"
    const coords = equipment.coordonnees_gps.replace(/[()]/g, '').split(',');
    if (coords.length !== 2) return null;
    
    const distance = calculateDistance(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      parseFloat(coords[0]),
      parseFloat(coords[1])
    );
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m de vous`;
    } else {
      return `${distance.toFixed(1)}km de vous`;
    }
  };

  const categoriesWithAll = [
    { id: 'all', nom: 'Tout', icone: 'Wrench' },
    ...categories,
  ];

  if (showAddForm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => {
            resetForm();
            setShowAddForm(false);
          }}>
            <Text style={styles.cancelButton}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.formTitle}>
            {editingEquipment ? 'Modifier l\'annonce' : 'Louer mon Matériel'}
          </Text>
          <TouchableOpacity onPress={handleFormSubmit}>
            <Text style={styles.saveButton}>
              {editingEquipment ? 'Modifier' : 'Publier'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Photos du matériel *</Text>
            <Text style={styles.formSubLabel}>Ajoutez jusqu'à 5 photos (recommandé: 3-5 photos)</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
              {formData.images?.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {(!formData.images || formData.images.length < 5) && (
                <TouchableOpacity 
                  style={styles.addImageButton} 
                  onPress={pickImage}
                  disabled={uploadingImage}
                >
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
            <Text style={styles.formLabel}>Type d'équipement *</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => {
                const IconComponent = categoryIcons[category.nom as keyof typeof categoryIcons] || Package;
                return (
                  <TouchableOpacity 
                    key={category.id} 
                    style={[
                      styles.categoryOption,
                      formData.categorie_id === category.id && styles.categoryOptionSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, categorie_id: category.id }))}
                  >
                    <IconComponent size={20} color={formData.categorie_id === category.id ? "#FFFFFF" : "#8B5CF6"} />
                    <Text style={[
                      styles.categoryOptionText,
                      formData.categorie_id === category.id && styles.categoryOptionTextSelected
                    ]}>
                      {category.nom}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {formErrors.categorie_id && <Text style={styles.errorText}>{formErrors.categorie_id}</Text>}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Nom du matériel *</Text>
            <TextInput
              style={[styles.textInput, formErrors.nom && styles.textInputError]}
              placeholder="Ex: Tracteur John Deere"
              placeholderTextColor="#9CA3AF"
              value={formData.nom}
              onChangeText={(text) => setFormData(prev => ({ ...prev, nom: text }))}
            />
            {formErrors.nom && <Text style={styles.errorText}>{formErrors.nom}</Text>}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, formErrors.description && styles.textInputError]}
              placeholder="Décrivez votre matériel, son état, ses spécifications..."
              placeholderTextColor="#9CA3AF"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
            />
            {formErrors.description && <Text style={styles.errorText}>{formErrors.description}</Text>}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Tarification *</Text>
            <Text style={styles.formSubLabel}>
              Les prix doivent suivre une logique croissante (jour ≤ semaine ≤ mois)
            </Text>
            <View style={styles.pricingContainer}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Prix/jour *</Text>
                <View style={styles.priceInputContainer}>
                  <TextInput
                    style={[styles.priceInput, formErrors.prix_jour && styles.textInputError]}
                    placeholder="15000"
                    placeholderTextColor="#9CA3AF"
                    value={formData.prix_jour?.toString() || ''}
                    onChangeText={(text) => {
                      const value = Number(text) || 0;
                      setFormData(prev => ({ ...prev, prix_jour: value }));
                      // Clear related errors when user starts typing
                      if (formErrors.prix_jour) {
                        setFormErrors(prev => ({ ...prev, prix_jour: '' }));
                      }
                    }}
                    keyboardType="numeric"
                  />
                  <Text style={styles.currency}>{formData.devise}</Text>
                </View>
              </View>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Prix/semaine (optionnel)</Text>
                <View style={styles.priceInputContainer}>
                  <TextInput
                    style={[styles.priceInput, formErrors.prix_semaine && styles.textInputError]}
                    placeholder="90000"
                    placeholderTextColor="#9CA3AF"
                    value={formData.prix_semaine?.toString() || ''}
                    onChangeText={(text) => {
                      const value = Number(text) || 0;
                      setFormData(prev => ({ ...prev, prix_semaine: value }));
                      // Clear related errors when user starts typing
                      if (formErrors.prix_semaine) {
                        setFormErrors(prev => ({ ...prev, prix_semaine: '' }));
                      }
                    }}
                    keyboardType="numeric"
                  />
                  <Text style={styles.currency}>{formData.devise}</Text>
                </View>
              </View>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Prix/mois (optionnel)</Text>
                <View style={styles.priceInputContainer}>
                  <TextInput
                    style={[styles.priceInput, formErrors.prix_mois && styles.textInputError]}
                    placeholder="300000"
                    placeholderTextColor="#9CA3AF"
                    value={formData.prix_mois?.toString() || ''}
                    onChangeText={(text) => {
                      const value = Number(text) || 0;
                      setFormData(prev => ({ ...prev, prix_mois: value }));
                      // Clear related errors when user starts typing
                      if (formErrors.prix_mois) {
                        setFormErrors(prev => ({ ...prev, prix_mois: '' }));
                      }
                    }}
                    keyboardType="numeric"
                  />
                  <Text style={styles.currency}>{formData.devise}</Text>
                </View>
              </View>
            </View>
            {formErrors.prix_jour && <Text style={styles.errorText}>{formErrors.prix_jour}</Text>}
            {formErrors.prix_semaine && <Text style={styles.errorText}>{formErrors.prix_semaine}</Text>}
            {formErrors.prix_mois && <Text style={styles.errorText}>{formErrors.prix_mois}</Text>}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Zone de service</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ex: Livraison dans un rayon de 20km"
              placeholderTextColor="#9CA3AF"
              value={formData.zone_service}
              onChangeText={(text) => setFormData(prev => ({ ...prev, zone_service: text }))}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Localisation</Text>
            <View style={styles.locationInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={profile?.etat ? `${profile.etat}, Nigeria` : "Ex: Kano, Nigeria"}
                placeholderTextColor="#9CA3AF"
                value={formData.localisation}
                onChangeText={(text) => setFormData(prev => ({ ...prev, localisation: text }))}
              />
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={() => {
                  if (profile?.etat) {
                    setFormData(prev => ({ ...prev, localisation: `${profile.etat}, Nigeria` }));
                  }
                }}
              >
                <Navigation size={16} color="#16A34A" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Conditions de location</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Ex: Caution de 50000₦ demandée, carburant à la charge du locataire..."
              placeholderTextColor="#9CA3AF"
              value={formData.conditions_location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, conditions_location: text }))}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.publishButton} onPress={handleFormSubmit}>
            <Text style={styles.publishButtonText}>
              {editingEquipment ? 'Modifier l\'annonce' : 'Publier mon annonce'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Location Matériel</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddButtonPress}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Louer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher du matériel..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={20} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* Promotion Banner */}
      <View style={styles.promotionBanner}>
        <Zap size={20} color="#F59E0B" />
        <Text style={styles.promotionText}>
          Activez les notifications pour être alerté des nouveaux matériels disponibles !
        </Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categoriesWithAll.map((category) => {
          const IconComponent = categoryIcons[category.nom as keyof typeof categoryIcons] || Package;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategory === category.id && styles.categoryCardActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <IconComponent 
                size={20} 
                color={selectedCategory === category.id ? '#FFFFFF' : '#8B5CF6'} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}>
                {category.nom}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView 
        style={styles.equipmentContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity onPress={() => loadFilteredEquipements()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Chargement des équipements...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsText}>
              {equipements.length} équipements disponibles
            </Text>

            {equipements.map((equipment) => {
              const distanceText = getDistanceText(equipment);
              const isFavorite = favorites.has(equipment.id);
              
              return (
                <View key={equipment.id} style={styles.equipmentCard}>
                  {equipment.images && equipment.images.length > 0 ? (
                    <Image source={{ uri: equipment.images[0] }} style={styles.equipmentImage} />
                  ) : (
                    <View style={styles.equipmentImagePlaceholder}>
                      <Tractor size={32} color="#6B7280" />
                    </View>
                  )}
                  
                  <View style={styles.equipmentInfo}>
                    <View style={styles.equipmentHeader}>
                      <Text style={styles.equipmentName}>{equipment.nom}</Text>
                      <View style={styles.headerActions}>
                        <TouchableOpacity 
                          style={styles.favoriteButton}
                          onPress={() => toggleFavorite(equipment.id)}
                        >
                          <Heart 
                            size={20} 
                            color={isFavorite ? "#DC2626" : "#6B7280"} 
                            fill={isFavorite ? "#DC2626" : "none"}
                          />
                        </TouchableOpacity>
                        <View style={[
                          styles.availabilityBadge, 
                          { backgroundColor: equipment.statut === 'disponible' ? '#DCFCE7' : '#FEF3C7' }
                        ]}>
                          <Text style={[
                            styles.availabilityText,
                            { color: equipment.statut === 'disponible' ? '#16A34A' : '#F59E0B' }
                          ]}>
                            {equipment.statut === 'disponible' ? 'Disponible' : 'Occupé'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <Text style={styles.equipmentPrice}>{equipment.prix_jour} {equipment.devise}/jour</Text>
                    {equipment.prix_semaine && equipment.prix_semaine > 0 && (
                      <Text style={styles.equipmentPriceSecondary}>
                        {equipment.prix_semaine} {equipment.devise}/semaine
                      </Text>
                    )}
                    
                    <Text style={styles.equipmentDescription} numberOfLines={2}>
                      {equipment.description}
                    </Text>
                    
                    <View style={styles.ownerInfo}>
                      <Text style={styles.ownerName}>
                        {equipment.profiles?.nom_complet || 'Propriétaire anonyme'}
                      </Text>
                      <View style={styles.ratingContainer}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.rating}>{equipment.note_moyenne.toFixed(1)}</Text>
                        <Text style={styles.reviewCount}>({equipment.nombre_evaluations})</Text>
                      </View>
                    </View>
                    
                    <View style={styles.locationContainer}>
                      <MapPin size={12} color="#6B7280" />
                      <Text style={styles.location}>{equipment.localisation}</Text>
                      {distanceText && (
                        <Text style={styles.distance}> • {distanceText}</Text>
                      )}
                    </View>
                    
                    {equipment.zone_service && (
                      <Text style={styles.serviceZone}>Zone: {equipment.zone_service}</Text>
                    )}

                    {user?.id === equipment.proprietaire_id ? (
                      <View style={styles.ownerActions}>
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => handleEdit(equipment)}
                        >
                          <Text style={styles.editButtonText}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDelete(equipment.id)}
                        >
                          <Text style={styles.deleteButtonText}>Supprimer</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity 
                          style={styles.contactButton}
                          onPress={() => {
                            if (equipment.profiles?.telephone) {
                              Alert.alert(
                                'Contacter le propriétaire',
                                `Téléphone: ${equipment.profiles.telephone}`,
                                [
                                  { text: 'Annuler', style: 'cancel' },
                                  { text: 'Appeler', onPress: () => {
                                    // In a real app, this would open the phone dialer
                                    Alert.alert('Appel', 'Fonctionnalité d\'appel bientôt disponible');
                                  }}
                                ]
                              );
                            } else {
                              Alert.alert('Contact', 'Numéro de téléphone non disponible');
                            }
                          }}
                        >
                          <Phone size={16} color="#374151" />
                          <Text style={styles.contactButtonText}>Contacter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[
                            styles.reserveButton,
                            equipment.statut !== 'disponible' && styles.reserveButtonDisabled
                          ]}
                          onPress={() => handleReservation(equipment)}
                          disabled={equipment.statut !== 'disponible'}
                        >
                          <Calendar size={16} color="#FFFFFF" />
                          <Text style={styles.reserveButtonText}>
                            {equipment.statut === 'disponible' ? 'Réserver' : 'Indisponible'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {equipements.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Tractor size={48} color="#6B7280" />
                <Text style={styles.emptyStateTitle}>Aucun équipement trouvé</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Soyez le premier à proposer du matériel en location dans votre région !'
                  }
                </Text>
                {!searchQuery && selectedCategory === 'all' && (
                  <TouchableOpacity 
                    style={styles.firstToRentButton}
                    onPress={handleAddButtonPress}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.firstToRentText}>Être le premier à louer</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        <View style={styles.tipCard}>
          <Clock size={24} color="#3B82F6" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Conseil de location</Text>
            <Text style={styles.tipText}>
              Réservez votre matériel à l'avance, surtout pendant les périodes de semis et de récolte.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Reservation Modal */}
      <Modal
        visible={showReservationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReservationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reservationModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Réserver {selectedEquipment?.nom}</Text>
              <TouchableOpacity onPress={() => setShowReservationModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.reservationSection}>
                <Text style={styles.reservationLabel}>Date de début *</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  value={reservationData.date_debut}
                  onChangeText={(text) => setReservationData(prev => ({ ...prev, date_debut: text }))}
                />
              </View>
              
              <View style={styles.reservationSection}>
                <Text style={styles.reservationLabel}>Date de fin *</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  value={reservationData.date_fin}
                  onChangeText={(text) => setReservationData(prev => ({ ...prev, date_fin: text }))}
                />
              </View>
              
              <View style={styles.reservationSection}>
                <Text style={styles.reservationLabel}>Message (optionnel)</Text>
                <TextInput
                  style={[styles.dateInput, styles.messageInput]}
                  placeholder="Décrivez votre besoin..."
                  value={reservationData.message}
                  onChangeText={(text) => setReservationData(prev => ({ ...prev, message: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              {selectedEquipment && reservationData.date_debut && reservationData.date_fin && (
                <View style={styles.priceCalculation}>
                  <Text style={styles.calculationTitle}>Estimation du coût</Text>
                  <Text style={styles.calculationText}>
                    Prix par jour: {selectedEquipment.prix_jour} {selectedEquipment.devise}
                  </Text>
                  <Text style={styles.calculationTotal}>
                    Total estimé: {
                      Math.ceil((new Date(reservationData.date_fin).getTime() - new Date(reservationData.date_debut).getTime()) / (1000 * 60 * 60 * 24)) * selectedEquipment.prix_jour
                    } {selectedEquipment.devise}
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelReservationButton}
                onPress={() => setShowReservationModal(false)}
              >
                <Text style={styles.cancelReservationText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmReservationButton}
                onPress={submitReservation}
              >
                <Text style={styles.confirmReservationText}>Envoyer la demande</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AuthModal 
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
      />

      <EnhancedProfileForm
        visible={showEnhancedProfileForm}
        onClose={() => setShowEnhancedProfileForm(false)}
        onSuccess={() => {
          setShowEnhancedProfileForm(false);
          Alert.alert('Succès', 'Profil créé avec succès ! Vous pouvez maintenant louer du matériel.');
        }}
      />
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
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promotionBanner: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  promotionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  categoryCardActive: {
    backgroundColor: '#8B5CF6',
  },
  categoryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#8B5CF6',
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  equipmentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  errorMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#DC2626',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  resultsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginVertical: 16,
  },
  equipmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  equipmentImage: {
    width: '100%',
    height: 200,
  },
  equipmentImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentInfo: {
    padding: 16,
  },
  equipmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  equipmentName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  availabilityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  availabilityText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  equipmentPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#8B5CF6',
    marginBottom: 4,
  },
  equipmentPriceSecondary: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  equipmentDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ownerName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#F59E0B',
    marginLeft: 2,
  },
  reviewCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  distance: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#8B5CF6',
  },
  serviceZone: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#059669',
    marginBottom: 12,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
    marginLeft: 4,
  },
  reserveButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  reserveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#3B82F6',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#DC2626',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  firstToRentButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  firstToRentText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  reservationModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  reservationSection: {
    marginBottom: 16,
  },
  reservationLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#111827',
  },
  messageInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  priceCalculation: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  calculationTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#166534',
    marginBottom: 8,
  },
  calculationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#166534',
    marginBottom: 4,
  },
  calculationTotal: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#166534',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelReservationButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelReservationText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
  },
  confirmReservationButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmReservationText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  // Form styles
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
  },
  formTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
  },
  saveButton: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#8B5CF6',
  },
  formContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  formSubLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#111827',
  },
  textInputError: {
    borderColor: '#DC2626',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  imageContainer: {
    flexDirection: 'row',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  addImageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 120,
  },
  categoryOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  categoryOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#111827',
    marginLeft: 6,
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
  },
  pricingContainer: {
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    flex: 2,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#111827',
  },
  currency: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  publishButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 40,
  },
  publishButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});