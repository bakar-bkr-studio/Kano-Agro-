import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Share, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { Camera, Image as ImageIcon, Leaf, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Circle as XCircle, RotateCcw, Share2, Info, Trash2, Eye, Calendar, Clock, TriangleAlert as AlertTriangle, SquareCheck as CheckSquare } from 'lucide-react-native';
import { useDiagnosisHistory, DiagnosisResult } from '@/hooks/useDiagnosisHistory';
import DiseaseInfoModal from '@/components/DiseaseInfoModal';

const { width: screenWidth } = Dimensions.get('window');

// Mock diseases database for simulation
const mockDiseases = [
  {
    disease: 'Mildiou de la tomate',
    confidence: 85,
    severity: 'Modérée',
    treatment: 'Appliquer un fongicide à base de cuivre et améliorer la ventilation',
    prevention: 'Éviter l\'arrosage des feuilles et espacer les plants',
    symptoms: ['Taches brunes sur les feuilles', 'Flétrissement', 'Duvet blanc sous les feuilles'],
    causes: ['Humidité élevée', 'Mauvaise circulation d\'air', 'Arrosage sur les feuilles']
  },
  {
    disease: 'Rouille du maïs',
    confidence: 78,
    severity: 'Faible',
    treatment: 'Appliquer un fongicide systémique et éliminer les résidus infectés',
    prevention: 'Utiliser des variétés résistantes et pratiquer la rotation des cultures',
    symptoms: ['Pustules orange sur les feuilles', 'Jaunissement', 'Affaiblissement de la plante'],
    causes: ['Humidité élevée', 'Températures modérées', 'Vent dispersant les spores']
  },
  {
    disease: 'Flétrissement bactérien',
    confidence: 92,
    severity: 'Élevée',
    treatment: 'Éliminer immédiatement les plants infectés et désinfecter les outils',
    prevention: 'Rotation des cultures et amélioration du drainage du sol',
    symptoms: ['Flétrissement soudain', 'Jaunissement des feuilles', 'Brunissement des vaisseaux'],
    causes: ['Bactérie pathogène', 'Sol humide et chaud', 'Blessures sur les racines']
  }
];

export default function DiagnosisScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showDiseaseInfo, setShowDiseaseInfo] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { history, loading: historyLoading, addDiagnosis, removeDiagnosis } = useDiagnosisHistory();

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const checkPhotoQuality = (imageUri: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Simulate photo quality check
      // In a real app, you would analyze the image for blur, lighting, etc.
      const isGoodQuality = Math.random() > 0.3; // 70% chance of good quality
      resolve(isGoodQuality);
    });
  };

  const analyzeImage = async (imageUri: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setCapturedImage(imageUri);

    try {
      // Check photo quality first
      const isQualityGood = await checkPhotoQuality(imageUri);
      
      if (!isQualityGood) {
        Alert.alert(
          'Photo floue détectée',
          'La photo semble floue ou de mauvaise qualité. Voulez-vous reprendre la photo pour un meilleur diagnostic ?',
          [
            { text: 'Continuer quand même', onPress: () => performAnalysis(imageUri, false) },
            { text: 'Reprendre la photo', onPress: resetDiagnosis, style: 'cancel' }
          ]
        );
        return;
      }

      await performAnalysis(imageUri, true);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError('Erreur lors de l\'analyse. Veuillez réessayer.');
      setIsAnalyzing(false);
    }
  };

  const performAnalysis = async (imageUri: string, isPhotoQualityGood: boolean) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate random analysis results
      const randomDisease = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];
      
      // Simulate analysis failure (10% chance)
      if (Math.random() < 0.1) {
        throw new Error('Service temporairement indisponible');
      }

      // Simulate no disease detected (15% chance)
      if (Math.random() < 0.15) {
        setDiagnosisResult({
          id: '',
          imageUri,
          disease: 'Aucun problème détecté',
          confidence: 0,
          severity: 'Aucune',
          treatment: 'Aucun traitement nécessaire',
          prevention: 'Continuez vos bonnes pratiques agricoles',
          symptoms: [],
          causes: [],
          timestamp: '',
          isPhotoQualityGood
        });
        setIsAnalyzing(false);
        return;
      }

      const result: Omit<DiagnosisResult, 'id' | 'timestamp'> = {
        imageUri,
        disease: randomDisease.disease,
        confidence: randomDisease.confidence,
        severity: randomDisease.severity,
        treatment: randomDisease.treatment,
        prevention: randomDisease.prevention,
        symptoms: randomDisease.symptoms,
        causes: randomDisease.causes,
        isPhotoQualityGood
      };

      // Check confidence level
      if (result.confidence < 60) {
        Alert.alert(
          'Confiance faible',
          `Le diagnostic a une confiance de seulement ${result.confidence}%. Il est recommandé de reprendre la photo avec un meilleur éclairage et un angle différent.`,
          [
            { text: 'Voir le résultat', onPress: () => showResult(result) },
            { text: 'Reprendre la photo', onPress: resetDiagnosis, style: 'cancel' }
          ]
        );
        return;
      }

      await showResult(result);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Erreur lors de l\'analyse');
      setIsAnalyzing(false);
    }
  };

  const showResult = async (result: Omit<DiagnosisResult, 'id' | 'timestamp'>) => {
    try {
      const savedDiagnosis = await addDiagnosis(result);
      setDiagnosisResult(savedDiagnosis);
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      // Show result anyway, just don't save to history
      setDiagnosisResult({
        ...result,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      });
    }
    setIsAnalyzing(false);
  };

  const takePicture = async () => {
    setShowCamera(false);
    // Simulate taking a picture
    const mockImageUri = 'https://images.pexels.com/photos/1459375/pexels-photo-1459375.jpeg?auto=compress&cs=tinysrgb&w=400';
    await analyzeImage(mockImageUri);
  };

  const pickImageFromGallery = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission requise',
          'L\'accès à la galerie est nécessaire pour sélectionner une photo.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à la galerie. Veuillez réessayer.');
    }
  };

  const resetDiagnosis = () => {
    setCapturedImage(null);
    setDiagnosisResult(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
  };

  const shareDiagnosis = async () => {
    if (!diagnosisResult) return;

    try {
      const shareContent = `🌱 Diagnostic Agricole IA\n\n` +
        `Maladie détectée: ${diagnosisResult.disease}\n` +
        `Confiance: ${diagnosisResult.confidence}%\n` +
        `Sévérité: ${diagnosisResult.severity}\n\n` +
        `Traitement: ${diagnosisResult.treatment}\n\n` +
        `Prévention: ${diagnosisResult.prevention}\n\n` +
        `Date: ${new Date(diagnosisResult.timestamp).toLocaleDateString('fr-FR')}\n\n` +
        `Généré par l'app Kano Agro`;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(diagnosisResult.imageUri, {
          dialogTitle: 'Partager le diagnostic',
          mimeType: 'image/jpeg',
        });
      } else {
        await Share.share({
          message: shareContent,
          title: 'Diagnostic Agricole IA'
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Erreur', 'Impossible de partager le diagnostic.');
    }
  };

  const viewDiagnosisDetails = (diagnosis: DiagnosisResult) => {
    setSelectedDiagnosis(diagnosis);
    setShowDiseaseInfo(true);
  };

  const deleteDiagnosis = (id: string) => {
    Alert.alert(
      'Supprimer le diagnostic',
      'Êtes-vous sûr de vouloir supprimer ce diagnostic de l\'historique ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => removeDiagnosis(id)
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#059669';
    if (confidence >= 60) return '#F59E0B';
    return '#DC2626';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Faible': return '#10B981';
      case 'Modérée': return '#F59E0B';
      case 'Élevée': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#6B7280" />
          <Text style={styles.permissionTitle}>Accès à la Caméra</Text>
          <Text style={styles.permissionText}>
            Nous avons besoin d'accéder à votre caméra pour diagnostiquer vos cultures
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser l'accès</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing}>
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={() => setShowCamera(false)}
              >
                <XCircle size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={toggleCameraFacing}
              >
                <RotateCcw size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.cameraGuide}>
              <View style={styles.guideFrame} />
              <Text style={styles.guideText}>
                Centrez la partie malade de la plante dans le cadre
              </Text>
            </View>
            
            <View style={styles.cameraFooter}>
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Diagnostic IA</Text>
        <Text style={styles.headerSubtitle}>Identifiez les maladies de vos cultures</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!capturedImage && !isAnalyzing && !diagnosisResult && (
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.cameraCard}
              onPress={() => setShowCamera(true)}
            >
              <Camera size={48} color="#16A34A" />
              <Text style={styles.cameraCardTitle}>Prendre une Photo</Text>
              <Text style={styles.cameraCardDesc}>
                Photographiez les feuilles ou fruits malades
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.galleryCard}
              onPress={pickImageFromGallery}
            >
              <ImageIcon size={48} color="#3B82F6" />
              <Text style={styles.galleryCardTitle}>Galerie</Text>
              <Text style={styles.galleryCardDesc}>
                Choisir une photo existante
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {capturedImage && !diagnosisResult && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            {!isAnalyzing && (
              <TouchableOpacity style={styles.retakeButton} onPress={resetDiagnosis}>
                <RotateCcw size={16} color="#FFFFFF" />
                <Text style={styles.retakeButtonText}>Reprendre</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isAnalyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.analyzingTitle}>Analyse en cours...</Text>
            <Text style={styles.analyzingText}>
              Notre IA examine votre photo pour identifier les problèmes
            </Text>
            <View style={styles.analysisSteps}>
              <View style={styles.stepItem}>
                <CheckSquare size={16} color="#16A34A" />
                <Text style={styles.stepText}>Qualité de l'image vérifiée</Text>
              </View>
              <View style={styles.stepItem}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.stepText}>Analyse des symptômes...</Text>
              </View>
            </View>
          </View>
        )}

        {analysisError && (
          <View style={styles.errorContainer}>
            <AlertTriangle size={48} color="#DC2626" />
            <Text style={styles.errorTitle}>Erreur d'analyse</Text>
            <Text style={styles.errorText}>{analysisError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={resetDiagnosis}>
              <RotateCcw size={16} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Recommencer</Text>
            </TouchableOpacity>
          </View>
        )}

        {diagnosisResult && (
          <View style={styles.resultContainer}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: diagnosisResult.imageUri }} style={styles.capturedImage} />
              {!diagnosisResult.isPhotoQualityGood && (
                <View style={styles.qualityWarning}>
                  <AlertTriangle size={16} color="#F59E0B" />
                  <Text style={styles.qualityWarningText}>Photo de qualité moyenne</Text>
                </View>
              )}
            </View>

            <View style={styles.resultHeader}>
              <AlertCircle size={24} color="#F59E0B" />
              <Text style={styles.resultTitle}>Résultat du Diagnostic</Text>
            </View>

            {diagnosisResult.disease === 'Aucun problème détecté' ? (
              <View style={styles.noDiseaseCard}>
                <CheckCircle size={48} color="#10B981" />
                <Text style={styles.noDiseaseTitle}>Aucun problème détecté</Text>
                <Text style={styles.noDiseaseText}>
                  L'IA n'a détecté aucune maladie sur cette photo. Votre plante semble en bonne santé !
                </Text>
                <Text style={styles.noDiseaseAdvice}>
                  Si vous pensez qu'il y a un problème, essayez de prendre une photo plus claire de la zone concernée.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.diseaseCard}>
                  <Text style={styles.diseaseName}>{diagnosisResult.disease}</Text>
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceLabel}>Confiance: </Text>
                    <Text style={[
                      styles.confidenceValue,
                      { color: getConfidenceColor(diagnosisResult.confidence) }
                    ]}>
                      {diagnosisResult.confidence}%
                    </Text>
                  </View>
                  <View style={styles.severityContainer}>
                    <Text style={styles.severityLabel}>Sévérité: </Text>
                    <Text style={[
                      styles.severityValue,
                      { color: getSeverityColor(diagnosisResult.severity) }
                    ]}>
                      {diagnosisResult.severity}
                    </Text>
                  </View>
                </View>

                <View style={styles.treatmentCard}>
                  <View style={styles.treatmentHeader}>
                    <CheckCircle size={20} color="#059669" />
                    <Text style={styles.treatmentTitle}>Traitement Recommandé</Text>
                  </View>
                  <Text style={styles.treatmentText}>{diagnosisResult.treatment}</Text>
                </View>

                <View style={styles.preventionCard}>
                  <View style={styles.preventionHeader}>
                    <Leaf size={20} color="#3B82F6" />
                    <Text style={styles.preventionTitle}>Prévention</Text>
                  </View>
                  <Text style={styles.preventionText}>{diagnosisResult.prevention}</Text>
                </View>

                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.infoButton}
                    onPress={() => viewDiagnosisDetails(diagnosisResult)}
                  >
                    <Info size={16} color="#3B82F6" />
                    <Text style={styles.infoButtonText}>En savoir plus</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={shareDiagnosis}
                  >
                    <Share2 size={16} color="#FFFFFF" />
                    <Text style={styles.shareButtonText}>Partager</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.newDiagnosisButton} onPress={resetDiagnosis}>
              <Text style={styles.newDiagnosisButtonText}>Nouveau Diagnostic</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historique des Diagnostics</Text>
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
              {historyLoading ? (
                <ActivityIndicator size="small" color="#16A34A" />
              ) : history.length > 0 ? (
                history.map((item) => (
                  <View key={item.id} style={styles.historyItem}>
                    <Image source={{ uri: item.imageUri }} style={styles.historyImage} />
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyDisease}>{item.disease}</Text>
                      <Text style={styles.historyDate}>{formatDate(item.timestamp)}</Text>
                      <View style={styles.historyMeta}>
                        <Text style={[
                          styles.historyConfidence,
                          { color: getConfidenceColor(item.confidence) }
                        ]}>
                          {item.confidence > 0 ? `${item.confidence}%` : 'N/A'}
                        </Text>
                        <Text style={styles.historySeverity}>{item.severity}</Text>
                      </View>
                    </View>
                    <View style={styles.historyActions}>
                      <TouchableOpacity 
                        style={styles.historyActionButton}
                        onPress={() => viewDiagnosisDetails(item)}
                      >
                        <Eye size={16} color="#3B82F6" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.historyActionButton}
                        onPress={() => deleteDiagnosis(item.id)}
                      >
                        <Trash2 size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyHistory}>
                  <Calendar size={32} color="#6B7280" />
                  <Text style={styles.emptyHistoryText}>Aucun diagnostic dans l'historique</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* How it works section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Comment ça marche ?</Text>
          <View style={styles.infoSteps}>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Prenez une photo claire de la partie malade</Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Notre IA analyse automatiquement l'image</Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Recevez le diagnostic et les recommandations</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <DiseaseInfoModal
        visible={showDiseaseInfo}
        onClose={() => setShowDiseaseInfo(false)}
        diagnosis={selectedDiagnosis}
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
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#111827',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 24,
  },
  cameraCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraCardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  cameraCardDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  galleryCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  galleryCardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  galleryCardDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraGuide: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  guideFrame: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  guideText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
  },
  cameraFooter: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16A34A',
  },
  imageContainer: {
    marginTop: 20,
    marginBottom: 24,
    position: 'relative',
  },
  capturedImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
  },
  qualityWarning: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qualityWarningText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  retakeButton: {
    backgroundColor: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: 'center',
  },
  retakeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  analyzingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  analyzingTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  analyzingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  analysisSteps: {
    alignItems: 'flex-start',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
    paddingHorizontal: 40,
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
  resultContainer: {
    marginTop: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
    marginLeft: 8,
  },
  noDiseaseCard: {
    backgroundColor: '#F0FDF4',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  noDiseaseTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#15803D',
    marginTop: 16,
    marginBottom: 8,
  },
  noDiseaseText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#166534',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  noDiseaseAdvice: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#15803D',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  diseaseCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  diseaseName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#DC2626',
    marginBottom: 12,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  confidenceValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  severityValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  treatmentCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  treatmentTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  treatmentText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  preventionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  preventionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  preventionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  preventionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  infoButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 4,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  shareButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  newDiagnosisButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  newDiagnosisButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
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
  historyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyDisease: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  historyDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyConfidence: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  historySeverity: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  historyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  historyActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#111827',
    marginBottom: 16,
  },
  infoSteps: {
    gap: 16,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  permissionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});