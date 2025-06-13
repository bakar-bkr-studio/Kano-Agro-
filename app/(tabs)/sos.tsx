import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Phone, MapPin, Users, Heart, TriangleAlert as AlertTriangle, Navigation, Shield, Clock, RefreshCw } from 'lucide-react-native';
import InteractiveMap from '@/components/InteractiveMap';

const emergencyContacts = [
  {
    id: 1,
    name: 'Police Nationale',
    number: '122',
    type: 'police',
    icon: Shield,
    color: '#3B82F6'
  },
  {
    id: 2,
    name: 'Urgences Médicales',
    number: '15',
    type: 'medical',
    icon: Heart,
    color: '#DC2626'
  },
  {
    id: 3,
    name: 'Pompiers',
    number: '18',
    type: 'fire',
    icon: AlertTriangle,
    color: '#F59E0B'
  },
  {
    id: 4,
    name: 'Centre Agricole',
    number: '+234 803 555 0123',
    type: 'agricultural',
    icon: Users,
    color: '#16A34A'
  },
];

const quickActions = [
  {
    id: 1,
    title: 'Appel d\'Urgence',
    description: 'Composer le 122',
    action: () => Linking.openURL('tel:122'),
    color: '#DC2626',
    icon: Phone
  },
  {
    id: 2,
    title: 'Ma Position',
    description: 'Partager localisation',
    action: 'shareLocation',
    color: '#3B82F6',
    icon: MapPin
  },
  {
    id: 3,
    title: 'Alerte Communauté',
    description: 'Prévenir les voisins',
    action: 'alertCommunity',
    color: '#F59E0B',
    icon: Users
  }
];

// Mock data for alerts
const mockAlerts = [
  {
    id: '1',
    type: 'active' as const,
    category: 'medical' as const,
    title: 'Urgence Médicale',
    description: 'Agriculteur blessé lors de la récolte, besoin d\'assistance immédiate',
    location: {
      latitude: 12.0022,
      longitude: 8.5920,
      address: 'Kano Centre, Nigeria'
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    reporter: 'Amadou Diallo',
    contact: '+234 803 555 0001',
    status: 'En cours de traitement'
  },
  {
    id: '2',
    type: 'active' as const,
    category: 'security' as const,
    title: 'Vol de Matériel',
    description: 'Tentative de vol de tracteur signalée dans la zone agricole',
    location: {
      latitude: 12.0122,
      longitude: 8.6020,
      address: 'Zone Agricole Nord, Kano'
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    reporter: 'Ibrahim Sani',
    contact: '+234 803 555 0002',
    status: 'Patrouille en route'
  },
  {
    id: '3',
    type: 'resolved' as const,
    category: 'fire' as const,
    title: 'Incendie de Champ',
    description: 'Incendie maîtrisé dans un champ de maïs',
    location: {
      latitude: 11.9922,
      longitude: 8.5820,
      address: 'Ferme Collective Sud, Kano'
    },
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    reporter: 'Fatima Abdou',
    status: 'Résolu - Dégâts minimes'
  },
  {
    id: '4',
    type: 'historical' as const,
    category: 'agricultural' as const,
    title: 'Invasion de Criquets',
    description: 'Signalement d\'invasion de criquets dans plusieurs fermes',
    location: {
      latitude: 12.0222,
      longitude: 8.6120,
      address: 'District Est, Kano'
    },
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    reporter: 'Moussa Garba',
    status: 'Traité avec succès'
  },
  {
    id: '5',
    type: 'resolved' as const,
    category: 'medical' as const,
    title: 'Intoxication Alimentaire',
    description: 'Cas d\'intoxication alimentaire dans une famille d\'agriculteurs',
    location: {
      latitude: 11.9822,
      longitude: 8.5720,
      address: 'Village de Rijiyar Lemo, Kano'
    },
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    reporter: 'Aisha Mohammed',
    status: 'Patients stabilisés'
  }
];

export default function SOSScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(true);

  const screenHeight = Dimensions.get('window').height;
  const mapHeight = screenHeight * 0.4; // 40% of screen height

  useEffect(() => {
    requestLocationPermission();
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Randomly update alert statuses or add new ones
      if (Math.random() > 0.8) {
        simulateNewAlert();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
    }
  };

  const simulateNewAlert = () => {
    const newAlert = {
      id: Date.now().toString(),
      type: 'active' as const,
      category: ['medical', 'security', 'agricultural', 'fire'][Math.floor(Math.random() * 4)] as any,
      title: 'Nouvelle Alerte',
      description: 'Une nouvelle situation d\'urgence a été signalée',
      location: {
        latitude: 12.0022 + (Math.random() - 0.5) * 0.1,
        longitude: 8.5920 + (Math.random() - 0.5) * 0.1,
        address: 'Zone Agricole, Kano'
      },
      timestamp: new Date(),
      reporter: 'Utilisateur Anonyme',
      status: 'Nouveau signalement'
    };

    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleEmergencyCall = (number: string) => {
    Alert.alert(
      'Appel d\'Urgence',
      `Voulez-vous appeler ${number} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Appeler', 
          style: 'destructive',
          onPress: () => Linking.openURL(`tel:${number}`)
        }
      ]
    );
  };

  const shareLocation = async () => {
    if (!location) {
      Alert.alert('Erreur', 'Position non disponible');
      return;
    }

    const coords = `${location.coords.latitude},${location.coords.longitude}`;
    const message = `URGENCE: Je suis à cette position: https://maps.google.com/?q=${coords}`;
    
    Alert.alert(
      'Position Partagée',
      'Votre position a été partagée aux contacts d\'urgence'
    );
  };

  const alertCommunity = () => {
    Alert.alert(
      'Alerte Communauté',
      'Une alerte a été envoyée à votre communauté agricole locale'
    );
  };

  const refreshAlerts = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleQuickAction = (action: string | (() => void)) => {
    if (typeof action === 'function') {
      action();
    } else if (action === 'shareLocation') {
      shareLocation();
    } else if (action === 'alertCommunity') {
      alertCommunity();
    }
  };

  const handleAlertPress = (alert: any) => {
    console.log('Alert pressed:', alert);
  };

  const activeAlerts = alerts.filter(alert => alert.type === 'active');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <AlertTriangle size={32} color="#DC2626" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Urgences SOS</Text>
            <Text style={styles.headerSubtitle}>
              {activeAlerts.length} alertes actives dans votre région
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={refreshAlerts}
          disabled={isRefreshing}
        >
          <RefreshCw 
            size={20} 
            color="#FFFFFF" 
            style={isRefreshing ? { transform: [{ rotate: '180deg' }] } : {}}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Interactive Map Section */}
        <View style={[styles.mapSection, { height: mapHeight }]}>
          <InteractiveMap
            alerts={alerts}
            onAlertPress={handleAlertPress}
            showUserLocation={locationPermission}
          />
        </View>

        <View style={styles.emergencyBanner}>
          <Phone size={24} color="#FFFFFF" />
          <Text style={styles.emergencyText}>En cas d'urgence grave, composez le 122</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <TouchableOpacity 
                  key={action.id} 
                  style={[styles.quickActionCard, { borderLeftColor: action.color }]}
                  onPress={() => handleQuickAction(action.action)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                    <IconComponent size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.quickActionInfo}>
                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                    <Text style={styles.quickActionDesc}>{action.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacts d'Urgence</Text>
          {emergencyContacts.map((contact) => {
            const IconComponent = contact.icon;
            return (
              <TouchableOpacity 
                key={contact.id} 
                style={styles.contactCard}
                onPress={() => handleEmergencyCall(contact.number)}
              >
                <View style={[styles.contactIcon, { backgroundColor: contact.color }]}>
                  <IconComponent size={24} color="#FFFFFF" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactNumber}>{contact.number}</Text>
                </View>
                <Phone size={20} color="#6B7280" />
              </TouchableOpacity>
            );
          })}
        </View>

        {location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ma Position Actuelle</Text>
            <View style={styles.locationCard}>
              <MapPin size={20} color="#16A34A" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationCoords}>
                  {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationDesc}>Position GPS exacte</Text>
              </View>
              <TouchableOpacity 
                style={styles.shareLocationButton}
                onPress={shareLocation}
              >
                <Navigation size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques des Alertes</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{activeAlerts.length}</Text>
              <Text style={styles.statLabel}>Alertes Actives</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#DC2626' }]} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {alerts.filter(a => a.type === 'resolved').length}
              </Text>
              <Text style={styles.statLabel}>Résolues Aujourd'hui</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#16A34A' }]} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {alerts.filter(a => a.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </Text>
              <Text style={styles.statLabel}>Cette Semaine</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#3B82F6' }]} />
            </View>
          </View>
        </View>

        <View style={styles.tipSection}>
          <AlertTriangle size={24} color="#F59E0B" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Conseils de Sécurité</Text>
            <Text style={styles.tipText}>
              • Gardez votre téléphone chargé en permanence{'\n'}
              • Informez toujours quelqu'un de vos déplacements{'\n'}
              • Enregistrez les numéros d'urgence locaux{'\n'}
              • Maintenez vos informations médicales à jour{'\n'}
              • Vérifiez régulièrement les alertes de votre région
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#111827',
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  mapSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  emergencyBanner: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    marginVertical: 16,
  },
  emergencyText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickActionInfo: {
    flex: 1,
  },
  quickActionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  quickActionDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  contactNumber: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationCoords: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  locationDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  shareLocationButton: {
    backgroundColor: '#16A34A',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  tipSection: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#92400E',
    marginBottom: 8,
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});