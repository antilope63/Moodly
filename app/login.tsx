import Button from "@/components/button";
import Input from "@/components/input";
import { useAuth } from "@/providers/auth-provider";
import { loginWithCredentials } from "@/services/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const backgroundImage = require("../public/PastelBackground.png");

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.wrapper}>
        <ImageBackground
          source={backgroundImage}
          style={styles.headerBackground}
          imageStyle={styles.headerImage}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>{"<"} Back</Text>
          </Pressable>
        </ImageBackground>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
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
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.row}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                  onPress={() => setRememberMe((prev) => !prev)}
                  style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
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
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E6EEFF",
  },
  wrapper: {
    flex: 1,
  },
  headerBackground: {
    height: 280,
    paddingHorizontal: 24,
    paddingTop: 32,
    justifyContent: "flex-start",
  },
  headerImage: {
    resizeMode: "cover",
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#1E3A8A",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: "#0f1f4b",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cardContainer: {
    flex: 1,
    marginTop: -140,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: "#1e1f3d",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 6,
    alignItems: "stretch",
    gap: 12,
  },
  heading: {
    color: "#1F3C88",
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
  },
  form: {
    marginTop: 8,
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
