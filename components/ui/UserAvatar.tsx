import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

type UserAvatarProps = {
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

// Une palette de couleurs pour les fonds d'avatar
const AVATAR_COLORS = [
  '#FFC107', // Amber
  '#00BCD4', // Cyan
  '#4CAF50', // Green
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#3F51B5', // Indigo
  '#FF5722', // Deep Orange
  '#03A9F4', // Light Blue
];

// Génère une couleur constante à partir du nom
const getColorByName = (name: string) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    // eslint-disable-next-line no-bitwise
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % AVATAR_COLORS.length);
  return AVATAR_COLORS[index];
};

export const UserAvatar = ({ name, size = 50, style }: UserAvatarProps) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const backgroundColor = getColorByName(name);
  const fontSize = size * 0.5;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{initial}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});