import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'default', 
  size = 'default', 
  loading = false, 
  children, 
  style, 
  disabled,
  ...props 
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const getBackgroundColor = () => {
    if (disabled) return isDark ? '#333' : '#e2e8f0';
    switch (variant) {
      case 'destructive': return '#ef4444';
      case 'outline': return 'transparent';
      case 'secondary': return isDark ? '#27272a' : '#f4f4f5';
      case 'ghost': return 'transparent';
      case 'link': return 'transparent';
      default: return isDark ? '#fafafa' : '#18181b'; // Primary (Shadcn Zinc 900/50)
    }
  };

  const getTextColor = () => {
    if (disabled) return '#94a3b8';
    switch (variant) {
      case 'destructive': return '#fff';
      case 'outline': return isDark ? '#fafafa' : '#18181b';
      case 'secondary': return isDark ? '#fafafa' : '#18181b';
      case 'ghost': return isDark ? '#fafafa' : '#18181b';
      case 'link': return '#2563eb';
      default: return isDark ? '#18181b' : '#fafafa'; // Primary Text
    }
  };

  const getBorder = (): ViewStyle => {
    if (variant === 'outline') {
      return { borderWidth: 1, borderColor: isDark ? '#3f3f46' : '#e4e4e7' };
    }
    return {};
  };

  const getPadding = (): ViewStyle => {
    switch (size) {
      case 'sm': return { paddingVertical: 8, paddingHorizontal: 12 };
      case 'lg': return { paddingVertical: 12, paddingHorizontal: 32 };
      case 'icon': return { width: 40, height: 40, padding: 0, justifyContent: 'center', alignItems: 'center' };
      default: return { paddingVertical: 10, paddingHorizontal: 16 };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: getBackgroundColor() },
        getBorder(),
        getPadding(),
        disabled && { opacity: 0.7 },
        style
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor(), fontSize: size === 'lg' ? 16 : 14 }]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
