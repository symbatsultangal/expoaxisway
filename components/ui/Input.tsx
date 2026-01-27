import React from 'react';
import { TextInput, TextInputProps, View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: isDark ? '#fafafa' : '#09090b' }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: 'transparent',
            borderColor: error ? '#ef4444' : (isDark ? '#27272a' : '#e4e4e7'),
            color: isDark ? '#fafafa' : '#09090b',
          },
          style
        ]}
        placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
        {...props}
      />
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  error: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});
