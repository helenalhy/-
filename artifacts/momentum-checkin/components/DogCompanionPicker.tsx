import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { DOG_STAFF_PROFILES } from '@/constants/dog-staff-customization';
import { DogAttendant, type DogAttendantKind } from '@/components/DogAttendant';

export const DEFAULT_DOG_COMPANION_ID = DOG_STAFF_PROFILES[0].key;

function CompanionSprite({
  kind,
  celebrating,
  reduceMotion,
}: {
  kind: DogAttendantKind;
  celebrating: boolean;
  reduceMotion: boolean | null;
}) {
  const bob = useRef(new Animated.Value(0)).current;
  const cheer = useRef(new Animated.Value(1)).current;
  const nativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (reduceMotion !== false || celebrating) return undefined;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 560, useNativeDriver: nativeDriver }),
        Animated.timing(bob, { toValue: 0, duration: 560, useNativeDriver: nativeDriver }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [bob, celebrating, nativeDriver, reduceMotion]);

  useEffect(() => {
    if (reduceMotion !== false || !celebrating) return undefined;
    cheer.setValue(1);
    const animation = Animated.sequence([
      Animated.timing(cheer, { toValue: 1.18, duration: 180, useNativeDriver: nativeDriver }),
      Animated.timing(cheer, { toValue: 1, duration: 180, useNativeDriver: nativeDriver }),
      Animated.timing(cheer, { toValue: 1.12, duration: 180, useNativeDriver: nativeDriver }),
      Animated.timing(cheer, { toValue: 1, duration: 180, useNativeDriver: nativeDriver }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [celebrating, cheer, nativeDriver, reduceMotion]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  return (
    <Animated.View
      style={[
        styles.sprite,
        reduceMotion === false && !celebrating ? { transform: [{ translateY }] } : null,
        celebrating ? { transform: [{ scale: cheer }] } : null,
      ]}
    >
      <DogAttendant kind={kind} happy={celebrating} />
    </Animated.View>
  );
}

export function DogCompanionPicker({
  selectedDogId,
  onSelect,
  celebrating = false,
  reduceMotion,
}: {
  selectedDogId: string;
  onSelect: (dogId: string) => void;
  celebrating?: boolean;
  reduceMotion: boolean | null;
}) {
  const colors = useColors();
  const selectedDog = DOG_STAFF_PROFILES.find((dog) => dog.key === selectedDogId)
    ?? DOG_STAFF_PROFILES[0];

  return (
    <View style={[styles.card, { backgroundColor: colors.secondary }]}>
      <View style={styles.selectedRow}>
        <View style={[styles.selectedSprite, { backgroundColor: colors.card }]}>
          <CompanionSprite
            kind={selectedDog.kind as DogAttendantKind}
            celebrating={celebrating}
            reduceMotion={reduceMotion}
          />
          {celebrating ? (
            <View style={[styles.sparkle, { backgroundColor: colors.candyLemon }]}>
              <Feather name="star" size={11} color={colors.candyCaramelDark} />
            </View>
          ) : null}
        </View>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            {celebrating ? `${selectedDog.name} 為你開心` : `陪伴狗狗 · ${selectedDog.name}`}
          </Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {celebrating ? '完成一小步也值得慶祝。' : '選一位陪你倒數或完成第一步。'}
          </Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.choices}
        accessibilityLabel="選擇陪伴狗狗"
      >
        {DOG_STAFF_PROFILES.map((dog) => {
          const selected = dog.key === selectedDog.key;
          return (
            <Pressable
              key={dog.key}
              onPress={() => onSelect(dog.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${dog.name}陪伴狗狗`}
              testID={`companion-dog-${dog.key}`}
              style={[
                styles.choice,
                {
                  backgroundColor: selected ? colors.card : 'transparent',
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <DogAttendant kind={dog.kind as DogAttendantKind} />
              <Text style={[styles.name, { color: selected ? colors.primary : colors.foreground }]}>
                {dog.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>
        陪伴狗狗免費使用，不會改變商場店員或金幣資料。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 17, padding: 11, marginTop: 15 },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedSprite: { width: 62, height: 56, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sprite: { alignItems: 'center', justifyContent: 'center' },
  sparkle: { position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 12, fontWeight: '700' },
  description: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  choices: { gap: 7, paddingTop: 10, paddingBottom: 2 },
  choice: { width: 58, minHeight: 69, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  name: { fontSize: 9, fontWeight: '600', marginTop: 2 },
  note: { fontSize: 9, lineHeight: 13, marginTop: 5 },
});
