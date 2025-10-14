import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

type InputProps = TextInputProps & {
  error?: boolean;
  label?: string;
  showPasswordToggle?: boolean;
  passwordVisiblePlaceholder?: string;
  passwordHiddenPlaceholder?: string;
};

export default function Input(props: InputProps) {
  const {
    style,
    error,
    label,
    showPasswordToggle,
    secureTextEntry,
    passwordVisiblePlaceholder,
    passwordHiddenPlaceholder,
    placeholder,
    ...rest
  } = props;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const computedSecure = useMemo(() => {
    if (!secureTextEntry) return false;
    return !isPasswordVisible;
  }, [secureTextEntry, isPasswordVisible]);
  const effectivePlaceholder = useMemo(() => {
    if (showPasswordToggle && secureTextEntry) {
      return isPasswordVisible
        ? passwordVisiblePlaceholder ?? "Passe123*"
        : passwordHiddenPlaceholder ?? "••••••••";
    }
    return placeholder;
  }, [
    showPasswordToggle,
    secureTextEntry,
    isPasswordVisible,
    passwordVisiblePlaceholder,
    passwordHiddenPlaceholder,
    placeholder,
  ]);
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {showPasswordToggle ? (
        <View style={[styles.inputContainer, error && styles.inputError]}>
          <TextInput
            placeholderTextColor="#6b7280"
            style={[styles.input, style, styles.inputWithButton]}
            secureTextEntry={computedSecure}
            placeholder={effectivePlaceholder}
            {...rest}
          />
          {secureTextEntry ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isPasswordVisible
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              onPress={() => setIsPasswordVisible((v) => !v)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={isPasswordVisible ? "eye-off" : "eye"}
                size={20}
                color="#64748B"
              />
            </Pressable>
          ) : null}
        </View>
      ) : (
        <TextInput
          placeholderTextColor="#6b7280"
          style={[styles.input, error && styles.inputError, style]}
          secureTextEntry={secureTextEntry}
          placeholder={effectivePlaceholder}
          {...rest}
        />
      )}
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
  inputContainer: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DFE5F3",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#10255d1a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
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
  inputWithButton: {
    flex: 1,
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: "#ef4444",
  },
});
