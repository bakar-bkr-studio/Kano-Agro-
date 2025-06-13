import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { X, TriangleAlert as AlertTriangle, Shield, Leaf, Zap, Clock, CircleCheck as CheckCircle, Info } from 'lucide-react-native';
import { DiagnosisResult } from '@/hooks/useDiagnosisHistory';

interface DiseaseInfoModalProps {
  visible: boolean;
  onClose: () => void;
  diagnosis: DiagnosisResult | null;
}

const diseaseDatabase: Record<string, {
  description: string;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  severity: 'Faible' | 'Modérée' | 'Élevée';
  affectedCrops: string[];
  seasonality: string;
  images: string[];
}> = {
  'Mildiou de la tomate': {
    description: 'Maladie fongique qui affecte principalement les feuilles et les fruits de la tomate, causée par Phytophthora infestans.',
    symptoms: [
      'Taches brunes sur les feuilles',
      'Flétrissement des feuilles',
      'Taches noires sur les fruits',
      'Duvet blanc sous les feuilles',
      'Odeur désagréable'
    ],
    causes: [
      'Humidité élevée (>80%)',
      'Températures fraîches (15-20°C)',
      'Mauvaise circulation d\'air',
      'Arrosage sur les feuilles',
      'Plants trop serrés'
    ],
    treatment: [
      'Appliquer un fongicide à base de cuivre',
      'Retirer les parties infectées',
      'Améliorer la ventilation',
      'Réduire l\'arrosage',
      'Traiter préventivement les plants sains'
    ],
    prevention: [
      'Espacer correctement les plants',
      'Arroser au pied des plants',
      'Éviter l\'arrosage le soir',
      'Utiliser des variétés résistantes',
      'Rotation des cultures'
    ],
    severity: 'Élevée',
    affectedCrops: ['Tomate', 'Pomme de terre', 'Aubergine'],
    seasonality: 'Saison des pluies (Mai-Octobre)',
    images: [
      'https://images.pexels.com/photos/1459375/pexels-photo-1459375.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=400'
    ]
  },
  'Rouille du maïs': {
    description: 'Maladie fongique caractérisée par des pustules orange-rouille sur les feuilles du maïs.',
    symptoms: [
      'Pustules orange sur les feuilles',
      'Jaunissement des feuilles',
      'Réduction de la photosynthèse',
      'Affaiblissement de la plante'
    ],
    causes: [
      'Humidité élevée',
      'Températures modérées (20-25°C)',
      'Vent dispersant les spores',
      'Variétés sensibles'
    ],
    treatment: [
      'Fongicide systémique',
      'Élimination des résidus infectés',
      'Amélioration de la circulation d\'air'
    ],
    prevention: [
      'Variétés résistantes',
      'Rotation des cultures',
      'Éviter l\'irrigation par aspersion',
      'Élimination des résidus de culture'
    ],
    severity: 'Modérée',
    affectedCrops: ['Maïs'],
    seasonality: 'Fin de saison des pluies',
    images: [
      'https://images.pexels.com/photos/2589457/pexels-photo-2589457.jpeg?auto=compress&cs=tinysrgb&w=400'
    ]
  },
  'Flétrissement bactérien': {
    description: 'Maladie bactérienne causant le flétrissement rapide des plants, souvent fatale.',
    symptoms: [
      'Flétrissement soudain',
      'Jaunissement des feuilles',
      'Brunissement des vaisseaux',
      'Mort rapide de la plante'
    ],
    causes: [
      'Bactérie Ralstonia solanacearum',
      'Sol humide et chaud',
      'Blessures sur les racines',
      'Outils contaminés'
    ],
    treatment: [
      'Élimination immédiate des plants infectés',
      'Désinfection des outils',
      'Amélioration du drainage',
      'Traitement antibactérien préventif'
    ],
    prevention: [
      'Rotation des cultures',
      'Désinfection des outils',
      'Éviter les blessures aux racines',
      'Améliorer le drainage du sol'
    ],
    severity: 'Élevée',
    affectedCrops: ['Tomate', 'Pomme de terre', 'Aubergine', 'Piment'],
    seasonality: 'Toute l\'année (plus fréquent en saison chaude)',
    images: [
      'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=400'
    ]
  }
};

export default function DiseaseInfoModal({ visible, onClose, diagnosis }: DiseaseInfoModalProps) {
  if (!diagnosis) return null;

  const diseaseInfo = diseaseDatabase[diagnosis.disease];
  
  if (!diseaseInfo) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Information non disponible</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.content}>
              <Text style={styles.noInfoText}>
                Désolé, nous n'avons pas d'informations détaillées sur cette maladie pour le moment.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Faible': return '#10B981';
      case 'Modérée': return '#F59E0B';
      case 'Élevée': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{diagnosis.disease}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Disease Images */}
            {diseaseInfo.images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                {diseaseInfo.images.map((imageUri, index) => (
                  <Image key={index} source={{ uri: imageUri }} style={styles.diseaseImage} />
                ))}
              </ScrollView>
            )}

            {/* Basic Info */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Info size={20} color="#3B82F6" />
                <Text style={styles.infoTitle}>Description</Text>
              </View>
              <Text style={styles.description}>{diseaseInfo.description}</Text>
              
              <View style={styles.metaInfo}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Sévérité:</Text>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(diseaseInfo.severity) }]}>
                    <Text style={styles.severityText}>{diseaseInfo.severity}</Text>
                  </View>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Saison:</Text>
                  <Text style={styles.metaValue}>{diseaseInfo.seasonality}</Text>
                </View>
              </View>

              <View style={styles.cropsContainer}>
                <Text style={styles.metaLabel}>Cultures affectées:</Text>
                <View style={styles.cropsGrid}>
                  {diseaseInfo.affectedCrops.map((crop, index) => (
                    <View key={index} style={styles.cropTag}>
                      <Text style={styles.cropText}>{crop}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Symptoms */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <AlertTriangle size={20} color="#F59E0B" />
                <Text style={styles.infoTitle}>Symptômes</Text>
              </View>
              {diseaseInfo.symptoms.map((symptom, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.listText}>{symptom}</Text>
                </View>
              ))}
            </View>

            {/* Causes */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Zap size={20} color="#DC2626" />
                <Text style={styles.infoTitle}>Causes</Text>
              </View>
              {diseaseInfo.causes.map((cause, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.listText}>{cause}</Text>
                </View>
              ))}
            </View>

            {/* Treatment */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Leaf size={20} color="#059669" />
                <Text style={styles.infoTitle}>Traitement</Text>
              </View>
              {diseaseInfo.treatment.map((treatment, index) => (
                <View key={index} style={styles.listItem}>
                  <CheckCircle size={16} color="#059669" />
                  <Text style={styles.listText}>{treatment}</Text>
                </View>
              ))}
            </View>

            {/* Prevention */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Shield size={20} color="#3B82F6" />
                <Text style={styles.infoTitle}>Prévention</Text>
              </View>
              {diseaseInfo.prevention.map((prevention, index) => (
                <View key={index} style={styles.listItem}>
                  <CheckCircle size={16} color="#3B82F6" />
                  <Text style={styles.listText}>{prevention}</Text>
                </View>
              ))}
            </View>

            {/* Timing */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Clock size={20} color="#8B5CF6" />
                <Text style={styles.infoTitle}>Conseils de timing</Text>
              </View>
              <Text style={styles.timingText}>
                Cette maladie est plus fréquente pendant: {diseaseInfo.seasonality}
              </Text>
              <Text style={styles.timingAdvice}>
                Surveillez particulièrement vos cultures pendant cette période et appliquez les mesures préventives recommandées.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  noInfoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    padding: 40,
  },
  imagesContainer: {
    marginBottom: 16,
  },
  diseaseImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  metaInfo: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  metaValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#111827',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  cropsContainer: {
    marginTop: 8,
  },
  cropsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  cropTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cropText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#16A34A',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7280',
    marginTop: 7,
    marginRight: 12,
  },
  listText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  timingText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  timingAdvice: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});