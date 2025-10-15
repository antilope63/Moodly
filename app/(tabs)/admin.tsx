import React, { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { adminFindUsersByEmail, adminUpsertUser } from "@/services/auth";

const roles = ["super_admin", "manager", "hr", "employee"];

type AdminUser = {
  id: string;
  email: string;
  app_metadata?: { role?: string };
};

export default function AdminScreen() {
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<string>("employee");
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState<string>("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AdminUser[]>([]);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const handleSubmit = async () => {
    if (!email || !role) {
      Alert.alert("Champs manquants", "Email et rôle sont requis.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        id: userId || undefined,
        email,
        password: password || undefined,
        role,
      };
      const data = await adminUpsertUser(payload);
      Alert.alert("Succès", `Action réussie pour ${data.user?.email ?? email}`);
      setUserId("");
      setPassword("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue";
      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    try {
      const users = await adminFindUsersByEmail(searchEmail.trim());
      setResults(
        users.map((u: any) => ({
          id: u.id,
          email: u.email,
          app_metadata: u.app_metadata,
        }))
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue";
      Alert.alert("Erreur", message);
    } finally {
      setSearching(false);
    }
  };

  const startEdit = (u: AdminUser) => {
    setEditing(u);
    setUserId(u.id);
    setEmail(u.email);
    setPassword("");
    setRole(u.app_metadata?.role || "employee");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Recherche</Text>
        <View style={styles.searchRow}>
          <TextInput
            value={searchEmail}
            onChangeText={setSearchEmail}
            placeholder="email à rechercher"
            style={[styles.input, { flex: 1 }]}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Pressable
            onPress={handleSearch}
            disabled={searching}
            style={[
              styles.button,
              styles.searchButton,
              searching ? styles.buttonDisabled : undefined,
            ]}
          >
            <Text style={styles.buttonText}>
              {searching ? "..." : "Rechercher"}
            </Text>
          </Pressable>
        </View>
        {results.length > 0 ? (
          <View style={styles.results}>
            {results.map((u) => (
              <View key={u.id} style={styles.resultItem}>
                <Text style={styles.resultEmail}>{u.email}</Text>
                <Text style={styles.resultRole}>
                  {u.app_metadata?.role ?? "Aucun rôle"}
                </Text>
                <Pressable
                  onPress={() => startEdit(u)}
                  style={[styles.roleChip, styles.editChip]}
                >
                  <Text
                    style={[styles.roleChipText, styles.roleChipTextActive]}
                  >
                    Modifier
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        <Text style={styles.title}>Administration utilisateurs (dev)</Text>

        <Text style={styles.label}>
          ID utilisateur (optionnel pour mise à jour)
        </Text>
        <TextInput
          value={userId}
          onChangeText={setUserId}
          placeholder="uuid"
          style={styles.input}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="email"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {editing ? null : (
          <>
            <Text style={styles.label}>
              Mot de passe (création ou réinit, optionnel)
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="******"
              style={styles.input}
              secureTextEntry
            />
          </>
        )}

        <Text style={styles.label}>Rôle</Text>
        <View style={styles.rolesRow}>
          {roles.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              style={[
                styles.roleChip,
                role === r ? styles.roleChipActive : undefined,
              ]}
            >
              <Text
                style={[
                  styles.roleChipText,
                  role === r ? styles.roleChipTextActive : undefined,
                ]}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.button, loading ? styles.buttonDisabled : undefined]}
        >
          <Text style={styles.buttonText}>
            {userId ? "Mettre à jour" : "Créer"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f6f8f8" },
  container: { padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 14, color: "#6b7280" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  results: { gap: 8, marginBottom: 8 },
  resultItem: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 1)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultEmail: { fontWeight: "600", color: "#111827" },
  resultRole: { color: "#6b7280" },
  input: {
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 1)",
  },
  rolesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleChip: {
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 1)",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "white",
  },
  editChip: { backgroundColor: "#111827", borderColor: "#111827" },
  roleChipActive: { backgroundColor: "#4B93F2", borderColor: "#4B93F2" },
  roleChipText: { color: "#111827" },
  roleChipTextActive: { color: "white", fontWeight: "600" },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  searchButton: { paddingHorizontal: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "white", fontWeight: "700" },
});
