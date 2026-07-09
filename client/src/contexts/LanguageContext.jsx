import { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    // Profile Onboarding
    welcome_heading: "Welcome to SakhiCredit",
    welcome_subheading: "Where your daily habits build your financial future.",
    get_started: "Get Started",
    step_name: "What should we call you?",
    step_name_placeholder: "Enter your first name",
    step_occupation: "What type of work do you do?",
    step_shg: "Are you part of a Self-Help Group (SHG)?",
    step_language: "Choose your preferred language",
    next: "Next",
    create_profile: "Create Profile",
    creating: "Creating...",
    yes: "Yes",
    no: "No",
    
    // Occupations
    occ_tailoring: "Tailoring",
    occ_beauty: "Beauty / Salon",
    occ_food: "Food / Tiffin Service",
    occ_handicrafts: "Handicrafts",
    occ_shg: "SHG Member",
    occ_other: "Other",

    // Dashboard Tabs
    tab_home: "Home",
    tab_score: "My Score",
    tab_learn: "Learn",
    tab_matches: "Loan Matches",
    tab_group: "My Group",
    tab_griha: "Griha",
    
    // Griha Hub
    griha_title: "Griha Hub",
    griha_desc: "Track household bills and income to boost your SakhiScore.",
    bills_due: "Bills Due",
    income_logged: "Income Logged",
    tasks_pending: "Tasks Pending",
    add_bill: "Add Bill",
    mark_paid: "Mark Paid",
    
    // General
    good_morning: "Good morning",
    good_afternoon: "Good afternoon",
    good_evening: "Good evening",
    switch_user: "Switch User",
    loading: "Loading your dashboard...",
    error_loading: "Error loading profile."
  },
  hi: {
    welcome_heading: "सखी-क्रेडिट में आपका स्वागत है",
    welcome_subheading: "जहाँ आपकी रोज़मर्रा की आदतें आपका वित्तीय भविष्य बनाती हैं।",
    get_started: "शुरू करें",
    step_name: "हम आपको किस नाम से बुलाएं?",
    step_name_placeholder: "अपना पहला नाम दर्ज करें",
    step_occupation: "आप किस प्रकार का काम करती हैं?",
    step_shg: "क्या आप किसी स्वयं सहायता समूह (SHG) का हिस्सा हैं?",
    step_language: "अपनी पसंदीदा भाषा चुनें",
    next: "अगला",
    create_profile: "प्रोफ़ाइल बनाएं",
    creating: "बनाया जा रहा है...",
    yes: "हाँ",
    no: "नहीं",

    occ_tailoring: "सिलाई",
    occ_beauty: "ब्यूटी / पार्लर",
    occ_food: "खाना / टिफिन सेवा",
    occ_handicrafts: "हस्तशिल्प",
    occ_shg: "SHG सदस्य",
    occ_other: "अन्य",

    tab_home: "होम",
    tab_score: "मेरा स्कोर",
    tab_learn: "सीखें",
    tab_matches: "लोन विकल्प",
    tab_group: "मेरा समूह",
    tab_griha: "गृह",
    
    griha_title: "गृह हब",
    griha_desc: "अपना सखीस्कोर बढ़ाने के लिए बिल और आय ट्रैक करें।",
    bills_due: "बकाया बिल",
    income_logged: "दर्ज की गई आय",
    tasks_pending: "लंबित कार्य",
    add_bill: "बिल जोड़ें",
    mark_paid: "भुगतान हो गया",
    
    good_morning: "सुप्रभात",
    good_afternoon: "शुभ दोपहर",
    good_evening: "शुभ संध्या",
    switch_user: "उपयोगकर्ता बदलें",
    loading: "आपका डैशबोर्ड लोड हो रहा है...",
    error_loading: "प्रोफ़ाइल लोड करने में त्रुटि।"
  },
  bn: {
    welcome_heading: "সখী-ক্রেডিটে আপনাকে স্বাগত",
    welcome_subheading: "যেখানে আপনার দৈনন্দিন অভ্যাস আপনার আর্থিক ভবিষ্যৎ তৈরি করে।",
    get_started: "শুরু করুন",
    step_name: "আমরা আপনাকে কী নামে ডাকব?",
    step_name_placeholder: "আপনার প্রথম নাম লিখুন",
    step_occupation: "আপনি কী ধরনের কাজ করেন?",
    step_shg: "আপনি কি কোনো স্বনির্ভর দলের (SHG) সদস্য?",
    step_language: "আপনার পছন্দের ভাষা বেছে নিন",
    next: "পরবর্তী",
    create_profile: "প্রোফাইল তৈরি করুন",
    creating: "তৈরি হচ্ছে...",
    yes: "হ্যাঁ",
    no: "না",

    occ_tailoring: "দর্জি",
    occ_beauty: "বিউটি / সেলুন",
    occ_food: "খাবার / টিফিন পরিষেবা",
    occ_handicrafts: "হস্তশিল্প",
    occ_shg: "SHG সদস্য",
    occ_other: "অন্যান্য",

    tab_home: "হোম",
    tab_score: "আমার স্কোর",
    tab_learn: "শিখুন",
    tab_matches: "লোন বিকল্প",
    tab_group: "আমার গ্রুপ",
    tab_griha: "গৃহ",

    griha_title: "গৃহ হাব",
    griha_desc: "আপনার সখিস্কোর বাড়াতে বিল এবং আয় ট্র্যাক করুন।",
    bills_due: "বকেয়া বিল",
    income_logged: "নথিভুক্ত আয়",
    tasks_pending: "বাকি কাজ",
    add_bill: "বিল যোগ করুন",
    mark_paid: "পরিশোধ করা হয়েছে",
    
    good_morning: "সুপ্রভাত",
    good_afternoon: "শুভ অপরাহ্ন",
    good_evening: "শুভ সন্ধ্যা",
    switch_user: "ব্যবহারকারী পরিবর্তন করুন",
    loading: "আপনার ড্যাশবোর্ড লোড হচ্ছে...",
    error_loading: "প্রোফাইল লোড করতে ত্রুটি।"
  }
};

const LanguageContext = createContext();

export const bcp47Map = {
  'en': 'en-IN',
  'hi': 'hi-IN',
  'bn': 'bn-IN'
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  // We can update this when a user profile is loaded
  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const bcp47 = bcp47Map[language] || 'en-IN';

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, bcp47 }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
