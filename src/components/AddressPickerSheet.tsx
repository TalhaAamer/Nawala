import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";

import { useTheme, useThemedStyles } from "@/theme";
import { upsertAddress } from "@/services/storage/addresses";
import type { Address } from "@/types";
import { Button } from "./Button";
import { PressableScale } from "./PressableScale";
import { SheetRow } from "./Sheet";

export type AddressPickerSheetProps = {
  visible: boolean;
  addresses: Address[];
  selectedAddressId: string | null;
  onClose: () => void;
  onSelect: (address: Address) => void;
  onAddressesChange: (addresses: Address[]) => void;
};

type AddressDraft = Pick<Address, "label" | "line1" | "city" | "state" | "zip">;

const EMPTY_DRAFT: AddressDraft = {
  label: "",
  line1: "",
  city: "",
  state: "",
  zip: "",
};

export function AddressPickerSheet({
  visible,
  addresses,
  selectedAddressId,
  onClose,
  onSelect,
  onAddressesChange,
}: AddressPickerSheetProps) {
  const { theme } = useTheme();
  const styles = useStyles();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<AddressDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setDraft(EMPTY_DRAFT);
    setAdding(false);
  };

  const closePicker = () => {
    resetForm();
    onClose();
  };

  const save = async () => {
    if (saving || Object.values(draft).some((value) => !value.trim())) return;
    setSaving(true);
    const address: Address = { id: `addr_${Date.now()}`, ...draft };
    const next = await upsertAddress(address);
    onAddressesChange(next);
    onSelect(address);
    setSaving(false);
    resetForm();
    onClose();
  };

  const updateDraft = (key: keyof AddressDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={closePicker}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalRoot}
      >
        <PressableScale
          onPress={closePicker}
          style={styles.backdrop}
          accessibilityLabel="Close address picker"
          noAnimation
        />
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.title}>
              {adding ? "Add a new address" : "Deliver to"}
            </Text>
            <PressableScale
              onPress={closePicker}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.closeButton}
              noAnimation
            >
              <Ionicons
                name="close"
                size={22}
                color={theme.colors.textPrimary}
              />
            </PressableScale>
          </View>
          {adding ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.form}
            >
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: 37.7749,
                  longitude: -122.4194,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                }}
                accessibilityLabel="Choose a delivery location on the map"
              >
                <Marker
                  coordinate={{ latitude: 37.7749, longitude: -122.4194 }}
                  title="Delivery location"
                />
              </MapView>
              <Text style={styles.mapNote}>
                Confirm the address details below. Map pin selection will be
                available when geocoding is connected.
              </Text>
              <AddressField
                label="Label"
                value={draft.label}
                placeholder="Home, work, or another name"
                onChangeText={(value) => updateDraft("label", value)}
              />
              <AddressField
                label="Street address"
                value={draft.line1}
                placeholder="123 Market St, Apt 5B"
                onChangeText={(value) => updateDraft("line1", value)}
              />
              <AddressField
                label="City"
                value={draft.city}
                placeholder="San Francisco"
                onChangeText={(value) => updateDraft("city", value)}
              />
              <View style={styles.splitFields}>
                <AddressField
                  label="State"
                  value={draft.state}
                  placeholder="CA"
                  onChangeText={(value) => updateDraft("state", value)}
                  containerStyle={styles.splitField}
                />
                <AddressField
                  label="ZIP code"
                  value={draft.zip}
                  placeholder="94103"
                  onChangeText={(value) => updateDraft("zip", value)}
                  keyboardType="number-pad"
                  containerStyle={styles.splitField}
                />
              </View>
              <Button
                label="Save address"
                icon="checkmark"
                loading={saving}
                disabled={Object.values(draft).some((value) => !value.trim())}
                onPress={save}
              />
              <Button label="Cancel" variant="ghost" onPress={resetForm} />
            </ScrollView>
          ) : (
            <>
              <ScrollView contentContainerStyle={styles.list}>
                {addresses.map((address) => {
                  const selected = address.id === selectedAddressId;
                  return (
                    <SheetRow key={address.id}>
                      <PressableScale
                        onPress={() => {
                          onSelect(address);
                          onClose();
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${address.label}, ${address.line1}, ${address.city}`}
                        style={styles.choiceRow}
                        noAnimation
                      >
                        <Ionicons
                          name="location-outline"
                          size={22}
                          color={
                            selected
                              ? theme.colors.accent
                              : theme.colors.textSecondary
                          }
                        />
                        <View style={styles.addressCopy}>
                          <Text style={styles.label}>{address.label}</Text>
                          <Text style={styles.detail}>
                            {address.line1}, {address.city}, {address.state}{" "}
                            {address.zip}
                          </Text>
                        </View>
                        <Ionicons
                          name={
                            selected ? "checkmark-circle" : "ellipse-outline"
                          }
                          size={22}
                          color={
                            selected
                              ? theme.colors.accent
                              : theme.colors.textTertiary
                          }
                        />
                      </PressableScale>
                    </SheetRow>
                  );
                })}
              </ScrollView>
              <Button
                label="Add a new address"
                icon="add"
                variant="secondary"
                onPress={() => setAdding(true)}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AddressField({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType,
  containerStyle,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "number-pad";
  containerStyle?: object;
}) {
  const { theme } = useTheme();
  const styles = useStyles();
  return (
    <View style={containerStyle}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        keyboardType={keyboardType}
        style={styles.input}
        accessibilityLabel={label}
        autoCapitalize="words"
      />
    </View>
  );
}

function useStyles() {
  return useThemedStyles((t) => ({
    modalRoot: { flex: 1, justifyContent: "flex-end" as const },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: t.colors.overlay },
    panel: {
      maxHeight: "92%",
      backgroundColor: t.colors.surface,
      borderTopLeftRadius: t.radii.xl,
      borderTopRightRadius: t.radii.xl,
      padding: t.spacing.lg,
      gap: t.spacing.md,
    },
    panelHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    title: { ...t.typography.titleLg, color: t.colors.textPrimary },
    closeButton: {
      width: t.minHitTarget,
      height: t.minHitTarget,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    map: { height: 180, borderRadius: t.radii.md },
    mapNote: { ...t.typography.meta, color: t.colors.textSecondary },
    list: { gap: t.spacing.xs },
    form: { gap: t.spacing.md, paddingBottom: t.spacing.sm },
    choiceRow: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: t.spacing.md,
    },
    addressCopy: { flex: 1, gap: t.spacing.xs },
    label: { ...t.typography.title, color: t.colors.textPrimary },
    detail: { ...t.typography.meta, color: t.colors.textSecondary },
    splitFields: { flexDirection: "row" as const, gap: t.spacing.md },
    splitField: { flex: 1 },
    fieldLabel: {
      ...t.typography.meta,
      color: t.colors.textSecondary,
      marginBottom: t.spacing.xs,
    },
    input: {
      ...t.typography.body,
      color: t.colors.textPrimary,
      backgroundColor: t.colors.bgMuted,
      borderRadius: t.radii.md,
      paddingHorizontal: t.spacing.md,
      minHeight: 48,
    },
  }));
}
