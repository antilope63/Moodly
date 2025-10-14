import Button from "@/components/button";
import Input from "@/components/input";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    type?: string;
  }>();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
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
      const offset = -Math.max(0, height - gap - 60);
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

  // Si retour depuis l'email Supabase avec tokens, établir la session
  useEffect(() => {
    const establishSession = async () => {
      try {
        const access = params?.access_token;
        const refresh = params?.refresh_token;
        if (access && refresh) {
          const { supabase } = await import("@/lib/supabase");
          const { error } = await supabase.auth.setSession({
            access_token: String(access),
            refresh_token: String(refresh),
          });
          if (error) {
            // no-op, on laisse l'utilisateur saisir le nouveau mot de passe quand même
          }
        }
      } catch {}
    };
    establishSession();
  }, [params]);

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
      // Préférer un code OTP pour s'affranchir des redirections navigateur
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setOtpRequested(true);
      setMessage("Un code à 6 chiffres t'a été envoyé par email.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      setError(msg || "Impossible d'envoyer l'email pour le moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setMessage(null);
    setError(null);
    if (!password || password.length < 6) {
      setError("Mot de passe trop court (≥ 6 caractères).");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setIsLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Mot de passe mis à jour. Tu peux te connecter.");
      setTimeout(() => router.replace("/login"), 800);
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      setError(msg || "Impossible de mettre à jour le mot de passe.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setMessage(null);
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || otp.length < 6) {
      setError("Renseigne l'email et le code (6 chiffres).");
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: trimmed,
        token: otp,
        type: "email",
      });
      if (error) throw error;
      // Après vérification, une session est ouverte: on affiche le formulaire nouveau mot de passe
      setOtpVerified(true);
      setMessage("Code vérifié. Saisis ton nouveau mot de passe.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      setError(msg || "Code invalide ou expiré.");
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
            {params?.access_token && params?.refresh_token ? (
              <>
                <Text style={styles.heading}>Nouveau mot de passe</Text>
                <View style={styles.form}>
                  <Input
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (error) setError(null);
                      if (message) setMessage(null);
                    }}
                    secureTextEntry
                    showPasswordToggle
                    placeholder="Passe123*"
                    label="Mot de passe"
                  />
                  <Input
                    value={confirm}
                    onChangeText={(v) => {
                      setConfirm(v);
                      if (error) setError(null);
                      if (message) setMessage(null);
                    }}
                    secureTextEntry
                    showPasswordToggle
                    placeholder="Passe123*"
                    label="Confirme le mot de passe"
                  />
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  {message ? <Text style={styles.info}>{message}</Text> : null}
                  <Button
                    title="Mettre à jour"
                    onPress={handleUpdatePassword}
                    loading={isLoading}
                  />
                  <Text
                    style={styles.backLink}
                    onPress={() => router.replace("/login")}
                  >
                    Retour à la connexion
                  </Text>
                </View>
              </>
            ) : otpVerified ? (
              <>
                <Text style={styles.heading}>Nouveau mot de passe</Text>
                <View style={styles.form}>
                  <Input
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (error) setError(null);
                      if (message) setMessage(null);
                    }}
                    secureTextEntry
                    showPasswordToggle
                    placeholder="Passe123*"
                    label="Mot de passe"
                  />
                  <Input
                    value={confirm}
                    onChangeText={(v) => {
                      setConfirm(v);
                      if (error) setError(null);
                      if (message) setMessage(null);
                    }}
                    secureTextEntry
                    showPasswordToggle
                    placeholder="Passe123*"
                    label="Confirme le mot de passe"
                  />
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  {message ? <Text style={styles.info}>{message}</Text> : null}
                  <Button
                    title="Mettre à jour"
                    onPress={handleUpdatePassword}
                    loading={isLoading}
                  />
                  <Text
                    style={styles.backLink}
                    onPress={() => router.replace("/login")}
                  >
                    Retour à la connexion
                  </Text>
                </View>
              </>
            ) : otpRequested ? (
              <>
                <Text style={styles.heading}>Entre le code reçu par email</Text>
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
                  <Input
                    value={otp}
                    onChangeText={(v) => {
                      setOtp(v);
                      if (error) setError(null);
                      if (message) setMessage(null);
                    }}
                    keyboardType="number-pad"
                    placeholder="123456"
                    label="Code à 6 chiffres"
                  />
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  {message ? <Text style={styles.info}>{message}</Text> : null}
                  <Button
                    title="Valider le code"
                    onPress={handleVerifyOtp}
                    loading={isLoading}
                  />
                  <Text
                    style={styles.backLink}
                    onPress={() => {
                      setOtpRequested(false);
                      setOtp("");
                      setMessage(null);
                    }}
                  >
                    Renvoyer un code
                  </Text>
                </View>
              </>
            ) : (
              <>
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
                    title="Recevoir un code"
                    onPress={handleSubmit}
                    loading={isLoading}
                  />
                  <Text style={styles.backLink} onPress={() => router.back()}>
                    Retour à la connexion
                  </Text>
                </View>
              </>
            )}
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
