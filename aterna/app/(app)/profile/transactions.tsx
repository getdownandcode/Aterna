import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { ChevronLeft, ShieldCheck, HeartPulse, Percent } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";
import { useAuth } from "@clerk/clerk-expo";
import { colors } from "@/constants/theme";
import { Card } from "@/components/ui/Card";
import { TransactionItem } from "@/components/payments/TransactionItem";
import { useUser } from "@/hooks/useUser";
import { getSupabase } from "@/lib/supabase";

interface CommitmentWithGoal {
  id: string;
  amount: number;
  status: string;
  razorpay_status: string;
  consequence_triggered_at: string | null;
  created_at: string;
  smart_text: string;
  goal_status: string;
  category: string;
  goal_date: string;
  consequence_type: string;
  consequence_target: string | null;
}

export default function Transactions() {
  const router = useRouter();
  const { dbUser } = useUser();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<CommitmentWithGoal[]>([]);

  // Aggregate stats
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);

  const fetchTransactions = useCallback(async () => {
    if (!dbUser) return;
    try {
      const supabase = await getSupabase(getToken);
      
      const { data, error } = await supabase
        .from("commitments")
        .select(`
          id,
          amount,
          status,
          razorpay_status,
          consequence_triggered_at,
          created_at,
          goals:goal_id (
            smart_text,
            status,
            category,
            goal_date,
            consequence_type,
            consequence_target
          )
        `)
        .eq("user_id", dbUser.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      const formatted: CommitmentWithGoal[] = (data || []).map((c: any) => ({
        id: c.id,
        amount: parseFloat(c.amount),
        status: c.status,
        razorpay_status: c.razorpay_status,
        consequence_triggered_at: c.consequence_triggered_at,
        created_at: c.created_at,
        smart_text: c.goals?.smart_text || "My daily accountability contract",
        goal_status: c.goals?.status || "unknown",
        category: c.goals?.category || "personal",
        goal_date: c.goals?.goal_date || "",
        consequence_type: c.goals?.consequence_type || "charity",
        consequence_target: c.goals?.consequence_target || null,
      }));

      setTransactions(formatted);

      // Compute stats
      let stakedSum = 0;
      let savedSum = 0;
      formatted.forEach((item) => {
        stakedSum += item.amount;
        if (item.status === "released_success" || item.status === "refunded") {
          savedSum += item.amount;
        } else if (item.status === "partial") {
          savedSum += item.amount * 0.5;
        }
      });

      setTotalStaked(stakedSum);
      setTotalSaved(savedSum);
    } catch (err) {
      console.error("[Transactions] Failed to load transaction ledger:", err);
    } finally {
      setLoading(false);
    }
  }, [dbUser]);

  useEffect(() => {
    fetchTransactions();
  }, [dbUser?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchTransactions();
    setRefreshing(false);
  };

  const getSuccessRate = () => {
    if (totalStaked === 0) return 100;
    return Math.round((totalSaved / totalStaked) * 100);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.accent.default} />
          <Text style={styles.loadingText}>Loading transaction ledger...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Stitch header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <ChevronLeft color={colors.text.secondary} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.placeholderButton} />
      </View>

      <FlashList
        data={transactions}
        estimatedItemSize={110}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Stitch-style aggregates header card */}
            <Card variant="accent" style={styles.aggregateCard}>
              <Text style={styles.aggLabel}>ATERNA ESCROW SUMMARY</Text>
              <View style={styles.aggStatsGrid}>
                {/* Committed */}
                <View style={styles.aggStatBox}>
                  <HeartPulse size={16} color={colors.text.secondary} style={styles.aggIcon} />
                  <Text style={styles.aggVal}>₹{totalStaked.toLocaleString("en-IN")}</Text>
                  <Text style={styles.aggSub}>Total Staked</Text>
                </View>

                <View style={styles.aggDivider} />

                {/* Returned */}
                <View style={styles.aggStatBox}>
                  <ShieldCheck size={16} color={colors.success.default} style={styles.aggIcon} />
                  <Text style={[styles.aggVal, { color: colors.success.default }]}>
                    ₹{totalSaved.toLocaleString("en-IN")}
                  </Text>
                  <Text style={styles.aggSub}>Stakes Saved</Text>
                </View>

                <View style={styles.aggDivider} />

                {/* Return Ratio */}
                <View style={styles.aggStatBox}>
                  <Percent size={16} color={colors.accent.light} style={styles.aggIcon} />
                  <Text style={[styles.aggVal, { color: colors.accent.light }]}>
                    {getSuccessRate()}%
                  </Text>
                  <Text style={styles.aggSub}>Success Rate</Text>
                </View>
              </View>
            </Card>

            <Text style={styles.listSectionTitle}>RECENT TRANSACTION LEDGER</Text>
          </>
        }
        renderItem={({ item }) => <TransactionItem commitment={item} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <ShieldCheck color={colors.text.tertiary} size={36} />
            </View>
            <Text style={styles.emptyTitle}>No stakes logged yet</Text>
            <Text style={styles.emptyText}>
              Declare your daily goal, stake a commitment hold, and build your consistency streak!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
    paddingTop: Platform.OS === "ios" ? 12 : (StatusBar.currentHeight || 0) + 12,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "500",
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.bg.card,
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
  },
  placeholderButton: {
    width: 36,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
  },
  aggregateCard: {
    marginBottom: 24,
  },
  aggLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1.2,
    marginBottom: 16,
    textAlign: "center",
  },
  aggStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  aggStatBox: {
    flex: 1,
    alignItems: "center",
  },
  aggIcon: {
    marginBottom: 6,
  },
  aggVal: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
  },
  aggSub: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 4,
    fontWeight: "500",
  },
  aggDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: colors.border.default,
  },
  listSectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bg.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
