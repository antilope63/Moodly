import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function Button({
  title,
  onPress,
  loading,
  disabled,
}: ButtonProps) {
  const isDisabled = Boolean(loading || disabled);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 12,
    backgroundColor: "#2563EB",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 16,
    shadowColor: "#1d2e6d",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#93C5FD",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
