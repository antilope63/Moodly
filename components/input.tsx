import React from "react";
import { StyleSheet, TextInput, TextInputProps, Text, View } from "react-native";

type InputProps = TextInputProps & {
  error?: boolean;
  label?: string;
};

export default function Input(props: InputProps) {
  const { style, error, label, ...rest } = props;
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#6b7280"
        style={[styles.input, error && styles.inputError, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: "#475467",
    fontSize: 15,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DFE5F3",
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: "#111827",
    fontSize: 16,
    shadowColor: "#10255d1a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  inputError: {
    borderColor: "#ef4444",
  },
});
