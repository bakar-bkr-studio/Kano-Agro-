import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Star, User, MapPin, LogIn, UserPlus, BellOff, Navigation, CreditCard as Edit3, X, CircleCheck as CheckCircle } from 'lucide-react-native';
import FavoritesModal, { FavoriteItem } from '@/components/FavoritesModal';
import AuthPrompt from '@/components/marketplace/AuthPrompt';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/AuthModal';

const { width: screenWidth } = Dimensions.get('window');

// Mock notifications data
const mockNotifications = [
  { id: 1, title: 'Nouvelle alerte météo', message: 'Risque de pluie dans 2h', type: 'weather', unread: true, timestamp: new Date(Date.now() - 30 * 60 * 1000) },
  { id: 2, title: 'Diagnostic terminé', message: 'Résultats disponibles', type: 'diagnosis', unread: true, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 3, title: 'Nouveau produit près de vous', message: 'Tomates fraîches à 2km', type: 'marketplace', unread: false, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
];


export default function HomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [weatherInfo] = useState({ temp: 28, icon: '☀️' });
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerPadding = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [20, 8],
    extrapolate: 'clamp',
  });

  const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
  
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

  const handleFavoritesPress = () => {
    if (user) {
      setShowFavorites(true);
    } else {
      setShowAuthPrompt(true);
    }
  };

  const handleSelectFavorite = (id: string) => {
    setShowFavorites(false);
    router.push('/(tabs)/marketplace');
  };

  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    if (offset > 50 && !headerCollapsed) setHeaderCollapsed(true);
    if (offset <= 50 && headerCollapsed) setHeaderCollapsed(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <AnimatedLinearGradient
          colors={['#4ADE80', '#22C55E', '#16A34A']}
          style={[styles.header, { paddingVertical: headerPadding }]}
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
                    {!headerCollapsed && (
                      <Text style={styles.greeting}>Bonjour,</Text>
                    )}
                    <Text style={styles.userName}>
                      {profile?.nom_complet || user?.email?.split('@')[0] || 'Utilisateur'}
                    </Text>
                  </>
                ) : (
                  <>
                    {!headerCollapsed && (
                      <Text style={styles.greeting}>Bienvenue,</Text>
                    )}
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
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleFavoritesPress}
            >
              <Star size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {!headerCollapsed && (
          <View style={styles.infoRow}>
            <TouchableOpacity style={styles.locationInfo} onPress={handleLocationPress}>
              <MapPin size={16} color="#FFFFFF" />
              <Text style={styles.locationText}>
                {profile?.etat ? `${profile.etat}, Nigeria` : 'Kano, Nigeria'}
              </Text>
              <Navigation size={14} color="#FFFFFF" style={styles.locationIcon} />
            </TouchableOpacity>
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherText}>{weatherInfo.temp}°C</Text>
              <Text style={styles.weatherIcon}>{weatherInfo.icon}</Text>
            </View>
          </View>
          )}

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
          </AnimatedLinearGradient>
        {/* Empty content below header */}

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

        <FavoritesModal
          visible={showFavorites}
          favorites={favorites}
          onClose={() => setShowFavorites(false)}
          onSelect={handleSelectFavorite}
        />

        <AuthPrompt
          visible={showAuthPrompt}
          onClose={() => setShowAuthPrompt(false)}
          onLogin={() => {
            setShowAuthPrompt(false);
            setAuthMode('signin');
            setShowAuthModal(true);
          }}
        />

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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  weatherText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  weatherIcon: {
    marginLeft: 4,
    fontSize: 14,
    color: '#FFFFFF',
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

