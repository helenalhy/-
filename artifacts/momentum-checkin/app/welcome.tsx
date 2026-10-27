import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Feather } from '@expo/vector-icons';
import { useAuth, useSSO } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';

WebBrowser.maybeCompleteAuthSession();

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useWarmUpBrowser();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/mall');
  }, [isLoaded, isSignedIn, router]);

  const continueAsGuest = useCallback(() => {
    router.replace('/mall');
  }, [router]);

  const signInWithGoogle = useCallback(async () => {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const redirectUrl = Platform.OS === 'web'
        ? AuthSession.makeRedirectUri()
        : AuthSession.makeRedirectUri({
            scheme: 'momentum-checkin',
            path: 'oauth-native-callback',
          });
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      if (!createdSessionId || !setActive) {
        setErrorMessage('Google 登入尚未完成，請確認登入設定後再試一次。');
        return;
      }

      await setActive({ session: createdSessionId });
      router.replace('/mall');
    } catch {
      setErrorMessage('目前無法完成 Google 登入；你仍可先以訪客身分體驗。');
    } finally {
      setIsBusy(false);
    }
  }, [router, startSSOFlow]);

  if (!isLoaded || isSignedIn) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#FFF0F7', '#F6F0FF', '#F0FCF8']} style={styles.hero}>
          <View style={styles.brandRow}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.logo}
              accessibilityLabel="Momentum 我的商場圖示"
            />
            <View>
              <Text style={[styles.brand, { color: colors.foreground }]}>Momentum</Text>
              <Text style={[styles.brandCaption, { color: colors.mutedForeground }]}>我的商場</Text>
            </View>
          </View>
          <View style={styles.mallIllustration}>
            <View style={[styles.cloud, styles.cloudLeft]} />
            <View style={[styles.cloud, styles.cloudRight]} />
            <View style={styles.building}>
              <View style={styles.roof}>
                <Feather name="star" size={15} color="#E8A344" />
                <Text style={styles.roofText}>MALL</Text>
                <Feather name="star" size={15} color="#E8A344" />
              </View>
              <View style={styles.windows}>
                <View style={[styles.window, { backgroundColor: '#FFD8EA' }]} />
                <View style={[styles.window, { backgroundColor: '#DAD1FF' }]} />
                <View style={[styles.window, { backgroundColor: '#C6F0DE' }]} />
              </View>
              <View style={styles.door}>
                <View style={styles.doorPanel} />
                <View style={styles.doorPanel} />
              </View>
            </View>
            <View style={styles.sparkleLeft}><Feather name="heart" size={16} color="#E783AE" /></View>
            <View style={styles.sparkleRight}><Feather name="star" size={16} color="#E9AE55" /></View>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            每天完成一點點，{'\n'}一起打造你的夢想商場
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            完成目標、收集金幣，再把喜歡的商店和裝飾放進自己的商場。
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.benefit}>
            <View style={[styles.benefitIcon, { backgroundColor: '#FFE5F0' }]}>
              <Feather name="check-circle" size={17} color="#D86D9A" />
            </View>
            <Text style={[styles.benefitText, { color: colors.foreground }]}>記錄每個小目標</Text>
          </View>
          <View style={styles.benefit}>
            <View style={[styles.benefitIcon, { backgroundColor: '#FFF1D9' }]}>
              <Feather name="gift" size={17} color="#C88A2F" />
            </View>
            <Text style={[styles.benefitText, { color: colors.foreground }]}>用完成目標所得金幣兌換</Text>
          </View>
          <View style={[styles.benefit, styles.lastBenefit]}>
            <View style={[styles.benefitIcon, { backgroundColor: '#E1F5ED' }]}>
              <Feather name="cloud" size={17} color="#4F9C7B" />
            </View>
            <Text style={[styles.benefitText, { color: colors.foreground }]}>登入後保存你的進度</Text>
          </View>

          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="使用 Google 登入並保存進度"
            disabled={isBusy}
            onPress={signInWithGoogle}
            style={({ pressed }) => [
              styles.googleButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
              isBusy && styles.disabled,
            ]}
          >
            {isBusy ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={[styles.googleButtonText, { color: colors.foreground }]}>使用 Google 登入</Text>
              </>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="先體驗，不登入"
            disabled={isBusy}
            onPress={continueAsGuest}
            style={({ pressed }) => [styles.guestButton, pressed && styles.pressed]}
          >
            <Text style={[styles.guestButtonText, { color: colors.primary }]}>先體驗，不登入</Text>
            <Feather name="arrow-right" size={16} color={colors.primary} />
          </Pressable>
          <Text style={[styles.privacyNote, { color: colors.mutedForeground }]}>
            訪客進度先保存在這台裝置；登入 Google 後可同步至帳戶。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  hero: {
    minHeight: 438,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    paddingHorizontal: 26,
    paddingTop: 18,
    paddingBottom: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 15 },
  brand: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  brandCaption: { fontSize: 11, marginTop: 1 },
  mallIllustration: { width: 270, height: 176, alignItems: 'center', justifyContent: 'flex-end', marginTop: 18, marginBottom: 9 },
  cloud: { position: 'absolute', backgroundColor: '#FFFFFF', opacity: 0.72, borderRadius: 40 },
  cloudLeft: { width: 78, height: 25, top: 24, left: 12 },
  cloudRight: { width: 88, height: 28, top: 43, right: 3 },
  building: {
    width: 202,
    height: 130,
    backgroundColor: '#FFFDFB',
    borderColor: '#E9B8CD',
    borderWidth: 2,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 8,
    shadowColor: '#B9789A',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  roof: { width: '88%', height: 28, borderRadius: 11, backgroundColor: '#FFE1EF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  roofText: { color: '#A94F79', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  windows: { flexDirection: 'row', gap: 8, marginTop: 10 },
  window: { width: 42, height: 37, borderRadius: 8, borderColor: '#E8C5D3', borderWidth: 1 },
  door: { flexDirection: 'row', width: 44, height: 37, backgroundColor: '#E8D9FF', borderTopLeftRadius: 12, borderTopRightRadius: 12, marginTop: 2, padding: 3, gap: 3 },
  doorPanel: { flex: 1, borderRadius: 7, backgroundColor: '#F9F3FF' },
  sparkleLeft: { position: 'absolute', top: 61, left: 29 },
  sparkleRight: { position: 'absolute', top: 79, right: 26 },
  title: { fontSize: 25, fontWeight: '800', lineHeight: 35, textAlign: 'center', letterSpacing: -0.4, marginTop: 5 },
  subtitle: { maxWidth: 330, textAlign: 'center', fontSize: 13, lineHeight: 20, marginTop: 9 },
  content: { paddingHorizontal: 25, paddingTop: 21 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  lastBenefit: { marginBottom: 21 },
  benefitIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  benefitText: { fontSize: 13, fontWeight: '600' },
  errorText: { color: '#B74760', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 12 },
  googleButton: { minHeight: 54, borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11 },
  googleG: { color: '#4285F4', fontSize: 20, fontWeight: '800' },
  googleButtonText: { fontSize: 14, fontWeight: '700' },
  guestButton: { minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 4 },
  guestButtonText: { fontSize: 13, fontWeight: '700' },
  privacyNote: { fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 4 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.6 },
});
