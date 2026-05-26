import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/clerk-expo";
import { colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { goalStore } from "@/lib/goalStore";
import { useUser } from "@/hooks/useUser";
import { createOrder, openCheckoutSheet, verifyAndSaveGoal } from "@/lib/payments";

const CHARITIES = [
  { name: "UNICEF", desc: "Saves and protects vulnerable children worldwide." },
  { name: "WWF", desc: "Protects endangered wildlife and natural habitats." },
  { name: "GiveIndia", desc: "Poverty alleviation and healthcare aid." },
];

export default function Stake() {
  const router = useRouter();
  const { dbUser } = useUser();
  const { getToken } = useAuth();

  const isPro = dbUser?.subscription_tier === "pro" || dbUser?.subscription_tier === "team";
  const maxStake = isPro ? 50 : 5;

  const [stake, setStake] = useState<number>(3); // Default to ₹3
  const [consequenceType, setConsequenceType] = useState<"charity" | "friend_pool" | "self_reward">("charity");
  const [selectedCharity, setSelectedCharity] = useState(CHARITIES[0].name);
  const [friendEmail, setFriendEmail] = useState("");
  const [selfRewardDetail, setSelfRewardDetail] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (consequenceType === "friend_pool" && !friendEmail.trim()) {
      Alert.alert("Friend required", "Please enter your friend's email address.");
      return;
    }
    if (consequenceType === "self_reward" && !selfRewardDetail.trim()) {
      Alert.alert("Reward consequence required", "Please enter the self-reward task (e.g. Clean the kitchen).");
      return;
    }

    setCheckoutLoading(true);

    try {
      const tempGoalId = `temp_goal_${Math.random().toString(36).substring(7)}`;

      // Step 1: Create Authorized Order on Edge Function
      const orderRes = await createOrder(stake, tempGoalId, getToken);
      if (!orderRes.success || !orderRes.orderId || !orderRes.amountPaise || !orderRes.keyId) {
        Alert.alert("Payment Error", orderRes.error || "Could not initialize secure hold transaction.");
        setCheckoutLoading(false);
        return;
      }

      // Step 2: Open Razorpay native checkout sheet
      const userDetails = {
        email: dbUser?.email || "user@aterna.app",
        displayName: dbUser?.display_name || "Aterna Member",
      };

      const originalGoalText = goalStore.get().rawText || "My Daily accountability contract";

      const checkoutRes = await openCheckoutSheet(
        {
          orderId: orderRes.orderId,
          amountPaise: orderRes.amountPaise,
          keyId: orderRes.keyId,
        },
        userDetails,
        originalGoalText
      );

      if (!checkoutRes.success) {
        if (checkoutRes.error === "PAYMENT_CANCELLED") {
          Alert.alert("Payment Cancelled", "Payment authorization was cancelled. Your goal has not been saved.");
        } else {
          Alert.alert("Payment Failed", checkoutRes.error || "Checkout sheet encountered a loading error.");
        }
        setCheckoutLoading(false);
        return;
      }

      // Step 3: Verify Signature & Save Goal securely
      let target = "";
      if (consequenceType === "charity") target = selectedCharity;
      else if (consequenceType === "friend_pool") target = friendEmail;
      else target = selfRewardDetail;

      const localDate = new Date().toISOString().split("T")[0];

      const goalData = {
        rawText: goalStore.get().rawText,
        smartText: goalStore.get().smartText || goalStore.get().rawText,
        category: goalStore.get().category,
        stakeAmount: stake,
        consequenceType: consequenceType,
        consequenceTarget: target,
        goalDate: localDate,
      };

      const verifyRes = await verifyAndSaveGoal(
        {
          paymentId: checkoutRes.paymentId!,
          orderId: checkoutRes.orderId!,
          signature: checkoutRes.signature!,
        },
        goalData,
        getToken
      );

      if (!verifyRes.success || !verifyRes.goalId) {
        Alert.alert(
          "Verification Error",
          verifyRes.error || "Cryptographic verification failed. Your card has not been billed. Please contact support."
        );
        setCheckoutLoading(false);
        return;
      }

      // Cache state in global goalStore
      goalStore.set({
        stakeAmount: stake,
        consequenceType: consequenceType,
        consequenceTarget: target,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCheckoutLoading(false);

      // Navigate directly to confirm with the successfully verified goalId
      router.push({
        pathname: "/goal/confirm",
        params: { goalId: verifyRes.goalId },
      });
    } catch (err) {
      console.error("[Stake] Payments sheet integration crashed:", err);
      Alert.alert("Checkout Error", "An unexpected error occurred during payment processing.");
      setCheckoutLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.topHeaderBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.topBackButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <ChevronLeft color={colors.text.secondary} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.step}>Step 3 of 4</Text>
        <Text style={styles.title}>Commit your stake</Text>
        <Text style={styles.subtitle}>
          Put real money on the line. If you complete your goal, you get it back. If you fail, it goes to your consequence.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stake Slider Card */}
        <View style={styles.sliderCard}>
          <Text style={styles.cardLabel}>DECLARE YOUR STAKE</Text>
          <Text style={styles.stakeAmount}>₹{stake.toLocaleString("en-IN")}</Text>

          {/* Simple Dynamic Custom Slider Row */}
          <View style={styles.sliderWrapper}>
            {[1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50].map((val) => {
              const disabled = val > maxStake;
              const isSelected = stake === val;

              return (
                <TouchableOpacity
                  key={val}
                  disabled={disabled}
                  style={[
                    styles.stakePill,
                    isSelected && styles.stakePillSelected,
                    disabled && styles.stakePillDisabled,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStake(val);
                  }}
                >
                  <Text
                    style={[
                      styles.stakePillText,
                      isSelected && styles.stakePillTextSelected,
                      disabled && styles.stakePillTextDisabled,
                    ]}
                  >
                    ₹{val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!isPro && (
            <View style={styles.proBanner}>
              <Text style={styles.proText}>
                💡 **Free tier** is capped at **₹5.00** max. Upgrade to **Aterna Pro** in Settings to stake up to **₹50.00**!
              </Text>
            </View>
          )}
        </View>

        {/* Consequence Selector */}
        <Text style={styles.sectionTitle}>Where does your stake go if you fail?</Text>
        <View style={styles.typeRow}>
          {(["charity", "friend_pool", "self_reward"] as const).map((type) => {
            const isSelected = consequenceType === type;
            const label = type === "charity" ? "Charity" : type === "friend_pool" ? "Friend Pool" : "Self Consequence";
            const emoji = type === "charity" ? "🏫" : type === "friend_pool" ? "👥" : "🛠️";

            return (
              <TouchableOpacity
                key={type}
                activeOpacity={0.8}
                style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setConsequenceType(type);
                }}
              >
                <Text style={styles.typeEmoji}>{emoji}</Text>
                <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic Fields */}
        <View style={styles.inputArea}>
          {consequenceType === "charity" && (
            <View style={styles.charityList}>
              {CHARITIES.map((charity) => {
                const isSelected = selectedCharity === charity.name;
                return (
                  <TouchableOpacity
                    key={charity.name}
                    activeOpacity={0.8}
                    style={[
                      styles.charityItem,
                      isSelected && styles.charityItemSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCharity(charity.name);
                    }}
                  >
                    <View style={styles.radioOutline}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.charityText}>
                      <Text style={[styles.charityName, isSelected && styles.charityNameSelected]}>
                        {charity.name}
                      </Text>
                      <Text style={styles.charityDesc}>{charity.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {consequenceType === "friend_pool" && (
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>FRIEND&apos;S EMAIL ADDRESS</Text>
              <TextInput
                style={styles.textInput}
                placeholder="friend@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.text.tertiary}
                value={friendEmail}
                onChangeText={setFriendEmail}
              />
              <Text style={styles.fieldHint}>
                We will email your partner a claim code to receive your stake if you fail check-in.
              </Text>
            </View>
          )}

          {consequenceType === "self_reward" && (
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>WHAT PHYSICAL TASK WILL YOU FORCE YOURSELF TO DO?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="E.g., Clean the garage or do 100 pushups."
                placeholderTextColor={colors.text.tertiary}
                value={selfRewardDetail}
                onChangeText={setSelfRewardDetail}
              />
              <Text style={styles.fieldHint}>
                A tough task that you will declare in the feed if you miss check-in.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={checkoutLoading ? "Processing payment hold..." : `Lock In ₹${stake.toFixed(0)} Stake`}
          onPress={handleNext}
          disabled={checkoutLoading}
        />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
    paddingTop: Platform.OS === "ios" ? 12 : (StatusBar.currentHeight || 0) + 12,
  },
  topHeaderBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 0,
  },
  topBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  header: {
    padding: 24,
    paddingBottom: 8,
  },
  step: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accent.default,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  sliderCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  stakeAmount: {
    fontSize: 48,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 16,
  },
  sliderWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  stakePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.bg.base,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  stakePillSelected: {
    borderColor: colors.accent.default,
    backgroundColor: colors.accent.default + "20",
  },
  stakePillDisabled: {
    opacity: 0.25,
  },
  stakePillText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  stakePillTextSelected: {
    color: colors.accent.default,
  },
  stakePillTextDisabled: {
    color: colors.text.tertiary,
  },
  proBanner: {
    backgroundColor: colors.border.emphasis + "10",
    borderRadius: 8,
    padding: 10,
    width: "100%",
  },
  proText: {
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: "center",
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  typeCardSelected: {
    borderColor: colors.accent.default,
    backgroundColor: colors.accent.default + "10",
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.secondary,
  },
  typeLabelSelected: {
    color: colors.accent.default,
    fontWeight: "600",
  },
  inputArea: {
    marginTop: 8,
  },
  charityList: {
    gap: 10,
  },
  charityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  charityItemSelected: {
    borderColor: colors.accent.default,
  },
  radioOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.emphasis,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent.default,
  },
  charityText: {
    flex: 1,
  },
  charityName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  charityNameSelected: {
    color: colors.text.primary,
  },
  charityDesc: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  fieldBox: {
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.bg.base,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text.primary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  fieldHint: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 8,
    lineHeight: 16,
  },
  footer: {
    padding: 24,
    gap: 12,
    paddingBottom: 40,
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  backButtonText: {
    color: colors.text.tertiary,
    fontSize: 13,
    fontWeight: "500",
  },
});
