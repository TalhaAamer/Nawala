import { useCallback, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, useThemedStyles } from '@/theme';

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Explicit snap points (e.g. ['50%']). Defaults to dynamic content sizing. */
  snapPoints?: (string | number)[];
};

/**
 * Theme-aware bottom sheet built on @gorhom/bottom-sheet v5.
 * Requires <BottomSheetModalProvider> in the tree (mounted in the root layout).
 */
export function Sheet({ visible, onClose, title, children, snapPoints }: SheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) ref.current?.present();
    else ref.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const styles = useThemedStyles((t) => ({
    bg: { backgroundColor: t.colors.surface },
    handle: { backgroundColor: t.colors.border, width: 40 },
    content: { paddingHorizontal: t.screenPaddingX, paddingTop: t.spacing.sm, gap: t.spacing.md },
    title: { ...t.typography.titleLg, color: t.colors.textPrimary },
  }));

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      enableDynamicSizing={!snapPoints}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + theme.spacing.lg }]}>
        {title ? (
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

/** A tappable row for use inside sheets (address pickers, filter options, etc.). */
export function SheetRow({ children }: { children: React.ReactNode }) {
  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
      paddingVertical: t.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
  }));
  return <View style={styles.row}>{children}</View>;
}
