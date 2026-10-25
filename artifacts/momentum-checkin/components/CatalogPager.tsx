import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function CatalogPager({ page, pages, total, onChange, id }: {
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
  id: string;
}) {
  const colors = useColors();
  return (
    <View style={[s.row, { backgroundColor: colors.secondary }]}>
      <Pressable testID={`${id}-previous`} accessibilityRole="button" accessibilityLabel="上一頁款式" disabled={page <= 1} onPress={() => onChange(page - 1)} style={[s.button, { opacity: page <= 1 ? 0.3 : 1 }]}>
        <Feather name="chevron-left" size={21} color={colors.primary} />
      </Pressable>
      <Text testID={`${id}-status`} style={[s.text, { color: colors.foreground }]}>第 {page} / {pages} 頁 · 共 {total} 款</Text>
      <Pressable testID={`${id}-next`} accessibilityRole="button" accessibilityLabel="下一頁款式" disabled={page >= pages} onPress={() => onChange(page + 1)} style={[s.button, { opacity: page >= pages ? 0.3 : 1 }]}>
        <Feather name="chevron-right" size={21} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, marginVertical: 10 },
  button: { width: 48, height: 44, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 11, fontWeight: '600' },
});
