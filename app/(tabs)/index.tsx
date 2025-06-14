import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, Dimensions, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Sun, Camera, Store, Truck, Phone, Bell, User, MapPin, Leaf, LogIn, UserPlus, BellOff, Navigation, CreditCard as Edit3, TrendingUp, Package, Activity, Calendar, Zap, Shield, Users, Sprout, X, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Clock } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/AuthModal';

const { width: screenWidth } = Dimensions.get('window');

// Mock notifications data
const mockNotifications = [
  { id: 1, title: 'Nouvelle alerte météo', message: 'Risque de pluie dans 2h', type: 'weather', unread: true, timestamp: new Date(Date.now() - 30 * 60 * 1000) },
  { id: 2, title: 'Diagnostic terminé', message: 'Résultats disponibles', type: 'diagnosis', unread: true, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 3, title: 'Nouveau produit près de vous', message: 'Tomates fraîches à 2km', type: 'marketplace', unread: false, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
];

// Dynamic tips based on weather/season/time
const getDynamicTip = () => {
  const month = new Date().getMonth();
  const hour = new Date().getHours();
  const day = new Date().getDay();
  
  const tips = {
    morning: {
      title: 'Conseil du matin',
      text: 'C\'est le moment idéal pour l\'arrosage. Les plantes absorbent mieux l\'eau avant la chaleur.',
      image: 'https://images.pexels.com/photos/1459375/pexels-photo-1459375.jpeg?auto=compress&cs=tinysrgb&w=400',
      icon: 'Sun'
    },
    afternoon: {
      title: 'Conseil de l\'après-midi',
      text: 'Évitez l\'arrosage en plein soleil. Préférez inspecter vos cultures pour détecter les maladies.',
      image: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=400',
      icon: 'Shield'
    },
    evening: {
      title: 'Conseil du soir',
      text: 'Planifiez vos activités de demain et vérifiez la météo pour optimiser vos travaux agricoles.',
      image: 'https://images.pexels.com/photos/574919/pexels-photo-574919.jpeg?auto=compress&cs=tinysrgb&w=400',
      icon: 'Calendar'
    },
    rainy_season: {
      title: 'Saison des pluies',
      text: 'Surveillez vos cultures contre les maladies fongiques et assurez-vous du bon drainage.',
      image: 'https://images.pexels.com/photos/1459374/pexels-photo-1459374.jpeg?auto=compress&cs=tinysrgb&w=400',
      icon: 'Shield'
    },
    dry_season: {
      title: 'Saison sèche',
      text: 'Optimisez votre irrigation et protégez vos cultures contre la chaleur excessive.',
      image: 'https://images.pexels.com/photos/2518861/pexels-photo-2518861.jpeg?auto=compress&cs=tinysrgb&w=400',
      icon: 'Zap'
    },
    weekend: {
      title: 'Conseil du weekend',
      text: 'Profitez du weekend pour planifier vos semis de la semaine prochaine et entretenir vos outils.',
      image: 'https://images.pexels.com/photos/1459374/pexels-photo-1459374.jpeg?auto=compress&cs=tinysrgb&w=400',
      icon: 'Calendar'
    }
  };

  // Determine tip based on time and season
  if (day === 0 || day === 6) { // Weekend
    return tips.weekend;
  } else if (month >= 4 && month <= 9) { // Rainy season
    return tips.rainy_season;
  } else if (month >= 10 || month <= 3) { // Dry season
    return tips.dry_season;
  } else if (hour >= 6 && hour < 12) {
    return tips.morning;
  } else if (hour >= 12 && hour < 18) {
    return tips.afternoon;
  } else {
    return tips.evening;
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentTip, setCurrentTip] = useState(getDynamicTip());
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1)
  ]).current;

  useEffect(() => {
    // Fade in animation on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Update tip every hour
    const interval = setInterval(() => {
      setCurrentTip(getDynamicTip());
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleProfilePress = () => {
    if (user) {
      router.push('/(tabs)/profile');
    } else {
      setAuthMode('signin');
      setShowAuthModal(true);
    }
  };

  const handleSignUpPress = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleSignInPress = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  const handleNotificationPress = () => {
    setShowNotifications(!showNotifications);
  };

  const handleLocationPress = () => {
    setShowLocationModal(true);
  };

  const animatePress = (callback: () => void, index?: number) => {
    const animation = index !== undefined ? cardAnimations[index] : scaleAnim;
    
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, unread: false } : notif
      )
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const formatNotificationTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else {
      return `Il y a ${diffDays}j`;
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;
  const hasNotifications = notifications.length > 0;

  // Service stats (mock data - in real app, fetch from API)
  const serviceStats = {
    weather: { count: 3, label: 'alertes actives', color: '#DBEAFE' },
    diagnosis: { count: 12, label: 'diagnostics', color: '#DCFCE7' },
    marketplace: { count: 45, label: 'produits', color: '#FEF3C7' },
    equipment: { count: 8, label: 'équipements', color: '#F3E8FF' },
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Sun, Shield, Calendar, Zap
    };
    return icons[iconName] || Zap;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <LinearGradient
          colors={['#4ADE80', '#22C55E', '#16A34A']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.userInfo} onPress={handleProfilePress}>
              <View style={styles.avatar}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <User size={28} color="#FFFFFF" />
                )}
              </View>
              <View>
                {user ? (
                  <>
                    <Text style={styles.greeting}>Bonjour,</Text>
                    <Text style={styles.userName}>
                      {profile?.nom_complet || user?.email?.split('@')[0] || 'Utilisateur'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.greeting}>Bienvenue,</Text>
                    <Text style={styles.userName}>Visiteur</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
            
            {hasNotifications && (
              <TouchableOpacity 
                style={styles.notificationButton} 
                onPress={handleNotificationPress}
              >
                <Bell size={24} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity style={styles.locationInfo} onPress={handleLocationPress}>
            <MapPin size={16} color="#FFFFFF" />
            <Text style={styles.locationText}>
              {profile?.etat ? `${profile.etat}, Nigeria` : 'Kano, Nigeria'}
            </Text>
            <Navigation size={14} color="#FFFFFF" style={styles.locationIcon} />
          </TouchableOpacity>

          {/* Authentication buttons for non-connected users */}
          {!user && (
            <View style={styles.authButtonsContainer}>
              <TouchableOpacity style={styles.authButton} onPress={handleSignInPress}>
                <LogIn size={16} color="#16A34A" />
                <Text style={styles.authButtonText}>Se connecter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.authButton, styles.signUpButton]} onPress={handleSignUpPress}>
                <UserPlus size={16} color="#FFFFFF" />
                <Text style={[styles.authButtonText, styles.signUpButtonText]}>Créer un compte</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Enhanced Stats Cards */}
          <View style={styles.statsContainer}>
            <Animated.View style={[styles.statCard, styles.statCardPrimary, { transform: [{ scale: cardAnimations[0] }] }]}>
              <TouchableOpacity 
                style={styles.statCardContent}
                onPress={() => animatePress(() => {}, 0)}
                activeOpacity={0.8}
              >
                <View style={styles.statIconContainer}>
                  <Leaf size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>
                  {profile?.superficie_exploitation || '2.5'} ha
                </Text>
                <Text style={styles.statLabel}>Superficie</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View style={[styles.statCard, styles.statCardSecondary, { transform: [{ scale: cardAnimations[1] }] }]}>
              <TouchableOpacity 
                style={styles.statCardContent}
                onPress={() => animatePress(() => router.push('/(tabs)/weather'), 1)}
                activeOpacity={0.8}
              >
                <View style={styles.statIconContainer}>
                  <Sun size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>28°C</Text>
                <Text style={styles.statLabel}>Température</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View style={[styles.statCard, styles.statCardTertiary, { transform: [{ scale: cardAnimations[2] }] }]}>
              <TouchableOpacity 
                style={styles.statCardContent}
                onPress={() => animatePress(() => router.push('/(tabs)/marketplace'), 2)}
                activeOpacity={0.8}
              >
                <View style={styles.statIconContainer}>
                  <Store size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>Produits</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services Principaux</Text>
            <View style={styles.servicesGrid}>
              <TouchableOpacity 
                style={[styles.serviceCard, styles.serviceCardWeather]}
                onPress={() => animatePress(() => router.push('/(tabs)/weather'))}
                activeOpacity={0.8}
              >
                <View style={[styles.serviceIcon, { backgroundColor: serviceStats.weather.color }]}>
                  <Sun size={40} color="#3B82F6" />
                </View>
                <Text style={styles.serviceTitle}>Météo</Text>
                <Text style={styles.serviceDesc}>Alertes personnalisées</Text>
                <View style={styles.serviceInfoContainer}>
                  <Text style={styles.serviceInfo}>{serviceStats.weather.count} {serviceStats.weather.label}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.serviceCard, styles.serviceCardDiagnosis]}
                onPress={() => animatePress(() => router.push('/(tabs)/diagnosis'))}
                activeOpacity={0.8}
              >
                <View style={[styles.serviceIcon, { backgroundColor: serviceStats.diagnosis.color }]}>
                  <Camera size={40} color="#16A34A" />
                </View>
                <Text style={styles.serviceTitle}>Diagnostic</Text>
                <Text style={styles.serviceDesc}>IA pour cultures</Text>
                <View style={styles.serviceInfoContainer}>
                  <Text style={styles.serviceInfo}>{serviceStats.diagnosis.count} {serviceStats.diagnosis.label}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.serviceCard, styles.serviceCardMarket]}
                onPress={() => animatePress(() => router.push('/(tabs)/marketplace'))}
                activeOpacity={0.8}
              >
                <View style={[styles.serviceIcon, { backgroundColor: serviceStats.marketplace.color }]}>
                  <Store size={40} color="#F59E0B" />
                </View>
                <Text style={styles.serviceTitle}>Marché</Text>
                <Text style={styles.serviceDesc}>Vendre vos produits</Text>
                <View style={styles.serviceInfoContainer}>
                  <Text style={styles.serviceInfo}>{serviceStats.marketplace.count} {serviceStats.marketplace.label}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.serviceCard, styles.serviceCardEquipment]}
                onPress={() => animatePress(() => router.push('/(tabs)/equipment'))}
                activeOpacity={0.8}
              >
                <View style={[styles.serviceIcon, { backgroundColor: serviceStats.equipment.color }]}>
                  <Truck size={40} color="#8B5CF6" />
                </View>
                <Text style={styles.serviceTitle}>Matériel</Text>
                <Text style={styles.serviceDesc}>Location équipement</Text>
                <View style={styles.serviceInfoContainer}>
                  <Text style={styles.serviceInfo}>{serviceStats.equipment.count} {serviceStats.equipment.label}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.sosButton}
            onPress={() => animatePress(() => router.push('/(tabs)/sos'))}
            activeOpacity={0.8}
          >
            <Phone size={24} color="#FFFFFF" />
            <Text style={styles.sosText}>Urgence - SOS</Text>
            <View style={styles.sosIndicator}>
              <Activity size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Dynamic Tip Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conseil du Moment</Text>
            <View style={styles.tipCard}>
              <Image 
                source={{ uri: currentTip.image }}
                style={styles.tipImage}
              />
              <View style={styles.tipContent}>
                <View style={styles.tipHeader}>
                  <Text style={styles.tipTitle}>{currentTip.title}</Text>
                  {React.createElement(getIconComponent(currentTip.icon), { size: 20, color: '#F59E0B' })}
                </View>
                <Text style={styles.tipText}>{currentTip.text}</Text>
                <View style={styles.tipFooter}>
                  <Calendar size={14} color="#6B7280" />
                  <Text style={styles.tipTime}>
                    {new Date().toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Enhanced Profile Section */}
          {profile && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mon Profil</Text>
              <TouchableOpacity style={styles.profileCard} onPress={handleProfilePress}>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profile.nom_complet}</Text>
                  <Text style={styles.profileType}>
                    {Array.isArray(profile.type_utilisateur) && profile.type_utilisateur.length > 0
                      ? profile.type_utilisateur
                          .map((t) =>
                            t === 'producteur'
                              ? 'Producteur'
                              : t === 'acheteur'
                              ? 'Acheteur'
                              : t === 'prestataire_service'
                              ? 'Prestataire'
                              : t === 'agent'
                              ? 'Agent agricole'
                              : t === 'cooperative'
                              ? 'Coopérative'
                              : t === 'transformateur'
                              ? 'Transformateur'
                              : t
                          )
                          .join(', ')
                      : 'Producteur'}
                  </Text>
                  {profile.cultures_pratiquees && profile.cultures_pratiquees.length > 0 && (
                    <Text style={styles.profileCultures}>
                      Cultures: {profile.cultures_pratiquees.slice(0, 3).join(', ')}
                      {profile.cultures_pratiquees.length > 3 && '...'}
                    </Text>
                  )}
                  <TouchableOpacity style={styles.editProfileButton} onPress={handleProfilePress}>
                    <Edit3 size={14} color="#16A34A" />
                    <Text style={styles.editProfileText}>Éditer mon profil</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.profileArrow}>
                  <Text style={styles.profileArrowText}>→</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Enhanced Non-Connected User Section */}
          {!user && (
            <View style={styles.section}>
              <View style={styles.nonConnectedCard}>
                <User size={48} color="#6B7280" />
                <Text style={styles.nonConnectedTitle}>Rejoignez la communauté</Text>
                <Text style={styles.nonConnectedText}>
                  Connectez-vous pour accéder à toutes les fonctionnalités
                </Text>
                
                {/* Benefits */}
                <View style={styles.benefitsContainer}>
                  <View style={styles.benefitItem}>
                    <TrendingUp size={20} color="#16A34A" />
                    <Text style={styles.benefitText}>Historique et statistiques</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Bell size={20} color="#16A34A" />
                    <Text style={styles.benefitText}>Alertes personnalisées</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Users size={20} color="#16A34A" />
                    <Text style={styles.benefitText}>Services communautaires</Text>
                  </View>
                </View>

                <View style={styles.nonConnectedButtons}>
                  <TouchableOpacity style={styles.connectButton} onPress={handleSignInPress}>
                    <LogIn size={16} color="#FFFFFF" />
                    <Text style={styles.connectButtonText}>Se connecter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.createAccountButton} onPress={handleSignUpPress}>
                    <UserPlus size={16} color="#16A34A" />
                    <Text style={styles.createAccountButtonText}>Créer un compte</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Quick Stats for authenticated users */}
          {user && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activité Récente</Text>
              <View style={styles.quickStatsGrid}>
                <View style={styles.quickStatCard}>
                  <Package size={24} color="#3B82F6" />
                  <Text style={styles.quickStatNumber}>3</Text>
                  <Text style={styles.quickStatLabel}>Annonces</Text>
                </View>
                <View style={styles.quickStatCard}>
                  <Camera size={24} color="#16A34A" />
                  <Text style={styles.quickStatNumber}>12</Text>
                  <Text style={styles.quickStatLabel}>Diagnostics</Text>
                </View>
                <View style={styles.quickStatCard}>
                  <Shield size={24} color="#F59E0B" />
                  <Text style={styles.quickStatNumber}>2</Text>
                  <Text style={styles.quickStatLabel}>Alertes</Text>
                </View>
                <View style={styles.quickStatCard}>
                  <Sprout size={24} color="#8B5CF6" />
                  <Text style={styles.quickStatNumber}>
                    {profile?.cultures_pratiquees?.length || 0}
                  </Text>
                  <Text style={styles.quickStatLabel}>Cultures</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Notifications Modal */}
        <Modal
          visible={showNotifications}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNotifications(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.notificationsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.notificationsList}>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <View key={notification.id} style={[
                      styles.notificationItem,
                      notification.unread && styles.notificationItemUnread
                    ]}>
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                          <Text style={styles.notificationTitle}>{notification.title}</Text>
                          <Text style={styles.notificationTime}>
                            {formatNotificationTime(notification.timestamp)}
                          </Text>
                        </View>
                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                      </View>
                      <View style={styles.notificationActions}>
                        {notification.unread && (
                          <TouchableOpacity 
                            style={styles.markReadButton}
                            onPress={() => markNotificationAsRead(notification.id)}
                          >
                            <CheckCircle size={16} color="#16A34A" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => deleteNotification(notification.id)}
                        >
                          <X size={16} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyNotifications}>
                    <BellOff size={48} color="#6B7280" />
                    <Text style={styles.emptyNotificationsText}>Aucune notification</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Location Modal */}
        <Modal
          visible={showLocationModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLocationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.locationModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Changer ma localisation</Text>
                <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.locationContent}>
                <Text style={styles.locationDescription}>
                  Pour modifier votre localisation, veuillez mettre à jour votre profil.
                </Text>
                
                <TouchableOpacity 
                  style={styles.updateLocationButton}
                  onPress={() => {
                    setShowLocationModal(false);
                    router.push('/(tabs)/profile');
                  }}
                >
                  <Edit3 size={16} color="#FFFFFF" />
                  <Text style={styles.updateLocationText}>Modifier mon profil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <AuthModal 
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  userName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    minHeight: 44,
  },
  locationText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
    marginRight: 8,
  },
  locationIcon: {
    opacity: 0.8,
  },
  authButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -20,
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 130,
  },
  statCardContent: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    flex: 1,
  },
  statCardPrimary: {
    backgroundColor: '#16A34A',
  },
  statCardSecondary: {
    backgroundColor: '#F59E0B',
  },
  statCardTertiary: {
    backgroundColor: '#3B82F6',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: (screenWidth - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 180,
    borderLeftWidth: 4,
  },
  serviceCardWeather: {
    borderLeftColor: '#3B82F6',
  },
  serviceCardDiagnosis: {
    borderLeftColor: '#16A34A',
  },
  serviceCardMarket: {
    borderLeftColor: '#F59E0B',
  },
  serviceCardEquipment: {
    borderLeftColor: '#8B5CF6',
  },
  serviceIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  serviceDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  serviceInfoContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceInfo: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#16A34A',
    textAlign: 'center',
  },
  sosButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
    minHeight: 56,
  },
  sosText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  sosIndicator: {
    position: 'absolute',
    right: 16,
    opacity: 0.8,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipImage: {
    width: '100%',
    height: 140,
  },
  tipContent: {
    padding: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tipTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  tipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  profileType: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#16A34A',
    marginBottom: 4,
  },
  profileCultures: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editProfileText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#16A34A',
    marginLeft: 4,
  },
  profileArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileArrowText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#16A34A',
  },
  nonConnectedCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nonConnectedTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  nonConnectedText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  benefitsContainer: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  benefitText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  nonConnectedButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
  },
  connectButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  createAccountButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
  },
  createAccountButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#16A34A',
    marginLeft: 4,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickStatCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 100,
  },
  quickStatNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  notificationsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  locationModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
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
  notificationsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationItemUnread: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  notificationTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  notificationMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 8,
  },
  markReadButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyNotificationsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  locationContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  locationDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  updateLocationButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  updateLocationText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
});