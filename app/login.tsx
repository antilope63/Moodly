import Button from "@/components/button";
import Input from "@/components/input";
import { useAuth } from "@/providers/auth-provider";
import { loginWithCredentials } from "@/services/auth";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react-native";
import {
  Animated,
  Easing,
  ImageBackground,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const backgroundImage = require("../public/PastelBackground.png");

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const sheetTranslate = useRef(new Animated.Value(0)).current;
  const sheetOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleShow = (event: KeyboardEvent) => {
      const height = event?.endCoordinates?.height ?? 0;
      const gap = Platform.OS === "ios" ? 24 : 16;
      const offset = -Math.max(0, height - gap - 120);
      Animated.timing(sheetTranslate, {
        toValue: offset,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      Animated.timing(sheetOpacity, {
        toValue: 0.98,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };

    const handleHide = () => {
      Animated.parallel([
        Animated.timing(sheetTranslate, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const showSub = Keyboard.addListener(showEvent, handleShow);
    const hideSub = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [sheetOpacity, sheetTranslate]);

  const handleSubmit = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError("Renseigne ton email et ton mot de passe.");
      return;
    }

    setIsLoading(true);

    try {
      const { user, token } = await loginWithCredentials(
        identifier.trim(),
        password
      );
      login(user, token);
      router.replace("/(tabs)");
    } catch (err) {
      const message = err instanceof Error ? err.message : null;
      if (message && message.toLowerCase().includes("identifier")) {
        setError("Identifiants ou mot de passe incorrects.");
      } else if (message) {
        setError(message);
      } else {
        setError("Impossible de te connecter pour le moment.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.sheet,
              {
                opacity: sheetOpacity,
                transform: [{ translateY: sheetTranslate }],
              },
            ]}
          >
            <Text style={styles.heading}>Moodly</Text>

            <View style={styles.form}>
              <Input
                value={identifier}
                onChangeText={(value) => {
                  setIdentifier(value);
                  if (error) setError(null);
                }}
                placeholder="kristin.watson@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                label="Email"
              />

              <Input
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                secureTextEntry
                label="Password"
                showPasswordToggle
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.row}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                  onPress={() => setRememberMe((prev) => !prev)}
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe ? <View style={styles.checkboxInner} /> : null}
                </Pressable>
                <Text style={styles.rememberLabel}>Remember me</Text>

                <Pressable
                  accessibilityRole="link"
                  style={styles.linkPressable}
                  onPress={() => router.push("/forgot-password")}
                >
                  <Text style={styles.linkText}>Forgot password?</Text>
                </Pressable>
              </View>

              <Button
                title="Sign in"
                onPress={handleSubmit}
                loading={isLoading}
              />
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    resizeMode: "cover",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    height: 550,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: "#1c1d3d",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
    width: "100%",
    gap: 16,
  },
  heading: {
    color: "#1F3C88",
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
  },
  form: {
    gap: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  error: {
    color: "#ef4444",
    fontSize: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A5B4FC",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  rememberLabel: {
    flex: 1,
    fontSize: 14,
    color: "#475467",
  },
  linkPressable: {
    padding: 4,
  },
  linkText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },
});
