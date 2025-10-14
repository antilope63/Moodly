import Button from "@/components/button";
import Input from "@/components/input";
import { sendPasswordResetEmail } from "@/services/auth";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react-native";
import {
  Animated,
  Easing,
  ImageBackground,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const backgroundImage = require("../public/PastelBackground.png");

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    setMessage(null);
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Renseigne ton email.");
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(trimmed);
      setMessage(
        "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé."
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      setError(msg || "Impossible d'envoyer l'email pour le moment.");
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
            <Text style={styles.heading}>Mot de passe oublié</Text>
            <View style={styles.form}>
              <Input
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (error) setError(null);
                  if (message) setMessage(null);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                placeholder="john.doe@example.com"
                label="Email"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {message ? <Text style={styles.info}>{message}</Text> : null}

              <Button
                title="Envoyer"
                onPress={handleSubmit}
                loading={isLoading}
              />
              <Text style={styles.backLink} onPress={() => router.back()}>
                Retour à la connexion
              </Text>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  backgroundImage: { resizeMode: "cover" },
  safeArea: { flex: 1 },
  content: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF",
    height: 480,
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
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  form: { gap: 18 },
  error: { color: "#ef4444", fontSize: 14 },
  info: { color: "#047857", fontSize: 14 },
  backLink: {
    color: "#2563EB",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    fontWeight: "600",
  },
});
