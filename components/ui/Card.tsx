import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  style?: any;
}

export function Card({ children, title, description, footer, style }: CardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        borderColor: isDark ? '#27272a' : '#e4e4e7',
      }, 
      style
    ]}>
      {(title || description) && (
        <View style={styles.header}>
          {title && <Text style={[styles.title, { color: isDark ? '#fafafa' : '#09090b' }]}>{title}</Text>}
          {description && <Text style={[styles.description, { color: isDark ? '#a1a1aa' : '#71717a' }]}>{description}</Text>}
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
      {footer && (
        <View style={styles.footer}>
          {footer}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginVertical: 8,
  },
  header: {
    padding: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    marginTop: 6,
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  footer: {
    padding: 24,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
