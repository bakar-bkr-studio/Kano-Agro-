import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DiagnosisResult {
  id: string;
  imageUri: string;
  disease: string;
  confidence: number;
  severity: string;
  treatment: string;
  prevention: string;
  symptoms: string[];
  causes: string[];
  timestamp: string;
  isPhotoQualityGood: boolean;
}

const STORAGE_KEY = '@diagnosis_history';

export function useDiagnosisHistory() {
  const [history, setHistory] = useState<DiagnosisResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedHistory = JSON.parse(stored);
        setHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading diagnosis history:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDiagnosis = async (diagnosis: Omit<DiagnosisResult, 'id' | 'timestamp'>) => {
    try {
      const newDiagnosis: DiagnosisResult = {
        ...diagnosis,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [newDiagnosis, ...history].slice(0, 20); // Keep only last 20
      setHistory(updatedHistory);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      
      return newDiagnosis;
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      throw error;
    }
  };

  const removeDiagnosis = async (id: string) => {
    try {
      const updatedHistory = history.filter(item => item.id !== id);
      setHistory(updatedHistory);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error removing diagnosis:', error);
      throw error;
    }
  };

  const clearHistory = async () => {
    try {
      setHistory([]);
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  };

  return {
    history,
    loading,
    addDiagnosis,
    removeDiagnosis,
    clearHistory,
  };
}