import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { getTeacherEarnings } from "@/lib/services/teacher";
import * as Linking from "expo-linking";

/* ===================== TYPES ===================== */

interface EarningsItem {
  id: string;
  sessionName: string;
  amount: number;
  status: 0 | 1 | 2;
  releaseDate: string;
  download_url?: string;
}

/* ===================== UTILS ===================== */

const formatCurrencyAUD = (value: number) => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
  }).format(value);
};

const calculateSummary = (data: EarningsItem[]) => ({
  scheduled: data
    .filter((x) => x.status === 1)
    .reduce((sum, item) => sum + item.amount, 0),

  released: data
    .filter((x) => x.status === 2)
    .reduce((sum, item) => sum + item.amount, 0),
});

const isReleasingSoon = (date: string) => {
  if (!date) return false;

  const now = new Date();
  const release = new Date(date);

  const diff =
    (release.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  return diff <= 7 && diff > 0;
};

/* ===================== SCREEN ===================== */

export default function EarningsScreen() {
  const [summary, setSummary] = useState({
    scheduled: 0,
    released: 0,
  });

  const [data, setData] = useState<EarningsItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= LOAD DATA ================= */

  const load = useCallback(async () => {
    try {
      const res = await getTeacherEarnings();
      const items = res?.data ?? [];

      const mapped: EarningsItem[] = items.map((item: any) => ({
        id: String(item.id),
        sessionName: item.subject_name
          ? item.year_level
            ? `${item.subject_name} - Year ${item.year_level}`
            : item.subject_name
          : `Booking #${item.booking_id}`,
        amount: Number(item.total_amount ?? 0),
        status: Number(item.status ?? 2) as 0 | 1 | 2,
        releaseDate: item.release_date || "",
        download_url: item.download_url,
      }));

      setSummary(calculateSummary(mapped));

      const sorted = mapped.sort(
        (a, b) =>
          new Date(b.releaseDate).getTime() -
          new Date(a.releaseDate).getTime()
      );

      setData(sorted.slice(0, 5));
    } catch (err) {
      console.error("Load earnings error:", err);
    }
  }, []);

  /* ================= FIRST LOAD ================= */

  useEffect(() => {
    load();
  }, [load]);

  /* ================= PULL TO REFRESH ================= */

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  /* ================= DOWNLOAD ================= */

  const handleDownload = (item: EarningsItem) => {
    if (!item.download_url) {
      Alert.alert("Error", "File tidak tersedia");
      return;
    }

    Linking.openURL(item.download_url);
  };

  const hasReleasingSoon = data.some(
    (x) => x.status === 1 && isReleasingSoon(x.releaseDate)
  );

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}

        /* 🔥 IMPORTANT: biar tetap bisa pull walau data sedikit */
        contentContainerStyle={{
          ...styles.content,
          flexGrow: 1,
        }}

        /* 🔥 INI YANG BIKIN REFRESH */
        refreshing={refreshing}
        onRefresh={onRefresh}

        ListHeaderComponent={
          <>
            <Text style={styles.header}>Earnings</Text>

            <View style={styles.row}>
              <View style={[styles.card, { borderLeftColor: "#f59e0b" }]}>
                <Text style={styles.cardTitle}>Scheduled</Text>
                <Text style={styles.cardValue}>
                  {formatCurrencyAUD(summary.scheduled)}
                </Text>

                {hasReleasingSoon && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      Releasing soon
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.card, { borderLeftColor: "#22c55e" }]}>
                <Text style={styles.cardTitle}>Released</Text>
                <Text style={[styles.cardValue, { color: "#22c55e" }]}>
                  {formatCurrencyAUD(summary.released)}
                </Text>
              </View>
            </View>

            <Text style={styles.section}>Recent Earnings</Text>
          </>
        }

        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.session}>{item.sessionName}</Text>
              <Text style={styles.date}>
                Release Date: {item.releaseDate}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.amount}>
                {formatCurrencyAUD(item.amount)}
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === 1
                        ? "#f59e0b"
                        : "#22c55e",
                  },
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {item.status === 1 ? "Scheduled" : "Released"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDownload(item)}
              >
                <Text style={styles.actionButtonText}>
                  Download
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#111",
  },
  row: {
    flexDirection: "row",
    marginBottom: 24,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  badge: {
    marginTop: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "#fde68a",
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#92400e",
    fontSize: 10,
    fontWeight: "600",
  },
  section: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
    marginTop: 8,
    color: "#444",
  },
  item: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  session: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  date: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    minWidth: 84,
    alignItems: "center",
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  actionButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});