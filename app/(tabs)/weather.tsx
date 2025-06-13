import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Wind, 
  Droplets, 
  Thermometer, 
  TriangleAlert as AlertTriangle, 
  Bell, 
  MapPin, 
  RefreshCw, 
  Eye, 
  Gauge, 
  Zap,
  CloudSun,
  Haze,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Wifi,
  WifiOff,
  Store,
  Camera,
  Sprout,
  Package,
  Shield,
  Navigation
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWeather } from '@/hooks/useWeather';
import { useAuth } from '@/hooks/useAuth';
import WeatherAlertModal from '@/components/WeatherAlertModal';

const { width: screenWidth } = Dimensions.get('window');

const getWeatherIcon = (iconName: string, size: number = 24, color: string = '#FFFFFF') => {
  const icons: Record<string, any> = {
    Sun,
    Cloud,
    CloudRain,
    CloudSun,
    Zap,
    Haze,
    Thermometer,
  };
  
  const IconComponent = icons[iconName] || Cloud;
  return <IconComponent size={size} color={color} />;
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'low': return '#10B981';
    case 'medium': return '#F59E0B';
    case 'high': return '#EF4444';
    case 'extreme': return '#DC2626';
    default: return '#6B7280';
  }
};

const getAdviceIcon = (type: string) => {
  const icons: Record<string, any> = {
    irrigation: Droplets,
    protection: Shield,
    planting: Sprout,
    harvesting: Package,
    treatment: Zap,
    general: Bell,
  };
  
  return icons[type] || Bell;
};

export default function WeatherScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { 
    weatherData, 
    agriculturalAdvice, 
    weatherHistory, 
    loading, 
    error, 
    refreshWeather, 
    isOffline 
  } = useWeather();
  
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshWeather();
    setRefreshing(false);
  };

  const handleAlertConfig = (preferences: any[]) => {
    // In a real app, save preferences to backend
    Alert.alert('Succès', 'Vos préférences d\'alertes ont été enregistrées.');
  };

  const getLocationName = () => {
    if (weatherData?.location) {
      return `${weatherData.location.name}, ${weatherData.location.region}`;
    }
    return profile?.etat ? `${profile.etat}, Nigeria` : 'Kano, Nigeria';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 17) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !weatherData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Chargement des données météo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !weatherData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <WifiOff size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>Erreur de connexion</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshWeather}>
            <RefreshCw size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3B82F6', '#2563EB', '#1D4ED8']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.locationContainer}>
            <MapPin size={16} color="#FFFFFF" />
            <Text style={styles.location}>{getLocationName()}</Text>
            {isOffline && <WifiOff size={14} color="#FFFFFF" />}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowAlertModal(true)}
            >
              <Bell size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw 
                size={20} 
                color="#FFFFFF" 
                style={refreshing ? { transform: [{ rotate: '180deg' }] } : {}}
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.greeting}>{getGreeting()}</Text>
        
        {weatherData && (
          <View style={styles.currentWeather}>
            {getWeatherIcon(weatherData.current.icon, 64)}
            <Text style={styles.currentTemp}>{Math.round(weatherData.current.temperature)}°C</Text>
            <Text style={styles.weatherDesc}>{weatherData.current.condition}</Text>
            <Text style={styles.feelsLike}>
              Ressenti {Math.round(weatherData.current.feelsLike)}°C
            </Text>
          </View>
        )}

        {weatherData?.lastUpdated && (
          <View style={styles.updateInfo}>
            <Clock size={12} color="#FFFFFF" />
            <Text style={styles.updateText}>
              Mis à jour à {formatTime(weatherData.lastUpdated)} • {weatherData.source}
            </Text>
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
        {/* Weather Alerts */}
        {weatherData?.alerts && weatherData.alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alertes Météo</Text>
            {weatherData.alerts.map((alert) => (
              <View 
                key={alert.id} 
                style={[
                  styles.alertCard,
                  { borderLeftColor: getSeverityColor(alert.severity) }
                ]}
              >
                <View style={styles.alertHeader}>
                  <AlertTriangle size={20} color={getSeverityColor(alert.severity)} />
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <View style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(alert.severity) }
                  ]}>
                    <Text style={styles.severityText}>
                      {alert.severity === 'low' ? 'Faible' :
                       alert.severity === 'medium' ? 'Modéré' :
                       alert.severity === 'high' ? 'Élevé' : 'Extrême'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.alertText}>{alert.description}</Text>
                {alert.actionable && (
                  <TouchableOpacity 
                    style={styles.alertButton}
                    onPress={() => setShowAlertModal(true)}
                  >
                    <Bell size={16} color="#FFFFFF" />
                    <Text style={styles.alertButtonText}>Configurer Alertes</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Current Conditions */}
        {weatherData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conditions Actuelles</Text>
            <View style={styles.conditionsGrid}>
              <View style={styles.conditionCard}>
                <Thermometer size={24} color="#DC2626" />
                <Text style={styles.conditionValue}>
                  {Math.round(weatherData.current.temperature)}°C
                </Text>
                <Text style={styles.conditionLabel}>Température</Text>
              </View>
              <View style={styles.conditionCard}>
                <Droplets size={24} color="#3B82F6" />
                <Text style={styles.conditionValue}>
                  {Math.round(weatherData.current.humidity)}%
                </Text>
                <Text style={styles.conditionLabel}>Humidité</Text>
              </View>
              <View style={styles.conditionCard}>
                <Wind size={24} color="#6B7280" />
                <Text style={styles.conditionValue}>
                  {Math.round(weatherData.current.windSpeed)} km/h
                </Text>
                <Text style={styles.conditionLabel}>Vent {weatherData.current.windDirection}</Text>
              </View>
              <View style={styles.conditionCard}>
                <Eye size={24} color="#059669" />
                <Text style={styles.conditionValue}>
                  {Math.round(weatherData.current.visibility)} km
                </Text>
                <Text style={styles.conditionLabel}>Visibilité</Text>
              </View>
              <View style={styles.conditionCard}>
                <Gauge size={24} color="#8B5CF6" />
                <Text style={styles.conditionValue}>
                  {Math.round(weatherData.current.pressure)} hPa
                </Text>
                <Text style={styles.conditionLabel}>Pression</Text>
              </View>
              <View style={styles.conditionCard}>
                <Sun size={24} color="#F59E0B" />
                <Text style={styles.conditionValue}>
                  {weatherData.current.uvIndex}
                </Text>
                <Text style={styles.conditionLabel}>Index UV</Text>
              </View>
            </View>
          </View>
        )}

        {/* Agricultural Advice */}
        {agriculturalAdvice.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conseils Agricoles Personnalisés</Text>
            {agriculturalAdvice.map((advice) => {
              const IconComponent = getAdviceIcon(advice.type);
              const priorityColor = 
                advice.priority === 'urgent' ? '#DC2626' :
                advice.priority === 'high' ? '#EF4444' :
                advice.priority === 'medium' ? '#F59E0B' : '#10B981';
              
              return (
                <View key={advice.id} style={styles.adviceCard}>
                  <View style={styles.adviceHeader}>
                    <View style={[styles.adviceIcon, { backgroundColor: priorityColor }]}>
                      <IconComponent size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.adviceInfo}>
                      <Text style={styles.adviceTitle}>{advice.title}</Text>
                      <Text style={styles.adviceTimeframe}>
                        {advice.timeframe} • {advice.weatherCondition}
                      </Text>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
                      <Text style={styles.priorityText}>
                        {advice.priority === 'urgent' ? 'Urgent' :
                         advice.priority === 'high' ? 'Important' :
                         advice.priority === 'medium' ? 'Modéré' : 'Info'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.adviceDescription}>{advice.description}</Text>
                  <Text style={styles.adviceAction}>
                    <Text style={styles.actionLabel}>Action recommandée: </Text>
                    {advice.action}
                  </Text>
                  {advice.crops && advice.crops.length > 0 && (
                    <View style={styles.cropsContainer}>
                      <Text style={styles.cropsLabel}>Cultures concernées: </Text>
                      <Text style={styles.cropsText}>{advice.crops.join(', ')}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 7-Day Forecast */}
        {weatherData?.forecast && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prévisions 7 Jours</Text>
            {weatherData.forecast.map((item, index) => (
              <View key={index} style={styles.forecastCard}>
                <Text style={styles.forecastDay}>{item.day}</Text>
                <View style={styles.forecastIcon}>
                  {getWeatherIcon(item.icon, 24, '#374151')}
                </View>
                <View style={styles.forecastTemps}>
                  <View style={styles.tempContainer}>
                    <TrendingUp size={12} color="#DC2626" />
                    <Text style={styles.tempMax}>{Math.round(item.tempMax)}°</Text>
                  </View>
                  <View style={styles.tempContainer}>
                    <TrendingDown size={12} color="#3B82F6" />
                    <Text style={styles.tempMin}>{Math.round(item.tempMin)}°</Text>
                  </View>
                </View>
                <View style={styles.forecastDetails}>
                  <Text style={styles.forecastDetail}>
                    💧 {Math.round(item.precipitationChance)}%
                  </Text>
                  <Text style={styles.forecastDetail}>
                    💨 {Math.round(item.windSpeed)} km/h
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Weather History */}
        {weatherHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Historique (7 derniers jours)</Text>
              <TouchableOpacity 
                style={styles.toggleButton}
                onPress={() => setShowHistory(!showHistory)}
              >
                <Text style={styles.toggleButtonText}>
                  {showHistory ? 'Masquer' : 'Afficher'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {showHistory && (
              <View style={styles.historyContainer}>
                {weatherHistory.map((day, index) => (
                  <View key={index} style={styles.historyCard}>
                    <Text style={styles.historyDate}>
                      {new Date(day.date).toLocaleDateString('fr-FR', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </Text>
                    <View style={styles.historyTemps}>
                      <Text style={styles.historyTempMax}>{Math.round(day.tempMax)}°</Text>
                      <Text style={styles.historyTempMin}>{Math.round(day.tempMin)}°</Text>
                    </View>
                    <Text style={styles.historyPrecip}>
                      {day.precipitation > 0 ? `${day.precipitation.toFixed(1)}mm` : '0mm'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/marketplace')}
            >
              <Store size={24} color="#16A34A" />
              <Text style={styles.actionTitle}>Vendre Produits</Text>
              <Text style={styles.actionDesc}>Profitez du beau temps</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/diagnosis')}
            >
              <Camera size={24} color="#3B82F6" />
              <Text style={styles.actionTitle}>Diagnostic</Text>
              <Text style={styles.actionDesc}>Vérifiez vos cultures</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seasonal Advice */}
        <View style={styles.seasonalCard}>
          <Calendar size={24} color="#8B5CF6" />
          <View style={styles.seasonalContent}>
            <Text style={styles.seasonalTitle}>Conseil de Saison</Text>
            <Text style={styles.seasonalText}>
              {new Date().getMonth() >= 10 || new Date().getMonth() <= 2 
                ? "Saison sèche : Période idéale pour la récolte et le séchage. Préparez vos greniers et surveillez l'irrigation."
                : "Saison des pluies : Surveillez vos cultures contre les maladies fongiques. C'est le moment de semer les cultures pluviales."
              }
            </Text>
          </View>
        </View>
      </ScrollView>

      <WeatherAlertModal
        visible={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        onSave={handleAlertConfig}
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  location: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
  },
  currentWeather: {
    alignItems: 'center',
    marginBottom: 16,
  },
  currentTemp: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: '#FFFFFF',
    marginVertical: 8,
  },
  weatherDesc: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  feelsLike: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  updateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
    marginBottom: 16,
  },
  toggleButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  toggleButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  alertText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  alertButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  alertButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  conditionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: (screenWidth - 60) / 3,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conditionValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  conditionLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  adviceCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  adviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  adviceInfo: {
    flex: 1,
  },
  adviceTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  adviceTimeframe: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  adviceDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  adviceAction: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
    lineHeight: 20,
  },
  actionLabel: {
    fontFamily: 'Inter-SemiBold',
    color: '#16A34A',
  },
  cropsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  cropsLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#6B7280',
  },
  cropsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#16A34A',
  },
  forecastCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  forecastDay: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#111827',
    width: 80,
  },
  forecastIcon: {
    marginHorizontal: 12,
  },
  forecastTemps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    gap: 8,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempMax: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 2,
  },
  tempMin: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 2,
  },
  forecastDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  forecastDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#6B7280',
  },
  historyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    width: 60,
  },
  historyTemps: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  historyTempMax: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#DC2626',
  },
  historyTempMin: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#3B82F6',
  },
  historyPrecip: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#3B82F6',
    width: 40,
    textAlign: 'right',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  actionDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  seasonalCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seasonalContent: {
    flex: 1,
    marginLeft: 12,
  },
  seasonalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
  },
  seasonalText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});