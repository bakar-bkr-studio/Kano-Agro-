import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MapPin, Filter, X, CircleCheck as CheckCircle } from 'lucide-react-native';

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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    types: ['active', 'resolved', 'historical'],
    categories: ['medical', 'security', 'agricultural', 'fire', 'other'],
    dateRange: 'all' // 'today', 'week', 'month', 'all'
  });

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

  const toggleFilter = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType as keyof typeof prev].includes(value)
        ? (prev[filterType as keyof typeof prev] as string[]).filter(item => item !== value)
        : [...(prev[filterType as keyof typeof prev] as string[]), value]
    }));
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

      <View style={styles.webMapContainer}>
        <View style={styles.webMapPlaceholder}>
          <MapPin size={48} color="#6B7280" />
          <Text style={styles.webMapText}>
            Carte interactive disponible sur mobile
          </Text>
          <Text style={styles.webMapSubtext}>
            {filteredAlerts.length} alertes dans votre région
          </Text>
        </View>
      </View>

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
  webMapContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  webMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  webMapText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  webMapSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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