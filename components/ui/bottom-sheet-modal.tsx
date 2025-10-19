import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  type LayoutChangeEvent,
} from "react-native";
import RNModal from "react-native/Libraries/Modal/Modal";

const DEFAULT_HEIGHT = 360;

type BottomSheetModalProps = {
  visible: boolean;
  onClose?: () => void;
  children: ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
  backdropStyle?: StyleProp<ViewStyle>;
  handleStyle?: StyleProp<ViewStyle>;
  showHandle?: boolean;
  dismissOnBackdropPress?: boolean;
  testID?: string;
};

export const BottomSheetModal = ({
  visible,
  onClose,
  children,
  sheetStyle,
  backdropStyle,
  handleStyle,
  showHandle = true,
  dismissOnBackdropPress = true,
  testID,
}: BottomSheetModalProps) => {
  const [isMounted, setIsMounted] = useState<boolean>(visible);
  const translateY = useRef(new Animated.Value(DEFAULT_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const sheetHeightRef = useRef(DEFAULT_HEIGHT);
  const hasAnimatedInRef = useRef(false);
  const closingRef = useRef(false);

  const animateIn = useCallback(() => {
    const height = sheetHeightRef.current || DEFAULT_HEIGHT;
    translateY.setValue(height + 40);
    overlayOpacity.setValue(1); // display backdrop immediately
    Animated.spring(translateY, {
      toValue: 0,
      damping: 18,
      stiffness: 220,
      mass: 0.9,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
      closingRef.current = false;
      hasAnimatedInRef.current = true;
    });
  }, [overlayOpacity, translateY]);

  const animateOut = useCallback(
    (onFinished?: () => void) => {
      if (closingRef.current) {
        return;
      }
      closingRef.current = true;
      hasAnimatedInRef.current = false;
      const height = sheetHeightRef.current || DEFAULT_HEIGHT;
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 60,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        overlayOpacity.setValue(0);
        translateY.setValue(height + 60);
        closingRef.current = false;
        setIsMounted(false);
        onFinished?.();
      });
    },
    [overlayOpacity, translateY]
  );

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
    } else if (isMounted) {
      animateOut();
    }
  }, [animateOut, isMounted, visible]);

  useEffect(() => {
    if (!isMounted || !visible) {
      return;
    }
    if (hasAnimatedInRef.current) {
      return;
    }
    if (sheetHeightRef.current > 0) {
      animateIn();
    }
  }, [animateIn, isMounted, visible]);

  const handleSheetLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      if (height > 0) {
        sheetHeightRef.current = height;
        if (visible && isMounted && !hasAnimatedInRef.current) {
          animateIn();
        }
      }
    },
    [animateIn, isMounted, visible]
  );

  const requestClose = useCallback(() => {
    if (closingRef.current) {
      return;
    }
    onClose?.();
    animateOut();
  }, [animateOut, onClose]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => {
          if (closingRef.current) return false;
          const { dy, dx } = gesture;
          if (dy < 0) return false;
          if (Math.abs(dy) < Math.abs(dx)) return false;
          return dy > 12;
        },
        onPanResponderMove: (_, gesture) => {
          const height = sheetHeightRef.current || DEFAULT_HEIGHT;
          const dy = Math.max(0, gesture.dy);
          translateY.setValue(dy);
          const progress = Math.min(1, dy / height);
          overlayOpacity.setValue(Math.max(0, 1 - progress * 0.85));
        },
        onPanResponderRelease: (_, gesture) => {
          const height = sheetHeightRef.current || DEFAULT_HEIGHT;
          const dy = Math.max(0, gesture.dy);
          const velocity = gesture.vy ?? 0;
          const shouldDismiss = dy > height * 0.25 || velocity > 1.2;
          if (shouldDismiss) {
            requestClose();
          } else {
            Animated.parallel([
              Animated.spring(translateY, {
                toValue: 0,
                damping: 18,
                stiffness: 220,
                mass: 0.9,
                useNativeDriver: true,
              }),
              Animated.timing(overlayOpacity, {
                toValue: 1,
                duration: 80,
                useNativeDriver: true,
              }),
            ]).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              damping: 18,
              stiffness: 220,
              mass: 0.9,
              useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 1,
              duration: 80,
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    [overlayOpacity, requestClose, translateY]
  );

  if (!isMounted) {
    return null;
  }

  return (
    <RNModal
      transparent
      animationType="none"
      visible={isMounted}
      onRequestClose={requestClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          backdropStyle,
          { opacity: overlayOpacity },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissOnBackdropPress ? requestClose : undefined}
          accessibilityRole="button"
        />
        <Animated.View
          testID={testID}
          style={[
            styles.sheet,
            sheetStyle,
            { transform: [{ translateY }] },
          ]}
          onLayout={handleSheetLayout}
          {...panResponder.panHandlers}
        >
          {showHandle ? (
            <View style={[styles.handle, handleStyle]} />
          ) : null}
          {children}
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 24, 39, 0.35)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: "85%",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
    elevation: 12,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    alignSelf: "center",
    marginBottom: 12,
  },
});
