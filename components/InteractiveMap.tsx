import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, MapPin, Filter, X, Calendar, User, Phone } from 'lucide-react-native';

interface Alert {
  id: string;
  type: 'active' | 'resolved' | 'historical';
  category: 'medical' | 'security' | 'agricultural' | 'fire' | 'other';
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  timestamp: Date;
  reporter: string;
  contact?: string;
  status: string;
}

interface InteractiveMapProps {
  alerts: Alert[];
  onAlertPress?: (alert: Alert) => void;
  showUserLocation?: boolean;
}

const ALERT_COLORS = {
  active: '#DC2626',
  resolved: '#F59E0B',
  historical: '#6B7280'
};

const CATEGORY_ICONS = {
  medical: '🏥',
  security: '🚔',
  agricultural: '🌾',
  fire: '🔥',
  other: '⚠️'
};

export default function InteractiveMap({ 
  alerts, 
  onAlertPress, 
  showUserLocation = true 
}: InteractiveMapProps) {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    types: ['active', 'resolved', 'historical'],
    categories: ['medical', 'security', 'agricultural', 'fire', 'other'],
    dateRange: 'all' // 'today', 'week', 'month', 'all'
  });
  const mapRef = useRef<MapView>(null);

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

  const filteredAlerts = alerts.filter(alert => {
    // Filter by type
    if (!filters.types.includes(alert.type)) return false;
    
    // Filter by category
    if (!filters.categories.includes(alert.category)) return false;
    
    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const alertDate = new Date(alert.timestamp);
      const diffTime = Math.abs(now.getTime() - alertDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (filters.dateRange) {
        case 'today':
          if (diffDays > 1) return false;
          break;
        case 'week':
          if (diffDays > 7) return false;
          break;
        case 'month':
          if (diffDays > 30) return false;
          break;
      }
    }
    
    return true;
  });

  const getMarkerColor = (type: string) => ALERT_COLORS[type as keyof typeof ALERT_COLORS];

  const handleMarkerPress = (alert: Alert) => {
    setSelectedAlert(alert);
    onAlertPress?.(alert);
  };

  const centerOnAlerts = () => {
    if (filteredAlerts.length > 0 && mapRef.current) {
      const coordinates = filteredAlerts.map(alert => ({
        latitude: alert.location.latitude,
        longitude: alert.location.longitude,
      }));
      
      if (userLocation) {
        coordinates.push({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        });
      }
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const toggleFilter = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType as keyof typeof prev].includes(value)
        ? (prev[filterType as keyof typeof prev] as string[]).filter(item => item !== value)
        : [...(prev[filterType as keyof typeof prev] as string[]), value]
    }));
  };

  const getInitialRegion = () => {
    if (userLocation) {
      return {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }
    
    // Default to Kano, Nigeria
    return {
      latitude: 12.0022,
      longitude: 8.5920,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapHeader}>
        <View style={styles.mapTitle}>
          <Text style={styles.mapTitleText}>Alertes en Temps Réel</Text>
          <Text style={styles.alertCount}>{filteredAlerts.length} alertes</Text>
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={getInitialRegion()}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={true}
        toolbarEnabled={false}
      >
        {filteredAlerts.map((alert) => (
          <Marker
            key={alert.id}
            coordinate={{
              latitude: alert.location.latitude,
              longitude: alert.location.longitude,
            }}
            onPress={() => handleMarkerPress(alert)}
            pinColor={getMarkerColor(alert.type)}
          >
            <View style={[styles.customMarker, { backgroundColor: getMarkerColor(alert.type) }]}>
              <Text style={styles.markerIcon}>{CATEGORY_ICONS[alert.category]}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.mapLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ALERT_COLORS.active }]} />
          <Text style={styles.legendText}>Alertes actives</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ALERT_COLORS.resolved }]} />
          <Text style={styles.legendText}>Résolues</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ALERT_COLORS.historical }]} />
          <Text style={styles.legendText}>Historique</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.centerButton} onPress={centerOnAlerts}>
        <MapPin size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Alert Detail Modal */}
      <Modal
        visible={!!selectedAlert}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAlert(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAlert && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.alertTypeIndicator}>
                    <View style={[
                      styles.alertTypeDot, 
                      { backgroundColor: getMarkerColor(selectedAlert.type) }
                    ]} />
                    <Text style={styles.alertTypeText}>
                      {selectedAlert.type === 'active' ? 'Alerte Active' :
                       selectedAlert.type === 'resolved' ? 'Résolue' : 'Historique'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedAlert(null)}>
                    <X size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <Text style={styles.alertTitle}>{selectedAlert.title}</Text>
                  <Text style={styles.alertDescription}>{selectedAlert.description}</Text>

                  <View style={styles.alertDetails}>
                    <View style={styles.detailRow}>
                      <MapPin size={16} color="#6B7280" />
                      <Text style={styles.detailText}>{selectedAlert.location.address}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Calendar size={16} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {selectedAlert.timestamp.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <User size={16} color="#6B7280" />
                      <Text style={styles.detailText}>{selectedAlert.reporter}</Text>
                    </View>
                    {selectedAlert.contact && (
                      <View style={styles.detailRow}>
                        <Phone size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{selectedAlert.contact}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>Statut:</Text>
                    <Text style={[
                      styles.statusText,
                      { color: getMarkerColor(selectedAlert.type) }
                    ]}>
                      {selectedAlert.status}
                    </Text>
                  </View>
                </ScrollView>

                {selectedAlert.type === 'active' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Phone size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Contacter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
                      <MapPin size={16} color="#DC2626" />
                      <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                        Directions
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filtres</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Type d'alerte</Text>
                {['active', 'resolved', 'historical'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={styles.filterOption}
                    onPress={() => toggleFilter('types', type)}
                  >
                    <View style={[
                      styles.checkbox,
                      filters.types.includes(type) && styles.checkboxActive
                    ]}>
                      {filters.types.includes(type) && (
                        <CheckCircle size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={styles.filterOptionText}>
                      {type === 'active' ? 'Alertes actives' :
                       type === 'resolved' ? 'Alertes résolues' : 'Historique'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Catégorie</Text>
                {['medical', 'security', 'agricultural', 'fire', 'other'].map(category => (
                  <TouchableOpacity
                    key={category}
                    style={styles.filterOption}
                    onPress={() => toggleFilter('categories', category)}
                  >
                    <View style={[
                      styles.checkbox,
                      filters.categories.includes(category) && styles.checkboxActive
                    ]}>
                      {filters.categories.includes(category) && (
                        <CheckCircle size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={styles.filterOptionText}>
                      {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]} {' '}
                      {category === 'medical' ? 'Médical' :
                       category === 'security' ? 'Sécurité' :
                       category === 'agricultural' ? 'Agricole' :
                       category === 'fire' ? 'Incendie' : 'Autre'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Période</Text>
                {['today', 'week', 'month', 'all'].map(range => (
                  <TouchableOpacity
                    key={range}
                    style={styles.filterOption}
                    onPress={() => setFilters(prev => ({ ...prev, dateRange: range }))}
                  >
                    <View style={[
                      styles.radioButton,
                      filters.dateRange === range && styles.radioButtonActive
                    ]}>
                      {filters.dateRange === range && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={styles.filterOptionText}>
                      {range === 'today' ? 'Aujourd\'hui' :
                       range === 'week' ? 'Cette semaine' :
                       range === 'month' ? 'Ce mois' : 'Toutes'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersText}>Appliquer les filtres</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mapTitle: {
    flex: 1,
  },
  mapTitleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
  },
  alertCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  filterButton: {
    backgroundColor: '#DC2626',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerIcon: {
    fontSize: 16,
  },
  mapLegend: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#374151',
  },
  centerButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: '#3B82F6',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  alertTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTypeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  alertTypeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  alertTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#111827',
    marginBottom: 8,
  },
  alertDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  alertDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  statusLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  actionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  secondaryButtonText: {
    color: '#DC2626',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
  },
  filterContent: {
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
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonActive: {
    borderColor: '#16A34A',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  filterOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  applyFiltersButton: {
    backgroundColor: '#16A34A',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});