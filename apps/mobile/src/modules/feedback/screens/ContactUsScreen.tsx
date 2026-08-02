/**
 * ContactUsScreen — public contact channels; opens external apps safely.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import { ContactLinkRow } from '@/modules/feedback/components/ContactLinkRow';
import { APP_NAME, CONTACT_INFO } from '@/constants';
import type { AppStackParamList } from '@/types/navigation';
import {
  openEmail,
  openGoogleMaps,
  openHttps,
  openPhone,
  openWebsite,
  openWhatsApp,
} from '@/utils/openExternal';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'ContactUs'>;

export function ContactUsScreen({ navigation }: Props) {
  const theme = useAppTheme();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>Contact us</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Reach {APP_NAME} by email, phone, WhatsApp, or social channels. Links open
          in the matching app when installed.
        </Text>

        <Text style={[styles.section, { color: theme.textSecondary }]}>Direct</Text>
        <View style={styles.list}>
          <ContactLinkRow
            icon="mail-outline"
            iconColor="#5C6BC0"
            label="Email"
            value={CONTACT_INFO.email}
            onPress={() => {
              void openEmail(CONTACT_INFO.email, `${APP_NAME} support`);
            }}
          />
          <ContactLinkRow
            icon="call-outline"
            iconColor="#2E7D32"
            label="Phone"
            value={CONTACT_INFO.phoneDisplay}
            onPress={() => {
              void openPhone(CONTACT_INFO.phoneE164);
            }}
          />
          <ContactLinkRow
            icon="logo-whatsapp"
            iconColor="#25D366"
            label="WhatsApp"
            value={`+${CONTACT_INFO.whatsappE164}`}
            onPress={() => {
              void openWhatsApp(CONTACT_INFO.whatsappE164);
            }}
          />
          <ContactLinkRow
            icon="globe-outline"
            iconColor="#0288D1"
            label="Website"
            value={CONTACT_INFO.website.replace(/^https?:\/\//, '')}
            onPress={() => {
              void openWebsite(CONTACT_INFO.website);
            }}
          />
        </View>

        <Text style={[styles.section, { color: theme.textSecondary }]}>Social</Text>
        <View style={styles.list}>
          <ContactLinkRow
            icon="logo-facebook"
            iconColor="#1877F2"
            label="Facebook"
            value="facebook.com/sharanamclasses"
            onPress={() => {
              void openHttps(CONTACT_INFO.facebook, 'Could not open Facebook.');
            }}
          />
          <ContactLinkRow
            icon="logo-instagram"
            iconColor="#E4405F"
            label="Instagram"
            value="instagram.com/sharanamclasses"
            onPress={() => {
              void openHttps(CONTACT_INFO.instagram, 'Could not open Instagram.');
            }}
          />
          <ContactLinkRow
            icon="logo-youtube"
            iconColor="#FF0000"
            label="YouTube"
            value="youtube.com/@sharanamclasses"
            onPress={() => {
              void openHttps(CONTACT_INFO.youtube, 'Could not open YouTube.');
            }}
          />
        </View>

        <Text style={[styles.section, { color: theme.textSecondary }]}>Location</Text>
        <View style={styles.list}>
          <ContactLinkRow
            icon="map-outline"
            iconColor="#C62828"
            label="Google Maps"
            value={CONTACT_INFO.mapsLabel}
            onPress={() => {
              void openGoogleMaps({
                httpsUrl: CONTACT_INFO.mapsUrl,
                queryLabel: CONTACT_INFO.mapsLabel,
              });
            }}
          />
        </View>

        <AppButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    gap: spacing.sm,
  },
});
