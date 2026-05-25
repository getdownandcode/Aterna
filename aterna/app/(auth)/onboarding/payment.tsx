import React, { useState } from "react";
import { View, Text, SafeAreaView, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

type PaymentMethod = "gpay" | "applepay" | "phonepe" | "card";

export default function Payment() {
  const router = useRouter();
  const { user } = useUser();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("gpay");

  // Credit Card state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState(user?.fullName || "");

  // PhonePe state
  const [upiId, setUpiId] = useState("");

  // Native-style overlay modal state
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [sheetProcessing, setSheetProcessing] = useState(false);

  const triggerAuthSheet = () => {
    // Validations before opening sheets
    if (selectedMethod === "card") {
      if (!cardNumber || !expiry || !cvv || !cardName) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Required fields", "Please fill in all credit card details to link your card.");
        return;
      }
    } else if (selectedMethod === "phonepe") {
      if (!upiId || !upiId.includes("@")) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Invalid UPI ID", "Please enter a valid UPI ID (e.g. name@ybl).");
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAuthSheet(true);
  };

  const handleConfirmSheetAuth = () => {
    setSheetProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Simulate payment transaction network request
    setTimeout(async () => {
      try {
        if (user) {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              paymentSetupComplete: true,
              paymentMethod: selectedMethod,
              tier: "pro", // Upgrading unlocks stakes up to $50.00
            },
          });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        let methodLabel = "";
        switch (selectedMethod) {
          case "card": methodLabel = "Credit Card"; break;
          case "gpay": methodLabel = "Google Pay"; break;
          case "phonepe": methodLabel = "PhonePe UPI"; break;
          case "applepay": methodLabel = "Apple Pay"; break;
        }

        setShowAuthSheet(false);
        setSheetProcessing(false);

        Alert.alert(
          "Payment authorized",
          `Your ${methodLabel} has been successfully authorized with Razorpay. Stake holds up to $50.00 are now unlocked!`,
          [{ text: "Continue", onPress: () => router.push("/onboarding/timing") }]
        );
      } catch (err) {
        console.error("Clerk user update failed:", err);
        setShowAuthSheet(false);
        setSheetProcessing(false);
        router.push("/onboarding/timing");
      }
    }, 2000);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/onboarding/timing");
  };

  const paymentOptions: { id: PaymentMethod; title: string; subtitle?: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { id: "gpay", title: "Google Pay", subtitle: "RECOMMENDED", icon: "account-balance-wallet" },
    { id: "applepay", title: "Apple Pay", icon: "phone-iphone" },
    { id: "phonepe", title: "PhonePe UPI", icon: "flash-on" },
    { id: "card", title: "Credit or Debit Card", icon: "credit-card" }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Transactional Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.stepText}>STEP 2 OF 3</Text>
          <View style={styles.spacerHeader} />
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Set up your stake</Text>

        {/* Info Callout Box */}
        <View style={styles.infoCallout}>
          <MaterialIcons name="info" size={20} color={colors.accent.default} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Your stake is only charged if you miss a scheduled habit. It goes directly to a designated anti-charity to enforce ultimate accountability.
          </Text>
        </View>

        {/* Payment Methods selection list */}
        <View style={styles.optionsList}>
          {paymentOptions.map((opt) => {
            const isSelected = selectedMethod === opt.id;
            return (
              <View key={opt.id} style={styles.optionWrapper}>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMethod(opt.id);
                  }}
                >
                  <View style={[
                    styles.methodIconBox,
                    isSelected && styles.methodIconBoxSelected
                  ]}>
                    <MaterialIcons name={opt.icon} size={24} color={isSelected ? colors.accent.default : colors.text.primary} />
                  </View>

                  <View style={styles.optionDetails}>
                    <Text style={styles.optionTitle}>{opt.title}</Text>
                    {opt.subtitle && (
                      <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                    )}
                  </View>

                  <View style={[
                    styles.radioButton,
                    isSelected && styles.radioButtonSelected
                  ]}>
                    {isSelected && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Inline forms for selected states */}
                {isSelected && opt.id === "card" && (
                  <View style={styles.expandedForm}>
                    {/* Digital Card Mockup */}
                    <View style={styles.cardMockup}>
                      <Text style={styles.cardType}>CREDIT CARD</Text>
                      <Text style={styles.cardMockNumber}>
                        {cardNumber ? cardNumber.replace(/(\d{4})/g, "$1 ").trim() : "•••• •••• •••• ••••"}
                      </Text>
                      <View style={styles.cardMockRow}>
                        <View>
                          <Text style={styles.cardLabel}>CARDHOLDER</Text>
                          <Text style={styles.cardVal}>{cardName || "YOUR NAME"}</Text>
                        </View>
                        <View>
                          <Text style={styles.cardLabel}>EXPIRES</Text>
                          <Text style={styles.cardVal}>{expiry || "MM/YY"}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Inputs */}
                    <TextInput
                      style={styles.input}
                      placeholder="Cardholder Name"
                      placeholderTextColor={colors.text.tertiary}
                      value={cardName}
                      onChangeText={setCardName}
                      autoCapitalize="words"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Card Number"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="number-pad"
                      maxLength={16}
                      value={cardNumber}
                      onChangeText={setCardNumber}
                    />
                    <View style={styles.row}>
                      <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="Expiry (MM/YY)"
                        placeholderTextColor={colors.text.tertiary}
                        maxLength={5}
                        value={expiry}
                        onChangeText={(text) => {
                          let formatted = text;
                          if (text.length === 2 && !text.includes("/")) {
                            formatted = text + "/";
                          }
                          setExpiry(formatted);
                        }}
                      />
                      <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="CVV"
                        placeholderTextColor={colors.text.tertiary}
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={3}
                        value={cvv}
                        onChangeText={setCvv}
                      />
                    </View>
                  </View>
                )}

                {isSelected && opt.id === "phonepe" && (
                  <View style={styles.expandedForm}>
                    <Text style={styles.innerLabel}>Enter PhonePe UPI ID:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="UPI ID (e.g. mobile@ybl, name@oksbi)"
                      placeholderTextColor={colors.text.tertiary}
                      value={upiId}
                      onChangeText={setUpiId}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                )}

                {isSelected && opt.id === "gpay" && (
                  <View style={styles.expandedForm}>
                    <Text style={styles.innerDesc}>
                      Google Pay pre-authorizations are handled securely via your Google Account. Holds are released immediately upon habit completion.
                    </Text>
                  </View>
                )}

                {isSelected && opt.id === "applepay" && (
                  <View style={styles.expandedForm}>
                    <Text style={styles.innerDesc}>
                      Confirm holds directly via Touch ID or Face ID with Apple Pay Integration.
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Action Button Section */}
        <View style={styles.footerSection}>
          {/* Progress Indicators */}
          <View style={styles.progressRow}>
            <View style={styles.progressDot} />
            <View style={styles.progressLineActive} />
            <View style={styles.progressDot} />
          </View>

          <Button
            label={
              selectedMethod === "card"
                ? "Link Secure Card"
                : selectedMethod === "gpay"
                ? "Authorize Google Pay"
                : selectedMethod === "phonepe"
                ? "Verify UPI ID & Link"
                : "Pay with Apple Pay"
            }
            onPress={triggerAuthSheet}
          />
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipText}>SKIP FOR NOW</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Simulated Premium Google / Apple Pay Native bottom sheet Modal */}
      <Modal
        visible={showAuthSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!sheetProcessing) setShowAuthSheet(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.sheetContainer,
            selectedMethod === "applepay" ? styles.appleSheetBg : styles.gpaySheetBg
          ]}>
            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              {selectedMethod === "applepay" ? (
                <View style={styles.appleBranding}>
                  <Text style={styles.appleSheetLogo}></Text>
                  <Text style={styles.appleSheetLogoText}>Pay</Text>
                </View>
              ) : selectedMethod === "gpay" ? (
                <View style={styles.gpayBranding}>
                  <Text style={[styles.logoTextG, { fontSize: 22 }]}>G</Text>
                  <Text style={[styles.logoTextPay, { fontSize: 22, color: "#FFFFFF" }]}>Pay</Text>
                </View>
              ) : selectedMethod === "phonepe" ? (
                <Text style={styles.upiSheetLogo}>🟣 PhonePe UPI</Text>
              ) : (
                <Text style={styles.upiSheetLogo}>💳 Secure Authorization</Text>
              )}
              
              {!sheetProcessing && (
                <TouchableOpacity onPress={() => setShowAuthSheet(false)} style={styles.closeSheetButton}>
                  <MaterialIcons name="close" size={22} color={colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Transaction details list */}
            <View style={styles.sheetTransactionDetails}>
              <View style={styles.sheetDetailRow}>
                <Text style={styles.sheetDetailLabel}>MERCHANT</Text>
                <Text style={styles.sheetDetailValue}>Aterna Inc.</Text>
              </View>
              <View style={styles.sheetDetailRow}>
                <Text style={styles.sheetDetailLabel}>CONTRACT HOLD</Text>
                <Text style={styles.sheetDetailValue}>₹1.00 pre-auth hold</Text>
              </View>
              <View style={styles.sheetDetailRow}>
                <Text style={styles.sheetDetailLabel}>ACCOUNT / METHOD</Text>
                <Text style={styles.sheetDetailValue}>
                  {selectedMethod === "card"
                    ? `Visa •••• ${cardNumber.substring(12) || "4242"}`
                    : selectedMethod === "phonepe"
                    ? upiId
                    : `${user?.emailAddresses[0]?.emailAddress || "your.email@gmail.com"}`}
                </Text>
              </View>
            </View>

            {/* Processing State spinner */}
            {sheetProcessing ? (
              <View style={styles.processingWrapper}>
                <ActivityIndicator size="large" color={colors.accent.default} />
                <Text style={styles.processingText}>Contacting Secure Bank Gateway...</Text>
              </View>
            ) : (
              <View style={styles.actionSheetButtonContainer}>
                {selectedMethod === "applepay" ? (
                  <TouchableOpacity 
                    onPress={handleConfirmSheetAuth} 
                    style={styles.appleConfirmBtn}
                  >
                    <MaterialIcons name="fingerprint" size={24} color="#000000" />
                    <Text style={styles.appleConfirmBtnText}>Double Click to Pay with Face ID</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    onPress={handleConfirmSheetAuth} 
                    style={styles.gpayConfirmBtn}
                  >
                    <Text style={styles.gpayConfirmBtnText}>Pay ₹1.00</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  stepText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1.5,
  },
  spacerHeader: {
    width: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  infoCallout: {
    backgroundColor: colors.bg.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent.default,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  optionsList: {
    gap: 12,
    marginBottom: 24,
  },
  optionWrapper: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: "hidden",
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  optionCardSelected: {
    backgroundColor: colors.bg.hover + "20",
  },
  methodIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.input,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  methodIconBoxSelected: {
    backgroundColor: colors.accent.default + "20",
  },
  optionDetails: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  optionSubtitle: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.accent.default,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border.emphasis,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: colors.accent.default,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent.default,
  },
  expandedForm: {
    padding: 16,
    borderTopWidth: 0.5,
    borderTopColor: colors.border.default,
    backgroundColor: colors.bg.base + "40",
  },
  innerLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  innerDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
    textAlign: "center",
    paddingVertical: 8,
  },
  cardMockup: {
    height: 150,
    backgroundColor: colors.accent.surface,
    borderRadius: 12,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.accent.light + "30",
    marginBottom: 16,
  },
  cardType: {
    fontSize: 8,
    fontWeight: "700",
    color: colors.accent.light,
    letterSpacing: 1.5,
  },
  cardMockNumber: {
    fontSize: 16,
    color: colors.text.primary,
    letterSpacing: 2,
    fontWeight: "600",
    textAlign: "center",
  },
  cardMockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardLabel: {
    fontSize: 7,
    color: colors.accent.light,
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardVal: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text.primary,
  },
  input: {
    height: 48,
    backgroundColor: colors.bg.input,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  footerSection: {
    alignItems: "center",
    marginTop: "auto",
    gap: 20,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border.emphasis,
  },
  progressLineActive: {
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.default,
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.secondary,
    letterSpacing: 1.5,
  },

  // Modal Auth Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    width: "100%",
  },
  gpaySheetBg: {
    backgroundColor: "#1E1E24",
    borderWidth: 1,
    borderColor: "#2E2E3A",
  },
  appleSheetBg: {
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#262626",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.default,
    paddingBottom: 16,
  },
  appleBranding: {
    flexDirection: "row",
    alignItems: "center",
  },
  appleSheetLogo: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "600",
    marginRight: 4,
  },
  appleSheetLogoText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  gpayBranding: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoTextG: {
    color: "#4285F4",
    fontSize: 20,
    fontWeight: "bold",
  },
  logoTextPay: {
    color: "#5F6368",
    fontSize: 20,
    fontWeight: "500",
    marginLeft: 2,
  },
  upiSheetLogo: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  closeSheetButton: {
    padding: 4,
  },
  sheetTransactionDetails: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  sheetDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetDetailLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1.2,
  },
  sheetDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  processingWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  processingText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 14,
    fontWeight: "500",
  },
  actionSheetButtonContainer: {
    width: "100%",
  },
  appleConfirmBtn: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  appleConfirmBtnText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "700",
  },
  gpayConfirmBtn: {
    backgroundColor: "#4285F4",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  gpayConfirmBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
