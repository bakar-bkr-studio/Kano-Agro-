import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { useAuth } from './useAuth';

export interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    pressure: number;
    visibility: number;
    uvIndex: number;
    condition: string;
    icon: string;
    feelsLike: number;
  };
  forecast: Array<{
    date: string;
    day: string;
    tempMax: number;
    tempMin: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    precipitationChance: number;
    precipitationAmount: number;
  }>;
  alerts: Array<{
    id: string;
    type: 'drought' | 'flood' | 'storm' | 'heat' | 'cold' | 'wind' | 'frost';
    severity: 'low' | 'medium' | 'high' | 'extreme';
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    actionable: boolean;
  }>;
  location: {
    name: string;
    region: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  lastUpdated: string;
  source: string;
}

export interface AgriculturalAdvice {
  id: string;
  type: 'irrigation' | 'protection' | 'planting' | 'harvesting' | 'treatment' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  action: string;
  timeframe: string;
  crops?: string[];
  weatherCondition: string;
  icon: string;
}

export interface WeatherHistory {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  humidity: number;
}

export function useWeather() {
  const { user, profile } = useAuth();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [agriculturalAdvice, setAgriculturalAdvice] = useState<AgriculturalAdvice[]>([]);
  const [weatherHistory, setWeatherHistory] = useState<WeatherHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [offlineData, setOfflineData] = useState<WeatherData | null>(null);

  useEffect(() => {
    initializeWeather();
    // Load offline data
    loadOfflineData();
  }, [profile]);

  const initializeWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user location
      const location = await getUserLocation();
      if (location) {
        setUserLocation(location);
        await fetchWeatherData(location.coords.latitude, location.coords.longitude);
      }
    } catch (err) {
      console.error('Error initializing weather:', err);
      setError('Impossible de charger les données météo');
      // Try to use offline data
      if (offlineData) {
        setWeatherData(offlineData);
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async (): Promise<Location.LocationObject | null> => {
    try {
      // First try to use profile location if available
      if (profile?.etat) {
        const coordinates = await getCoordinatesFromState(profile.etat);
        if (coordinates) {
          return {
            coords: coordinates,
            timestamp: Date.now(),
          } as Location.LocationObject;
        }
      }

      // Fallback to GPS location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        return await Location.getCurrentPositionAsync({});
      }

      // Default to Kano if no location available
      return {
        coords: {
          latitude: 12.0022,
          longitude: 8.5920,
          altitude: null,
          accuracy: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const getCoordinatesFromState = async (stateName: string) => {
    // Mapping of Nigerian states to coordinates
    const stateCoordinates: Record<string, { latitude: number; longitude: number }> = {
      'Kano': { latitude: 12.0022, longitude: 8.5920 },
      'Lagos': { latitude: 6.5244, longitude: 3.3792 },
      'Kaduna': { latitude: 10.5105, longitude: 7.4165 },
      'Rivers': { latitude: 4.8156, longitude: 7.0498 },
      'Oyo': { latitude: 8.0000, longitude: 4.0000 },
      'Katsina': { latitude: 12.9908, longitude: 7.6018 },
      'Bauchi': { latitude: 10.3158, longitude: 9.8442 },
      'Jigawa': { latitude: 12.2300, longitude: 9.5500 },
      'Benue': { latitude: 7.3300, longitude: 8.7500 },
      'Anambra': { latitude: 6.2100, longitude: 6.9900 },
      // Add more states as needed
    };

    return stateCoordinates[stateName] || null;
  };

  const fetchWeatherData = async (latitude: number, longitude: number) => {
    try {
      // In a real app, you would call a weather API like OpenWeatherMap
      // For now, we'll simulate weather data
      const mockWeatherData = generateMockWeatherData(latitude, longitude);
      
      setWeatherData(mockWeatherData);
      
      // Generate agricultural advice based on weather and user profile
      const advice = generateAgriculturalAdvice(mockWeatherData, profile);
      setAgriculturalAdvice(advice);
      
      // Generate weather history
      const history = generateWeatherHistory();
      setWeatherHistory(history);
      
      // Save to offline storage
      saveOfflineData(mockWeatherData);
      
    } catch (err) {
      console.error('Error fetching weather data:', err);
      throw err;
    }
  };

  const generateMockWeatherData = (lat: number, lon: number): WeatherData => {
    const now = new Date();
    const isRainySeason = now.getMonth() >= 4 && now.getMonth() <= 9; // May to October
    const isDrySeason = !isRainySeason;
    
    // Base temperature varies by location (northern Nigeria is hotter)
    const baseTemp = lat > 10 ? 32 : 28; // Northern states are generally hotter
    const tempVariation = Math.random() * 8 - 4; // ±4°C variation
    const currentTemp = Math.round(baseTemp + tempVariation);
    
    const conditions = isRainySeason 
      ? ['Partly Cloudy', 'Cloudy', 'Light Rain', 'Thunderstorm', 'Overcast']
      : ['Sunny', 'Clear', 'Partly Cloudy', 'Hazy', 'Hot'];
    
    const currentCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    // Generate alerts based on season and conditions
    const alerts = generateWeatherAlerts(currentTemp, currentCondition, isRainySeason);
    
    return {
      current: {
        temperature: currentTemp,
        humidity: isRainySeason ? 70 + Math.random() * 20 : 30 + Math.random() * 30,
        windSpeed: 5 + Math.random() * 15,
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        pressure: 1010 + Math.random() * 20,
        visibility: 8 + Math.random() * 7,
        uvIndex: isDrySeason ? 8 + Math.random() * 3 : 4 + Math.random() * 4,
        condition: currentCondition,
        icon: getWeatherIcon(currentCondition),
        feelsLike: currentTemp + (Math.random() * 6 - 3),
      },
      forecast: generateForecast(currentTemp, isRainySeason),
      alerts,
      location: {
        name: profile?.lga || 'Kano',
        region: profile?.etat || 'Kano',
        country: 'Nigeria',
        coordinates: { latitude: lat, longitude: lon },
      },
      lastUpdated: new Date().toISOString(),
      source: 'NiMet (Nigerian Meteorological Agency)',
    };
  };

  const generateForecast = (baseTemp: number, isRainySeason: boolean) => {
    const forecast = [];
    const days = ['Aujourd\'hui', 'Demain', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const tempVariation = Math.random() * 6 - 3;
      const tempMax = Math.round(baseTemp + tempVariation + 2);
      const tempMin = Math.round(baseTemp + tempVariation - 5);
      
      const conditions = isRainySeason 
        ? ['Partly Cloudy', 'Cloudy', 'Light Rain', 'Thunderstorm', 'Overcast']
        : ['Sunny', 'Clear', 'Partly Cloudy', 'Hazy'];
      
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        day: i < days.length ? days[i] : date.toLocaleDateString('fr-FR', { weekday: 'long' }),
        tempMax,
        tempMin,
        condition,
        icon: getWeatherIcon(condition),
        humidity: isRainySeason ? 60 + Math.random() * 30 : 25 + Math.random() * 35,
        windSpeed: 3 + Math.random() * 12,
        precipitationChance: isRainySeason ? Math.random() * 80 : Math.random() * 20,
        precipitationAmount: isRainySeason ? Math.random() * 15 : 0,
      });
    }
    
    return forecast;
  };

  const generateWeatherAlerts = (temp: number, condition: string, isRainySeason: boolean) => {
    const alerts = [];
    
    // Heat wave alert
    if (temp > 38) {
      alerts.push({
        id: 'heat-wave',
        type: 'heat' as const,
        severity: temp > 42 ? 'extreme' as const : 'high' as const,
        title: 'Alerte Canicule',
        description: `Températures extrêmes prévues (${temp}°C). Risque de stress hydrique pour les cultures.`,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        actionable: true,
      });
    }
    
    // Drought alert during dry season
    if (!isRainySeason && temp > 35) {
      alerts.push({
        id: 'drought-risk',
        type: 'drought' as const,
        severity: 'medium' as const,
        title: 'Risque de Sécheresse',
        description: 'Conditions sèches prolongées. Planifiez l\'irrigation de vos cultures.',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        actionable: true,
      });
    }
    
    // Storm alert
    if (condition.includes('Thunderstorm')) {
      alerts.push({
        id: 'storm-warning',
        type: 'storm' as const,
        severity: 'high' as const,
        title: 'Alerte Orage',
        description: 'Orages violents prévus. Protégez vos cultures et équipements.',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        actionable: true,
      });
    }
    
    // Harmattan alert (dry dusty wind)
    if (!isRainySeason && Math.random() > 0.7) {
      alerts.push({
        id: 'harmattan',
        type: 'wind' as const,
        severity: 'medium' as const,
        title: 'Harmattan en Cours',
        description: 'Vents secs et poussiéreux. Protégez vos jeunes plants et augmentez l\'arrosage.',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        actionable: true,
      });
    }
    
    return alerts;
  };

  const generateAgriculturalAdvice = (weather: WeatherData, userProfile: any): AgriculturalAdvice[] => {
    const advice = [];
    const userCrops = userProfile?.cultures_pratiquees || [];
    const currentTemp = weather.current.temperature;
    const humidity = weather.current.humidity;
    const condition = weather.current.condition;
    
    // Temperature-based advice
    if (currentTemp > 35) {
      advice.push({
        id: 'high-temp-irrigation',
        type: 'irrigation',
        priority: 'high',
        title: 'Irrigation Intensive Recommandée',
        description: 'Les températures élevées augmentent l\'évapotranspiration.',
        action: 'Arrosez vos cultures entre 5h et 7h du matin, puis entre 18h et 20h.',
        timeframe: 'Immédiat',
        crops: userCrops.length > 0 ? userCrops : ['Tomate', 'Maïs', 'Riz'],
        weatherCondition: 'Forte chaleur',
        icon: 'Droplets',
      });
    }
    
    // Humidity-based advice
    if (humidity > 80) {
      advice.push({
        id: 'high-humidity-disease',
        type: 'treatment',
        priority: 'medium',
        title: 'Surveillance des Maladies',
        description: 'L\'humidité élevée favorise le développement de champignons.',
        action: 'Inspectez vos cultures et appliquez un fongicide préventif si nécessaire.',
        timeframe: '24-48 heures',
        crops: ['Tomate', 'Riz', 'Légumes'],
        weatherCondition: 'Humidité élevée',
        icon: 'Shield',
      });
    }
    
    // Wind-based advice
    if (weather.current.windSpeed > 20) {
      advice.push({
        id: 'wind-protection',
        type: 'protection',
        priority: 'medium',
        title: 'Protection Contre le Vent',
        description: 'Vents forts prévus pouvant endommager les cultures.',
        action: 'Installez des brise-vents ou tuteurez vos plants hauts (tomates, haricots).',
        timeframe: 'Avant ce soir',
        crops: ['Tomate', 'Haricot', 'Maïs'],
        weatherCondition: 'Vents forts',
        icon: 'Shield',
      });
    }
    
    // Seasonal advice
    const month = new Date().getMonth();
    if (month >= 4 && month <= 6) { // May to July - planting season
      advice.push({
        id: 'planting-season',
        type: 'planting',
        priority: 'high',
        title: 'Période de Semis Optimale',
        description: 'C\'est la période idéale pour semer vos cultures de saison des pluies.',
        action: 'Préparez vos champs et semez le maïs, le riz, et les légumineuses.',
        timeframe: 'Ce mois-ci',
        crops: ['Maïs', 'Riz', 'Haricot', 'Arachide'],
        weatherCondition: 'Début de saison des pluies',
        icon: 'Sprout',
      });
    }
    
    if (month >= 10 && month <= 12) { // October to December - harvest season
      advice.push({
        id: 'harvest-season',
        type: 'harvesting',
        priority: 'high',
        title: 'Période de Récolte',
        description: 'C\'est le moment de récolter vos cultures de saison des pluies.',
        action: 'Récoltez par temps sec pour éviter la détérioration des grains.',
        timeframe: 'Prochaines semaines',
        crops: ['Maïs', 'Riz', 'Sorgho', 'Mil'],
        weatherCondition: 'Saison sèche',
        icon: 'Package',
      });
    }
    
    // Crop-specific advice
    if (userCrops.includes('Riz') && humidity < 60) {
      advice.push({
        id: 'rice-water-management',
        type: 'irrigation',
        priority: 'high',
        title: 'Gestion de l\'Eau pour le Riz',
        description: 'Le riz nécessite un niveau d\'eau constant.',
        action: 'Maintenez 5-10 cm d\'eau dans vos rizières.',
        timeframe: 'Quotidien',
        crops: ['Riz'],
        weatherCondition: 'Faible humidité',
        icon: 'Droplets',
      });
    }
    
    return advice;
  };

  const generateWeatherHistory = (): WeatherHistory[] => {
    const history = [];
    for (let i = 7; i >= 1; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      history.push({
        date: date.toISOString().split('T')[0],
        tempMax: 28 + Math.random() * 12,
        tempMin: 18 + Math.random() * 8,
        precipitation: Math.random() * 10,
        humidity: 40 + Math.random() * 40,
      });
    }
    return history;
  };

  const getWeatherIcon = (condition: string): string => {
    const iconMap: Record<string, string> = {
      'Sunny': 'Sun',
      'Clear': 'Sun',
      'Partly Cloudy': 'CloudSun',
      'Cloudy': 'Cloud',
      'Overcast': 'Cloud',
      'Light Rain': 'CloudRain',
      'Rain': 'CloudRain',
      'Heavy Rain': 'CloudRain',
      'Thunderstorm': 'Zap',
      'Hazy': 'Haze',
      'Hot': 'Thermometer',
    };
    
    return iconMap[condition] || 'Cloud';
  };

  const saveOfflineData = (data: WeatherData) => {
    // In a real app, you would save to AsyncStorage or similar
    setOfflineData(data);
  };

  const loadOfflineData = () => {
    // In a real app, you would load from AsyncStorage
    // For now, we'll just keep the state
  };

  const refreshWeather = async () => {
    if (userLocation) {
      await fetchWeatherData(userLocation.coords.latitude, userLocation.coords.longitude);
    } else {
      await initializeWeather();
    }
  };

  return {
    weatherData,
    agriculturalAdvice,
    weatherHistory,
    loading,
    error,
    userLocation,
    refreshWeather,
    isOffline: !weatherData && !!offlineData,
  };
}