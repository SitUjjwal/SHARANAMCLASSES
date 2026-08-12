/**
 * Static legal / about copy (Privacy, Terms). Language follows Settings.
 */
import type { AppLanguage } from '@/modules/settings/store/settingsStore';

export type LegalDocId = 'privacy' | 'terms';

const PRIVACY_EN = `Privacy Policy — SHARANAM CLASSES

Last updated: August 2026

We collect account details (name, email, phone, class, medium), learning activity (courses, tests, video progress), and device push tokens to deliver the app.

Data is stored on Supabase and related cloud services (e.g. Cloudflare R2 for files). We do not sell your personal information.

You may request account deletion by contacting support. Push notifications can be disabled in Settings → Notification Preferences.

For questions: sharanam.sp@gmail.com`;

const PRIVACY_HI = `गोपनीयता नीति — शरणम् क्लासेस

अंतिम अद्यतन: अगस्त 2026

हम खाता विवरण (नाम, ईमेल, फोन, कक्षा, माध्यम), अध्ययन गतिविधि और डिवाइस पुश टोकन एकत्र करते हैं ताकि ऐप सेवाएँ दी जा सकें।

डेटा Supabase और संबंधित क्लाउड सेवाओं में सुरक्षित रखा जाता है। हम आपकी व्यक्तिगत जानकारी नहीं बेचते।

सेटिंग्स → सूचना प्राथमिकताएँ में पुश बंद कर सकते हैं।

संपर्क: sharanam.sp@gmail.com`;

const TERMS_EN = `Terms of Use — SHARANAM CLASSES

By using this app you agree to use course content for personal learning only. Accounts are personal and non-transferable.

Purchased courses remain available per enrollment rules. Certificates are issued after course completion and admin approval.

We may update these terms; continued use means you accept the latest version.

Contact: sharanam.sp@gmail.com`;

const TERMS_HI = `उपयोग की शर्तें — शरणम् क्लासेस

इस ऐप का उपयोग करके आप सहमत होते हैं कि पाठ्य सामग्री केवल व्यक्तिगत अध्ययन के लिए है। खाते व्यक्तिगत हैं।

खरीदे गए पाठ्यक्रम नामांकन नियमों के अनुसार उपलब्ध रहते हैं। प्रमाणपत्र पाठ्यक्रम पूर्णता और व्यवस्थापक अनुमोदन के बाद जारी होते हैं।

संपर्क: sharanam.sp@gmail.com`;

export function getLegalDocument(
  id: LegalDocId,
  language: AppLanguage,
): { title: string; body: string } {
  if (id === 'privacy') {
    return {
      title: language === 'hi' ? 'गोपनीयता नीति' : 'Privacy Policy',
      body: language === 'hi' ? PRIVACY_HI : PRIVACY_EN,
    };
  }
  return {
    title: language === 'hi' ? 'उपयोग की शर्तें' : 'Terms of Use',
    body: language === 'hi' ? TERMS_HI : TERMS_EN,
  };
}

export const ABOUT_EN = `SHARANAM CLASSES is a Bihar Board learning platform with live classes, notes, tests, and smart learning.

Courses, live sessions, PDFs, and certificates — built for Bihar Board students.`;

export const ABOUT_HI = `शरणम् क्लासेस बिहार बोर्ड लर्निंग प्लेटफ़ॉर्म है — लाइव क्लास, नोट्स, टेस्ट और स्मार्ट लर्निंग।

कोर्स, लाइव सत्र, PDF और प्रमाणपत्र — बिहार बोर्ड छात्रों के लिए।`;
