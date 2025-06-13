import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, User, Mail, Lock, Phone, MapPin } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ visible, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nom_complet: '',
    telephone: '',
    adresse: '',
  });

  const { signIn, signUp } = useAuth();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est obligatoire';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    // Signup specific validations
    if (mode === 'signup') {
      if (!formData.nom_complet) {
        newErrors.nom_complet = 'Le nom complet est obligatoire';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (mode === 'signin') {
        console.log('Tentative de connexion avec:', formData.email);
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          console.error('Erreur de connexion:', error);
          setErrors({ general: error.message || 'Erreur de connexion' });
        } else {
          console.log('Connexion réussie');
          onClose();
          resetForm();
        }
      } else {
        console.log('Tentative d\'inscription avec:', formData.email);
        const { error } = await signUp(formData.email, formData.password, {
          nom_complet: formData.nom_complet,
          telephone: formData.telephone === '' ? null : formData.telephone,
          adresse: formData.adresse === '' ? null : formData.adresse,
        });
        if (error) {
          console.error('Erreur d\'inscription:', error);
          setErrors({ general: error.message || 'Erreur d\'inscription' });
        } else {
          console.log('Inscription réussie');
          Alert.alert(
            'Inscription réussie',
            'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.',
            [{ text: 'OK', onPress: () => {
              onClose();
              resetForm();
            }}]
          );
        }
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      setErrors({ general: 'Une erreur inattendue s\'est produite' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      nom_complet: '',
      telephone: '',
      adresse: '',
    });
    setErrors({});
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  React.useEffect(() => {
    setMode(initialMode);
    resetForm();
  }, [initialMode, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === 'signin' ? 'Connexion' : 'Inscription'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {/* General error message */}
              {errors.general && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.general}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Mail size={20} color="#6B7280" />
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Adresse email"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, email: text }));
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}

              <View style={styles.inputGroup}>
                <Lock size={20} color="#6B7280" />
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Mot de passe"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, password: text }));
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>
              {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}

              {mode === 'signup' && (
                <>
                  <View style={styles.inputGroup}>
                    <Lock size={20} color="#6B7280" />
                    <TextInput
                      style={[styles.input, errors.confirmPassword && styles.inputError]}
                      placeholder="Confirmer le mot de passe"
                      placeholderTextColor="#9CA3AF"
                      value={formData.confirmPassword}
                      onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, confirmPassword: text }));
                        if (errors.confirmPassword) {
                          setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }
                      }}
                      secureTextEntry
                      autoComplete="password"
                    />
                  </View>
                  {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}

                  <View style={styles.inputGroup}>
                    <User size={20} color="#6B7280" />
                    <TextInput
                      style={[styles.input, errors.nom_complet && styles.inputError]}
                      placeholder="Nom complet *"
                      placeholderTextColor="#9CA3AF"
                      value={formData.nom_complet}
                      onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, nom_complet: text }));
                        if (errors.nom_complet) {
                          setErrors(prev => ({ ...prev, nom_complet: '' }));
                        }
                      }}
                      autoComplete="name"
                    />
                  </View>
                  {errors.nom_complet && <Text style={styles.fieldError}>{errors.nom_complet}</Text>}

                  <View style={styles.inputGroup}>
                    <Phone size={20} color="#6B7280" />
                    <TextInput
                      style={styles.input}
                      placeholder="Numéro de téléphone"
                      placeholderTextColor="#9CA3AF"
                      value={formData.telephone}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, telephone: text }))}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <MapPin size={20} color="#6B7280" />
                    <TextInput
                      style={styles.input}
                      placeholder="Adresse"
                      placeholderTextColor="#9CA3AF"
                      value={formData.adresse}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, adresse: text }))}
                      autoComplete="street-address"
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {mode === 'signin' ? 'Se connecter' : 'S\'inscrire'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.switchButton} onPress={switchMode}>
                <Text style={styles.switchButtonText}>
                  {mode === 'signin'
                    ? 'Pas encore de compte ? S\'inscrire'
                    : 'Déjà un compte ? Se connecter'}
                </Text>
              </TouchableOpacity>
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
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
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
    fontSize: 20,
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  form: {
    gap: 16,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  fieldError: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#DC2626',
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#16A34A',
  },
});