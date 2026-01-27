import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { authApi } from '@/services/api/auth';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const session = await authApi.login(email, password);
      if (session) {
        // AuthProvider will detect the session change and redirect
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // For prototype, we'll just reuse the form or add a toggle.
    // Simplifying to just login for now, or assume registration is separate.
    Alert.alert('Info', 'Registration flow would go here. Use the mock users.');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <ThemedText type="title" style={styles.logoText}>Axisway</ThemedText>
          <ThemedText style={styles.subtitle}>Accessibility & Volunteer Platform</ThemedText>
        </View>

        <Card style={styles.card}>
          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="user@example.com"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            
            <Button onPress={handleLogin} loading={loading} style={styles.button}>
              Sign In
            </Button>

            <Button variant="ghost" onPress={handleRegister} style={styles.registerButton}>
              Create an Account
            </Button>
          </View>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 8,
  },
  card: {
    padding: 16,
  },
  form: {
    gap: 16,
  },
  button: {
    marginTop: 8,
  },
  registerButton: {
    marginTop: 8,
  },
});
