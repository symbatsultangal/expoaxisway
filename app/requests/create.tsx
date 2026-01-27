import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/providers/AuthProvider';
import { requestsApi } from '@/services/api/requests';

export default function CreateRequestScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description) {
      Alert.alert('Error', 'Please describe what you need help with.');
      return;
    }

    setLoading(true);
    try {
      // Mock location for prototype (Paris)
      const mockLocation = {
        origin_latitude: 48.8566,
        origin_longitude: 2.3522,
        destination_latitude: 48.8566,
        destination_longitude: 2.3522,
        complexity_level: 1, // Default
      };

      await requestsApi.create(user?.id!, {
        description,
        ...mockLocation
      });

      Alert.alert('Success', 'Help request created!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>Describe your need</ThemedText>
        
        <View style={styles.form}>
          <Input 
            label="Description"
            placeholder="e.g., I need help crossing the intersection at Main St."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top' }}
          />

          <View style={styles.infoBox}>
            <ThemedText style={styles.infoText}>
              Your location will be automatically shared with verified volunteers nearby.
            </ThemedText>
          </View>

          <Button onPress={handleSubmit} loading={loading}>
            Request Volunteer
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  form: {
    gap: 20,
  },
  infoBox: {
    padding: 12,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 6,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    opacity: 0.8,
  }
});
