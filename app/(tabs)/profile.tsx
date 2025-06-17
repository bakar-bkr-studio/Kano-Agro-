import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { User, Phone, MapPin, Building, Globe, Camera, CreditCard as Edit3, Save, X, Settings, Shield, Activity, Award, Users, Calendar, LogOut, Leaf, TrendingUp, Package, Clock, Mail, LogIn, UserPlus } from 'lucide-react-native';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserStats } from '@/hooks/useUserStats';
import { useUserAnnonces } from '@/hooks/useUserAnnonces';

interface ProfileSection {
  id: string;
  title: string;
  icon: any;
  fields: string[];
}

const profileSections: ProfileSection[] = [
  {
    id: 'basic',
    title: 'Informations de base',
    icon: User,
    fields: ['nom_complet', 'nom_societe', 'telephone', 'email', 'whatsapp', 'langue_preferee'],
  },
  {
    id: 'location',
    title: 'Localisation',
    icon: MapPin,
    fields: ['etat', 'lga', 'village_quartier'],
  },
  {
    id: 'personal',
    title: 'Informations personnelles',
    icon: Shield,
    fields: ['sexe', 'age_fourchette', 'bio'],
  },
  {
    id: 'agricultural',
    title: 'Activité agricole',
    icon: Leaf,
    fields: ['type_utilisateur', 'superficie_fourchette', 'cultures_pratiquees'],
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, updateProfile, signOut, loading: authLoading } = useAuth();
  const { etats, cultures, getCulturesByCategory, getEtatsByRegion } = useProfile();
  const { stats, loading: statsLoading, refreshStats } = useUserStats();
  const { annonces, loading: annoncesLoading, refreshAnnonces } = useUserAnnonces();

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (profile) {
      setFormData({
        ...profile,
        type_utilisateur: Array.isArray(profile.type_utilisateur)
          ? profile.type_utilisateur
          : profile.type_utilisateur
          ? [profile.type_utilisateur]
          : [],
      });
    }
  }, [profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshStats(),
      refreshAnnonces(),
    ]);
    setRefreshing(false);
  };

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData((prev: any) => ({
        ...prev,
        avatar_url: result.assets[0].uri,
      }));
    }
  };

  const handleSaveSection = async (sectionId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      // Convert empty strings to null for optional fields
      const cleanedFormData = {
        ...formData,
        nom_societe: formData.nom_societe === '' ? null : formData.nom_societe,
        telephone: formData.telephone === '' ? null : formData.telephone,
        email: formData.email === '' ? null : formData.email,
        whatsapp: formData.whatsapp === '' ? null : formData.whatsapp,
        bio: formData.bio === '' ? null : formData.bio,
        lga: formData.lga === '' ? null : formData.lga,
        village_quartier: formData.village_quartier === '' ? null : formData.village_quartier,
        age_fourchette: formData.age_fourchette === '' ? null : formData.age_fourchette,
        superficie_fourchette: formData.superficie_fourchette === '' ? null : formData.superficie_fourchette,
      };

      const { error } = await updateProfile(cleanedFormData);
      if (error) {
        Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le profil.');
      } else {
        Alert.alert('Succès', 'Profil mis à jour avec succès !');
        await Promise.all([refreshStats(), refreshAnnonces()]);
        setEditingSection(null);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await signOut();
              if (error) {
                console.error('Sign out error:', error);
                Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
              } else {
                // Redirect to home page after successful sign out
                router.replace('/(tabs)/');
              }
            } catch (error) {
              console.error('Unexpected sign out error:', error);
              Alert.alert('Erreur', 'Une erreur inattendue s\'est produite lors de la déconnexion.');
            }
          },
        },
      ]
    );
  };

  const toggleCulture = (cultureName: string) => {
    setFormData((prev: any) => ({
      ...prev,
      cultures_pratiquees: prev.cultures_pratiquees?.includes(cultureName)
        ? prev.cultures_pratiquees.filter((c: string) => c !== cultureName)
        : [...(prev.cultures_pratiquees || []), cultureName],
    }));
  };

  const toggleUserType = (typeKey: string) => {
    setFormData((prev: any) => ({
      ...prev,
      type_utilisateur: prev.type_utilisateur?.includes(typeKey)
        ? prev.type_utilisateur.filter((t: string) => t !== typeKey)
        : [...(prev.type_utilisateur || []), typeKey],
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderField = (fieldName: string, sectionId: string) => {
    const isEditing = editingSection === sectionId;
    const value = formData[fieldName];

    switch (fieldName) {
      case 'nom_complet':
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nom complet *</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={value || ''}
                onChangeText={(text) => setFormData((prev: any) => ({ ...prev, [fieldName]: text }))}
                placeholder="Votre nom complet"
              />
            ) : (
              <Text style={styles.fieldValue}>{value || 'Non renseigné'}</Text>
            )}
          </View>
        );

      case 'nom_societe':
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Société/Coopérative</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={value || ''}
                onChangeText={(text) => setFormData((prev: any) => ({ ...prev, [fieldName]: text }))}
                placeholder="Nom de votre société"
              />
            ) : (
              <Text style={styles.fieldValue}>{value || 'Non renseigné'}</Text>
            )}
          </View>
        );

      case 'telephone':
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Téléphone</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={value || ''}
                onChangeText={(text) => setFormData((prev: any) => ({ ...prev, [fieldName]: text }))}
                placeholder="Votre numéro de téléphone"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>{value || 'Non renseigné'}</Text>
            )}
          </View>
        );

      case 'email':
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldHelp}>Pour les notifications et la récupération de compte</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={value || ''}
                onChangeText={(text) => setFormData((prev: any) => ({ ...prev, [fieldName]: text }))}
                placeholder="Votre adresse email"
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.fieldValue}>{value || 'Non renseigné'}</Text>
            )}
          </View>
        );

      case 'whatsapp':
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>WhatsApp</Text>
            <Text style={styles.fieldHelp}>Votre numéro WhatsApp sera utilisé pour faciliter les contacts directs sur la marketplace.</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={value || ''}
                onChangeText={(text) => setFormData((prev: any) => ({ ...prev, [fieldName]: text }))}
                placeholder="Numéro WhatsApp"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>{value || 'Non renseigné'}</Text>
            )}
          </View>
        );

      case 'langue_preferee':
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Langue préférée</Text>
            {isEditing ? (
              <View style={styles.optionsContainer}>
                {['Hausa', 'Anglais', 'Français'].map((langue) => (
                  <TouchableOpacity
                    key={langue}
                    style={[
                      styles.optionButton,
                      value === langue && styles.optionButtonSelected,
                    ]}
                    onPress={() => setFormData((prev: any) => ({ ...prev, [fieldName]: langue }))}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        value === langue && styles.optionTextSelected,
                      ]}
                    >
                      {langue}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>{value || 'Non renseigné'}</Text>
            )}
          </View>
        );

      case 'etat':
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>État</Text>
            {isEditing ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.statesContainer}>
                  {Object.entries(getEtatsByRegion()).map(([region, etatsRegion]) => (
                    <View key={region} style={styles.regionGroup}>
                      <Text style={styles.regionTitle}>{region}</Text>
                      {etatsRegion.map((etat) => (
                        <TouchableOpacity
                          key={etat.id}
                          style={[
                            styles.stateButton,
                            value === etat.nom && styles.stateButtonSelected,
                          ]}
                          onPress={() => setFormData((prev: any) => ({ ...prev, [fieldName]: etat.nom }))}
                        >
                          <Text
                            style={[
                              styles.stateText,
                              value === etat.nom && styles.stateTextSelected,
                            ]}
                          >
                            {etat.nom}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.fieldValue}>{value || 'Non renseigné'}</Text>
            )}
          </View>
        );

      case 'cultures_pratiquees':
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Cultures pratiquées</Text>
            {isEditing ? (
              <View>
                {Object.entries(getCulturesByCategory()).map(([categorie, culturesList]) => (
                  <View key={categorie} style={styles.cultureCategory}>
                    <Text style={styles.categoryTitle}>{categorie}</Text>
                    <View style={styles.culturesGrid}>
                      {culturesList.map((culture) => (
                        <TouchableOpacity
                          key={culture.id}
                          style={[
                            styles.cultureButton,
                            (value || []).includes(culture.nom) && styles.cultureButtonSelected,
                          ]}
                          onPress={() => toggleCulture(culture.nom)}
                        >
                          <Text
                            style={[
                              styles.cultureText,
                              (value || []).includes(culture.nom) && styles.cultureTextSelected,
                            ]}
                          >
                            {culture.nom}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>
                {value && value.length > 0 ? value.join(', ') : 'Non renseigné'}
              </Text>
            )}
          </View>
        );

      case 'sexe':
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Sexe</Text>
            {isEditing ? (
              <View style={styles.optionsContainer}>
                {['Homme', 'Femme', 'Préfère ne pas dire'].map((sexe) => (
                  <TouchableOpacity
                    key={sexe}
                    style={[
                      styles.optionButton,
                      value === sexe && styles.optionButtonSelected,
                    ]}
                    onPress={() => setFormData((prev: any) => ({ ...prev, [fieldName]: sexe }))}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        value === sexe && styles.optionTextSelected,
                      ]}
                    >
                      {sexe}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>{value || 'Non renseigné'}</Text>
            )}
          </View>
        );

      case 'age_fourchette':
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Âge</Text>
            {isEditing ? (
              <View style={styles.optionsContainer}>
                {['18-25', '26-35', '36-45', '46-55', '56-65', '65+'].map((age) => (
                  <TouchableOpacity
                    key={age}
                    style={[
                      styles.optionButton,
                      value === age && styles.optionButtonSelected,
                    ]}
                    onPress={() => setFormData((prev: any) => ({ ...prev, [fieldName]: age }))}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        value === age && styles.optionTextSelected,
                      ]}
                    >
                      {age} ans
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>{value ? `${value} ans` : 'Non renseigné'}</Text>
            )}
          </View>
        );

      case 'bio':
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <Text style={styles.fieldHelp}>Courte description de votre profil ou de votre activité</Text>
            {isEditing ? (
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={value || ''}
                onChangeText={(text) => setFormData((prev: any) => ({ ...prev, [fieldName]: text }))}
                placeholder="Quelques mots sur vous"
                multiline
              />
            ) : (
              <Text style={styles.fieldValue}>{value || 'Non renseigné'}</Text>
            )}
          </View>
        );

      case 'type_utilisateur':
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Type d'utilisateur</Text>
            {isEditing ? (
              <View style={styles.optionsContainer}>
                {[
                  { key: 'producteur', label: 'Producteur' },
                  { key: 'acheteur', label: 'Acheteur' },
                  { key: 'prestataire_service', label: 'Prestataire' },
                  { key: 'agent', label: 'Agent agricole' },
                  { key: 'cooperative', label: 'Coopérative' },
                  { key: 'transformateur', label: 'Transformateur' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.optionButton,
                      (value || []).includes(type.key) && styles.optionButtonSelected,
                    ]}
                    onPress={() => toggleUserType(type.key)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        (value || []).includes(type.key) && styles.optionTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>
                {value && value.length > 0
                  ? value
                      .map((v: string) =>
                        v === 'producteur'
                          ? 'Producteur'
                          : v === 'acheteur'
                          ? 'Acheteur'
                          : v === 'prestataire_service'
                          ? 'Prestataire'
                          : v === 'agent'
                          ? 'Agent agricole'
                          : v === 'cooperative'
                          ? 'Coopérative'
                          : v === 'transformateur'
                          ? 'Transformateur'
                          : v
                      )
                      .join(', ')
                  : 'Non renseigné'}
              </Text>
            )}
          </View>
        );

      case 'superficie_fourchette':
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Superficie exploitée</Text>
            {isEditing ? (
              <View style={styles.optionsContainer}>
                {['Moins de 1 ha', '1-3 ha', '3-10 ha', '10-50 ha', 'Plus de 50 ha'].map((superficie) => (
                  <TouchableOpacity
                    key={superficie}
                    style={[
                      styles.optionButton,
                      value === superficie && styles.optionButtonSelected,
                    ]}
                    onPress={() => setFormData((prev: any) => ({ ...prev, [fieldName]: superficie }))}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        value === superficie && styles.optionTextSelected,
                      ]}
                    >
                      {superficie}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>{value || 'Non renseigné'}</Text>
            )}
          </View>
        );

      default:
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{fieldName.replace('_', ' ')}</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={value || ''}
                onChangeText={(text) => setFormData((prev: any) => ({ ...prev, [fieldName]: text }))}
                placeholder={`Votre ${fieldName.replace('_', ' ')}`}
              />
            ) : (
              <Text style={styles.fieldValue}>{value || 'Non renseigné'}</Text>
            )}
          </View>
        );
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <User size={64} color="#6B7280" />
          <Text style={styles.emptyStateTitle}>Non connecté</Text>
          <Text style={styles.emptyStateText}>
            Veuillez vous connecter pour accéder à votre profil
          </Text>
          <View style={styles.authButtonsContainer}>
            <TouchableOpacity
              style={styles.authButton}
              onPress={() => {
                setAuthMode('signin');
                setShowAuthModal(true);
              }}
            >
              <LogIn size={16} color="#16A34A" />
              <Text style={styles.authButtonText}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authButton, styles.signUpButton]}
              onPress={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
            >
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={[styles.authButtonText, styles.signUpButtonText]}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4ADE80', '#22C55E', '#16A34A']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePicker}>
            {formData.avatar_url ? (
              <Image source={{ uri: formData.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={32} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Camera size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{formData.nom_complet || 'Utilisateur'}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.locationInfo}>
              <MapPin size={14} color="#FFFFFF" />
              <Text style={styles.locationText}>
                {formData.etat ? `${formData.etat}, Nigeria` : 'Localisation non définie'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {formData.profil_verifie && (
          <View style={styles.verifiedBadge}>
            <Shield size={16} color="#FFFFFF" />
            <Text style={styles.verifiedText}>Profil vérifié</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Activity Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Statistiques d'activité</Text>
          {statsLoading ? (
            <View style={styles.statsLoadingContainer}>
              <ActivityIndicator size="small" color="#16A34A" />
              <Text style={styles.statsLoadingText}>Chargement des statistiques...</Text>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Package size={20} color="#16A34A" />
                <Text style={styles.statNumber}>{stats.annonces_publiees}</Text>
                <Text style={styles.statLabel}>Annonces</Text>
              </View>
              <View style={styles.statCard}>
                <TrendingUp size={20} color="#F59E0B" />
                <Text style={styles.statNumber}>{stats.ventes_realisees}</Text>
                <Text style={styles.statLabel}>Ventes</Text>
              </View>
              <View style={styles.statCard}>
                <Users size={20} color="#3B82F6" />
                <Text style={styles.statNumber}>{stats.achats_effectues}</Text>
                <Text style={styles.statLabel}>Achats</Text>
              </View>
              <View style={styles.statCard}>
                <Calendar size={20} color="#8B5CF6" />
                <Text style={styles.statNumber}>
                  {stats.membre_depuis ? new Date(stats.membre_depuis).getFullYear() : '2024'}
                </Text>
                <Text style={styles.statLabel}>Connexions</Text>
              </View>
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Activité récente</Text>
          {annoncesLoading ? (
            <View style={styles.activityLoadingContainer}>
              <ActivityIndicator size="small" color="#16A34A" />
              <Text style={styles.activityLoadingText}>Chargement des annonces...</Text>
            </View>
          ) : annonces.length > 0 ? (
            <View style={styles.recentAnnonces}>
              {annonces.slice(0, 3).map((annonce) => (
                <View key={annonce.id} style={styles.annonceItem}>
                  <View style={styles.annonceInfo}>
                    <Text style={styles.annonceTitle}>{annonce.titre}</Text>
                    <Text style={styles.annoncePrice}>{annonce.prix} {annonce.unite_prix}</Text>
                    <Text style={styles.annonceDate}>
                      {formatDate(annonce.date_publication)}
                    </Text>
                  </View>
                  <View style={[
                    styles.annonceStatus,
                    { backgroundColor: 
                      annonce.statut === 'disponible' ? '#DCFCE7' :
                      annonce.statut === 'vendu' ? '#FEF3C7' : '#FEF2F2'
                    }
                  ]}>
                    <Text style={[
                      styles.annonceStatusText,
                      { color: 
                        annonce.statut === 'disponible' ? '#16A34A' :
                        annonce.statut === 'vendu' ? '#F59E0B' : '#DC2626'
                      }
                    ]}>
                      {annonce.statut === 'disponible' ? 'Disponible' :
                       annonce.statut === 'vendu' ? 'Vendu' : 'Suspendu'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivity}>
              <Package size={32} color="#6B7280" />
              <Text style={styles.emptyActivityText}>Aucune annonce publiée</Text>
            </View>
          )}
        </View>

        {/* Last Connection */}
        {stats.derniere_connexion && (
          <View style={styles.connectionContainer}>
            <View style={styles.connectionInfo}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.connectionText}>
                Dernière connexion: {formatDate(stats.derniere_connexion)}
              </Text>
            </View>
          </View>
        )}

        {/* Profile Sections */}
        {profileSections.map((section) => {
          const IconComponent = section.icon;
          const isEditing = editingSection === section.id;

          return (
            <View key={section.id} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <IconComponent size={20} color="#16A34A" />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    if (isEditing) {
                      handleSaveSection(section.id);
                    } else {
                      setEditingSection(section.id);
                    }
                  }}
                  disabled={loading}
                >
                  {loading && editingSection === section.id ? (
                    <ActivityIndicator size="small" color="#16A34A" />
                  ) : isEditing ? (
                    <Save size={20} color="#16A34A" />
                  ) : (
                    <Edit3 size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.sectionContent}>
                {section.fields.map((field) => renderField(field, section.id))}
              </View>

              {isEditing && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditingSection(null);
                    setFormData(profile || {});
                  }}
                >
                  <X size={16} color="#DC2626" />
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Account Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color="#DC2626" />
            <Text style={styles.signOutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  authButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  signUpButton: {
    backgroundColor: '#16A34A',
  },
  authButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#16A34A',
    marginLeft: 4,
  },
  signUpButtonText: {
    color: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  statsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  statsLoadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  activityContainer: {
    marginBottom: 24,
  },
  activityLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  activityLoadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  recentAnnonces: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  annonceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  annonceInfo: {
    flex: 1,
  },
  annonceTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  annoncePrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#16A34A',
    marginBottom: 2,
  },
  annonceDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  annonceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  annonceStatusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  emptyActivity: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyActivityText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  connectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContent: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  fieldValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#111827',
  },
  fieldHelp: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  optionButtonSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  optionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  statesContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  regionGroup: {
    minWidth: 150,
  },
  regionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#16A34A',
    marginBottom: 8,
  },
  stateButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  stateButtonSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  stateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#374151',
  },
  stateTextSelected: {
    color: '#FFFFFF',
  },
  cultureCategory: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  culturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cultureButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  cultureButtonSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  cultureText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#374151',
  },
  cultureTextSelected: {
    color: '#FFFFFF',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 4,
  },
  actionsContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 16,
  },
  signOutButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#DC2626',
    marginLeft: 8,
  },
});