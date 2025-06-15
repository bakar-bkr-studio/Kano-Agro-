import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, RefreshControl, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
// Les icônes nécessaires pour la marketplace
import { Plus, Search, Filter, MapPin, ShoppingCart, Leaf, CreditCard as Edit3, Trash2, User, Camera, X, Navigation, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, Package, TrendingUp, Zap } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAnnonces } from '@/hooks/useAnnonces';
import { useCategories } from '@/hooks/useCategories';
import AuthModal from '@/components/AuthModal';
import EnhancedProfileForm from '@/components/EnhancedProfileForm';
// Nouveaux composants extraits pour améliorer la lisibilité de la page
import ProductCard from '@/components/marketplace/ProductCard';
import CategorySelector from '@/components/marketplace/CategorySelector';
import ProductForm from '@/components/marketplace/ProductForm';
import SortModal from '@/components/marketplace/SortModal';
import FiltersModal from '@/components/marketplace/FiltersModal';
import AuthPrompt from '@/components/marketplace/AuthPrompt';
import EmptyState from '@/components/marketplace/EmptyState';

const { width: screenWidth } = Dimensions.get('window');

interface LocationFilter {
  etat?: string;
  lga?: string;
  village?: string;
  maxDistance?: number;
}

interface SortOption {
  key: string;
  label: string;
  icon: any;
}

const sortOptions: SortOption[] = [
  { key: 'recent', label: 'Plus récents', icon: Clock },
  { key: 'price_asc', label: 'Prix croissant', icon: TrendingUp },
  { key: 'price_desc', label: 'Prix décroissant', icon: TrendingUp },
  { key: 'distance', label: 'Proximité', icon: MapPin },
];

export default function MarketplaceScreen() {
  const { user, profile, createProfileIfMissing } = useAuth();
  const { annonces, loading, error, loadAnnonces, createAnnonce, updateAnnonce, deleteAnnonce } = useAnnonces();
  const { categories } = useCategories();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSellForm, setShowSellForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showEnhancedProfileForm, setShowEnhancedProfileForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [editingAnnonce, setEditingAnnonce] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Filters state
  const [locationFilter, setLocationFilter] = useState<LocationFilter>({});
  const [sortBy, setSortBy] = useState('recent');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    prix: '',
    unite_prix: '₦/kg',
    quantite_disponible: '',
    categorie_id: '',
    localisation: '',
    images: [] as string[],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  // Get user location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

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

  // Load annonces with filters
  useEffect(() => {
    loadFilteredAnnonces();
  }, [selectedCategory, searchQuery, sortBy, locationFilter, priceRange]);

  const loadFilteredAnnonces = useCallback(async (page = 1, append = false) => {
    if (!append) {
      setCurrentPage(1);
    }
    
    const filters: any = {};
    
    if (selectedCategory !== 'all') {
      filters.categorie = selectedCategory;
    }
    
    if (searchQuery) {
      filters.search = searchQuery;
    }
    
    if (locationFilter.etat) {
      filters.etat = locationFilter.etat;
    }
    
    if (priceRange.min || priceRange.max) {
      filters.priceRange = priceRange;
    }
    
    filters.sortBy = sortBy;
    filters.page = page;
    filters.limit = 10;
    
    if (userLocation && sortBy === 'distance') {
      filters.userLocation = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      };
    }

    await loadAnnonces(filters);
  }, [selectedCategory, searchQuery, sortBy, locationFilter, priceRange, userLocation]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.titre.trim()) {
      errors.titre = 'Le titre est obligatoire';
    } else if (formData.titre.length < 3) {
      errors.titre = 'Le titre doit contenir au moins 3 caractères';
    }

    if (!formData.prix || isNaN(Number(formData.prix)) || Number(formData.prix) <= 0) {
      errors.prix = 'Le prix doit être un nombre positif';
    }

    if (!formData.quantite_disponible.trim()) {
      errors.quantite_disponible = 'La quantité est obligatoire';
    }

    if (!formData.categorie_id) {
      errors.categorie_id = 'Veuillez sélectionner une catégorie';
    }

    if (formData.images.length === 0) {
      errors.images = 'Ajoutez au moins une photo de votre produit';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSellButtonPress = () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    if (!profile) {
      Alert.alert(
        'Profil incomplet',
        'Vous devez compléter votre profil avant de pouvoir vendre des produits.',
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

    setShowSellForm(true);
  };

  const handleSubmit = async () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    if (!profile) {
      Alert.alert(
        'Erreur',
        'Votre profil n\'est pas complet. Veuillez le compléter avant de créer une annonce.'
      );
      return;
    }

    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    const annonceData = {
      ...formData,
      prix: Number(formData.prix),
      localisation: formData.localisation || profile.etat || 'Non spécifiée',
    };

    let result;
    if (editingAnnonce) {
      result = await updateAnnonce(editingAnnonce, annonceData);
    } else {
      result = await createAnnonce(annonceData);
    }

    if (result.error) {
      Alert.alert('Erreur', result.error);
    } else {
      // Show success notification
      Alert.alert(
        'Succès',
        editingAnnonce ? 'Annonce mise à jour avec succès !' : 'Votre annonce a été publiée avec succès !',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              setShowSellForm(false);
            }
          }
        ]
      );
    }
  };

  const handleEdit = (annonce: any) => {
    setFormData({
      titre: annonce.titre,
      description: annonce.description || '',
      prix: annonce.prix.toString(),
      unite_prix: annonce.unite_prix,
      quantite_disponible: annonce.quantite_disponible,
      categorie_id: annonce.categorie_id || '',
      localisation: annonce.localisation || '',
      images: annonce.images || [],
    });
    setEditingAnnonce(annonce.id);
    setShowSellForm(true);
  };

  const handleDelete = (annonceId: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette annonce ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAnnonce(annonceId);
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

  const handleReport = (annonceId: string) => {
    Alert.alert(
      'Signaler cette annonce',
      'Pourquoi voulez-vous signaler cette annonce ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Contenu inapproprié', onPress: () => submitReport(annonceId, 'inappropriate') },
        { text: 'Fraude/Arnaque', onPress: () => submitReport(annonceId, 'fraud') },
        { text: 'Produit non conforme', onPress: () => submitReport(annonceId, 'mismatch') },
      ]
    );
  };

  const submitReport = async (annonceId: string, reason: string) => {
    // In a real app, this would send the report to your backend
    Alert.alert('Merci', 'Votre signalement a été envoyé. Nous examinerons cette annonce.');
  };

  const handleBuyNow = (annonce: any) => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    Alert.alert(
      'Acheter maintenant',
      `Voulez-vous acheter "${annonce.titre}" pour ${annonce.prix} ${annonce.unite_prix} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Acheter',
          onPress: () => {
            // In a real app, this would initiate the payment process
            Alert.alert(
              'Paiement sécurisé',
              'Cette fonctionnalité sera bientôt disponible. Contactez le vendeur directement pour finaliser l\'achat.'
            );
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      prix: '',
      unite_prix: '₦/kg',
      quantite_disponible: '',
      categorie_id: '',
      localisation: '',
      images: [],
    });
    setFormErrors({});
    setEditingAnnonce(null);
  };

  const pickImage = async () => {
    if (formData.images.length >= 5) {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter maximum 5 photos');
      return;
    }

    setUploadingImage(true);
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Compress images for better performance
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri],
      }));
      
      // Clear image error if it exists
      if (formErrors.images) {
        setFormErrors(prev => ({ ...prev, images: '' }));
      }
    }
    
    setUploadingImage(false);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFilteredAnnonces();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMoreData) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    await loadFilteredAnnonces(nextPage, true);
    setCurrentPage(nextPage);
    setIsLoadingMore(false);
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

  const getDistanceText = (annonce: any) => {
    if (!userLocation || !annonce.vendeur_coordonnees) return null;
    
    const distance = calculateDistance(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      annonce.vendeur_coordonnees.latitude,
      annonce.vendeur_coordonnees.longitude
    );
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m de vous`;
    } else {
      return `${distance.toFixed(1)}km de vous`;
    }
  };

  const filteredAnnonces = annonces.filter(annonce => {
    if (selectedCategory !== 'all' && annonce.categorie_id !== selectedCategory) {
      return false;
    }
    if (searchQuery && !annonce.titre.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const categoriesWithAll = [
    { id: 'all', nom: 'Tout', icone: 'Leaf' },
    ...categories,
  ];

  if (showSellForm) {
    return (
      <SafeAreaView style={styles.container}>
        <ProductForm
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          categories={categories}
          profile={profile}
          editingAnnonce={editingAnnonce}
          pickImage={pickImage}
          removeImage={removeImage}
          uploadingImage={uploadingImage}
          handleSubmit={handleSubmit}
          resetForm={resetForm}
          onCancel={() => setShowSellForm(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Place de Marché</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <TrendingUp size={18} color="#16A34A" />
          </TouchableOpacity>
          {user && (
            <TouchableOpacity
              style={styles.sellButton}
              onPress={handleSellButtonPress}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.sellButtonText}>Vendre</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des produits..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={20} color="#16A34A" />
        </TouchableOpacity>
      </View>

      {/* Promotion Banner */}
      <View style={styles.promotionBanner}>
        <Zap size={20} color="#F59E0B" />
        <Text style={styles.promotionText}>
          Téléchargez l'app pour recevoir des notifications sur les nouveaux produits !
        </Text>
      </View>

      <CategorySelector
        categories={categoriesWithAll}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity onPress={() => loadAnnonces()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.productsContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {!user && (
          <View style={styles.authPrompt}>
            <User size={32} color="#6B7280" />
            <Text style={styles.authPromptTitle}>Connectez-vous pour vendre</Text>
            <Text style={styles.authPromptText}>
              Créez un compte pour publier vos annonces et gérer vos ventes
            </Text>
            <TouchableOpacity
              style={styles.authPromptButton}
              onPress={() => setShowAuthPrompt(true)}
            >
              <Text style={styles.authPromptButtonText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loadingText}>Chargement des annonces...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsText}>
              {filteredAnnonces.length} produits trouvés
            </Text>

            {filteredAnnonces.map((annonce) => {
              const distanceText = getDistanceText(annonce);
              return (
                <ProductCard
                  key={annonce.id}
                  annonce={annonce}
                  user={user}
                  distanceText={distanceText}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onBuy={handleBuyNow}
                  onReport={handleReport}
                  onRequireAuth={() => setShowAuthPrompt(true)}
                />
              );
            })}

            {isLoadingMore && (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.loadMoreText}>Chargement...</Text>
              </View>
            )}

            {filteredAnnonces.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Package size={48} color="#6B7280" />
                <Text style={styles.emptyStateTitle}>Aucun produit trouvé</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Soyez le premier à publier une annonce dans votre région !'
                  }
                </Text>
                {!searchQuery && selectedCategory === 'all' && (
                  <TouchableOpacity 
                    style={styles.firstToSellButton}
                    onPress={handleSellButtonPress}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.firstToSellText}>Être le premier à vendre</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <SortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        options={sortOptions}
        selected={sortBy}
        onSelect={setSortBy}
      />

      <FiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
      />

      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
      />

      <AuthPrompt
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        onLogin={() => {
          setShowAuthPrompt(false);
          setShowAuthModal(true);
        }}
      />

      <EnhancedProfileForm
        visible={showEnhancedProfileForm}
        onClose={() => setShowEnhancedProfileForm(false)}
        onSuccess={() => {
          setShowEnhancedProfileForm(false);
          Alert.alert('Succès', 'Profil créé avec succès ! Vous pouvez maintenant vendre vos produits.');
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  sellButtonText: {
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  categoryCardActive: {
    backgroundColor: '#16A34A',
  },
  categoryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#16A34A',
  },
  categoryTextActive: {
    color: '#FFFFFF',
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
  authPrompt: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authPromptTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  authPromptText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  authPromptButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  authPromptButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
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
  productsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginVertical: 16,
  },
  productCard: {
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
  productImage: {
    width: 100,
    height: 140,
  },
  productImagePlaceholder: {
    width: 100,
    height: 140,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  reportButton: {
    padding: 4,
  },
  productPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#16A34A',
    marginBottom: 8,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sellerName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
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
    color: '#16A34A',
  },
  stock: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#059669',
    marginBottom: 12,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  buyerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  editButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 4,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#374151',
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadMoreText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
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
  firstToSellButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  firstToSellText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  filtersModal: {
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
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sortOptionSelected: {
    backgroundColor: '#F0FDF4',
  },
  sortOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  sortOptionTextSelected: {
    color: '#16A34A',
    fontFamily: 'Inter-SemiBold',
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  filterInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  priceRangeContainer: {
    flexDirection: 'row',
  },
  filtersActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  clearFiltersButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyFiltersText: {
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
    color: '#16A34A',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  categoryOptionSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  categoryOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#111827',
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
  },
  formRow: {
    flexDirection: 'row',
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
    backgroundColor: '#16A34A',
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