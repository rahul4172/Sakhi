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

    // Dashboard Tabs & Sidebar Navigation
    tab_home: "Home",
    tab_score: "My Score",
    tab_learn: "Learn",
    tab_matches: "Loan Matches",
    tab_group: "My Group",
    tab_griha: "Griha",
    nav_dashboard: "Dashboard",
    nav_bbps: "Pay Bills (BBPS)",
    nav_sakhiscore: "My SakhiScore",
    nav_rewards: "Sakhi Rewards",
    nav_griha: "Griha (Household)",
    nav_analytics: "Income & Expenses",
    nav_loanmatches: "Loan Matches",
    nav_learn: "Financial Learn",
    nav_schemes: "Schemes & Benefits",
    nav_goals: "Goals",
    nav_community: "Community",
    nav_documents: "Documents",
    nav_support: "Help & Support",
    nav_settings: "Settings",
    verified_user: "Verified User",
    sidebar_ai_title: "Need Personal Help?",
    sidebar_ai_subtitle: "Talk to Sakhi AI Assistant",
    chat_now: "Chat Now",
    
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
    error_loading: "Error loading profile.",

    // Income & Expenses
    cashflow_desc: "Detailed breakdown of your cashflow.",
    this_month: "This Month",
    last_3_months: "Last 3 Months",
    this_year: "This Year",
    available_balance: "Available Balance",
    total_income: "Total Income",
    total_expenses: "Total Expenses",
    expense_breakdown: "Expense Breakdown",
    transaction_history: "Transaction History",
    no_expenses_recorded: "No expenses recorded yet.",
    log_household_expenses: "Log household expenses to see your spending breakdown.",
    vs_last_month: "vs last month",

    // BBPS / Payments
    select_biller: "Select a Biller",
    search_biller_placeholder: "Search for your biller (e.g., Electricity, Water)",
    no_billers_found: "No billers found matching",
    recent_transactions: "Recent Transactions",
    system_status: "SYSTEM STATUS",
    live_secure: "Live & Secure",
    pay_bills_title: "Pay Bills & Recharges",
    pay_bills_subtitle: "Securely pay your household bills through the Bharat Bill Payment System.",

    // Rewards Dashboard
    on_chain_balance: "On-Chain Balance",
    sakhi_tokens: "SAKHI Tokens",
    ways_to_earn: "Ways to Earn Tokens",
    complete_profile: "Complete Profile",
    complete_profile_desc: "Tell us more about your business.",
    pay_utility_bills: "Pay Utility Bills",
    pay_utility_bills_desc: "Pay electric, water, or phone bills in BBPS.",
    financial_literacy_earn: "Financial Literacy",
    financial_literacy_earn_desc: "Learn about savings & credit rules.",
    weekly_log_streak: "Weekly Log Streak",
    weekly_log_streak_desc: "Keep household logs daily for 7 days.",
    earned_on_setup: "Earned on setup",
    automatic_on_payment: "Automatic on payment",
    earned_on_quiz: "Earned on quiz completion",
    earned_on_streak: "Earned on 7-day streak",
    claimed: "Claimed",
    ledger_history: "Ledger Transaction History",
    no_ledger_history: "No Ledger History",
    no_ledger_history_desc: "Your on-chain transfers and redemptions will appear here.",
    redeem_store: "Sakhi Rewards Store",
    redeem_store_desc: "Burn your tokens to redeem helpful vouchers or credit score boosts.",
    redeem_voucher: "Redeem Voucher",
    not_enough_tokens: "Not Enough Tokens",
    insufficient_tokens: "Insufficient SAKHI Coins!",
    redeem_success: "Redeemed successfully on-chain!",

    // Shop Items
    store_recharge_label: "₹50 Mobile Recharge Voucher",
    store_recharge_desc: "Get ₹50 off on your next mobile prepaid/postpaid recharge.",
    store_grocery_label: "₹100 Grocery Voucher",
    store_grocery_desc: "Redeem for local store grocery purchase discounts.",
    store_trust_label: "SakhiScore Trust Boost (+5)",
    store_trust_desc: "Instantly add +5 points to your SakhiScore for faster loan matching.",
    store_advisor_label: "Premium Financial Advisory",
    store_advisor_desc: "Unlock 1-on-1 advisor chat for scheme application assistance."
  },
  hi: {
    // Profile Onboarding
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

    // Occupations
    occ_tailoring: "सिलाई",
    occ_beauty: "ब्यूटी / पार्लर",
    occ_food: "खाना / टिफिन सेवा",
    occ_handicrafts: "हस्तशिल्प",
    occ_shg: "SHG सदस्य",
    occ_other: "अन्य",

    // Dashboard Tabs & Sidebar Navigation
    tab_home: "होम",
    tab_score: "मेरा स्कोर",
    tab_learn: "सीखें",
    tab_matches: "लोन विकल्प",
    tab_group: "मेरा समूह",
    tab_griha: "गृह",
    nav_dashboard: "डैशबोर्ड",
    nav_bbps: "बिल भुगतान (BBPS)",
    nav_sakhiscore: "मेरा सखीस्कोर",
    nav_rewards: "सखी पुरस्कार",
    nav_griha: "गृह (पारिवारिक)",
    nav_analytics: "आय और व्यय",
    nav_loanmatches: "लोन विकल्प",
    nav_learn: "वित्तीय शिक्षा",
    nav_schemes: "योजनाएं और लाभ",
    nav_goals: "लक्ष्य",
    nav_community: "समुदाय",
    nav_documents: "दस्तावेज़",
    nav_support: "सहायता और संपर्क",
    nav_settings: "सेटिंग्स",
    verified_user: "सत्यापित उपयोगकर्ता",
    sidebar_ai_title: "व्यक्तिगत सहायता चाहिए?",
    sidebar_ai_subtitle: "सखी एआई से बात करें",
    chat_now: "अभी चैट करें",
    
    // Griha Hub
    griha_title: "गृह हब",
    griha_desc: "अपना सखीस्कोर बढ़ाने के लिए बिल और आय ट्रैक करें।",
    bills_due: "बकाया बिल",
    income_logged: "दर्ज की गई आय",
    tasks_pending: "लंबित कार्य",
    add_bill: "बिल जोड़ें",
    mark_paid: "भुगतान हो गया",
    
    // General
    good_morning: "सुप्रभात",
    good_afternoon: "शुभ दोपहर",
    good_evening: "शुभ संध्या",
    switch_user: "उपयोगकर्ता बदलें",
    loading: "आपका डैशबोर्ड लोड हो रहा है...",
    error_loading: "प्रोफ़ाइल लोड करने में त्रुटि।",

    // Income & Expenses
    cashflow_desc: "आपके कैशफ्लो का विस्तृत विवरण।",
    this_month: "इस महीने",
    last_3_months: "पिछले 3 महीने",
    this_year: "इस वर्ष",
    available_balance: "उपलब्ध शेष राशि",
    total_income: "कुल आय",
    total_expenses: "कुल व्यय",
    expense_breakdown: "व्यय का विवरण",
    transaction_history: "लेनदेन का इतिहास",
    no_expenses_recorded: "अभी तक कोई व्यय दर्ज नहीं है।",
    log_household_expenses: "व्यय विवरण देखने के लिए घरेलू खर्च दर्ज करें।",
    vs_last_month: "पिछले महीने की तुलना में",

    // BBPS / Payments
    select_biller: "बिलर चुनें",
    search_biller_placeholder: "अपने बिलर को खोजें (जैसे, बिजली, पानी)",
    no_billers_found: "कोई बिलर नहीं मिला",
    recent_transactions: "हाल के लेनदेन",
    system_status: "सिस्टम की स्थिति",
    live_secure: "सक्रिय और सुरक्षित",
    pay_bills_title: "बिल भुगतान और रिचार्ज",
    pay_bills_subtitle: "भारत बिल भुगतान प्रणाली के माध्यम से अपने घरेलू बिलों का सुरक्षित भुगतान करें।",

    // Rewards Dashboard
    on_chain_balance: "ऑन-चेन बैलेंस",
    sakhi_tokens: "सखी टोकन",
    ways_to_earn: "टोकन कमाने के तरीके",
    complete_profile: "प्रोफ़ाइल पूरी करें",
    complete_profile_desc: "अपने व्यवसाय के बारे में हमें और बताएं।",
    pay_utility_bills: "उपयोगिता बिलों का भुगतान करें",
    pay_utility_bills_desc: "BBPS में बिजली, पानी या फोन के बिलों का भुगतान करें।",
    financial_literacy_earn: "वित्तीय साक्षरता",
    financial_literacy_earn_desc: "बचत और ऋण नियमों के बारे में जानें।",
    weekly_log_streak: "साप्ताहिक लॉग निरंतरता",
    weekly_log_streak_desc: "घरेलू लॉग 7 दिनों तक प्रतिदिन रखें।",
    earned_on_setup: "सेटअप पर मिला",
    automatic_on_payment: "भुगतान पर स्वचालित",
    earned_on_quiz: "प्रश्नोत्तरी पूरी होने पर मिला",
    earned_on_streak: "7-दिवसीय निरंतरता पर मिला",
    claimed: "दावा किया गया",
    ledger_history: "लेज़र लेनदेन इतिहास",
    no_ledger_history: "कोई लेज़र इतिहास नहीं",
    no_ledger_history_desc: "आपके ऑन-चेन ट्रांसफर और रिडेम्पशन यहां दिखाई देंगे।",
    redeem_store: "सखी पुरस्कार स्टोर",
    redeem_store_desc: "वाउचर या क्रेडिट स्कोर बूस्ट को भुनाने के लिए अपने टोकन का उपयोग करें।",
    redeem_voucher: "वाउचर भुनाएं",
    not_enough_tokens: "अपर्याप्त सिक्के",
    insufficient_tokens: "अपर्याप्त सखी सिक्के!",
    redeem_success: "ऑन-चेन सफलतापूर्वक भुनाया गया!",

    // Shop Items
    store_recharge_label: "₹50 मोबाइल रिचार्ज वाउचर",
    store_recharge_desc: "अपने अगले मोबाइल प्रीपेड/पोस्टपेड रिचार्ज पर ₹50 की छूट प्राप्त करें।",
    store_grocery_label: "₹100 किराना वाउचर",
    store_grocery_desc: "स्थानीय स्टोर से किराना खरीद पर छूट के लिए भुनाएं।",
    store_trust_label: "सखीस्कोर ट्रस्ट बूस्ट (+5)",
    store_trust_desc: "तेजी से लोन मिलान के लिए अपने सखीस्कोर में तुरंत +5 अंक जोड़ें।",
    store_advisor_label: "प्रीमियम वित्तीय सलाहकार",
    store_advisor_desc: "योजना आवेदन सहायता के लिए 1-ऑन-1 सलाहकार चैट शुरू करें।"
  },
  bn: {
    // Profile Onboarding
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

    // Occupations
    occ_tailoring: "দর্জি",
    occ_beauty: "বিউটি / সেলুন",
    occ_food: "খাবার / টিফিন পরিষেবা",
    occ_handicrafts: "হস্তশিল্প",
    occ_shg: "SHG সদস্য",
    occ_other: "অন্যান্য",

    // Dashboard Tabs & Sidebar Navigation
    tab_home: "হোম",
    tab_score: "আমার স্কোর",
    tab_learn: "শিখুন",
    tab_matches: "লোন বিকল্প",
    tab_group: "আমার গ্রুপ",
    tab_griha: "গৃহ",
    nav_dashboard: "ড্যাশবোর্ড",
    nav_bbps: "বিল পরিশোধ (BBPS)",
    nav_sakhiscore: "আমার সখিস্কোর",
    nav_rewards: "সখী পুরস্কার",
    nav_griha: "গৃহ (পারিবারিক)",
    nav_analytics: "আয় ও ব্যয়",
    nav_loanmatches: "লোন বিকল্প",
    nav_learn: "আর্থিক শিক্ষা",
    nav_schemes: "প্রকল্প ও সুবিধা",
    nav_goals: "লক্ষ্য",
    nav_community: "কমিউনিটি",
    nav_documents: "নথিপত্র",
    nav_support: "সাহায্য ও সাপোর্ট",
    nav_settings: "সেটিংস",
    verified_user: "যাচাইকৃত ব্যবহারকারী",
    sidebar_ai_title: "ব্যক্তিগত সাহায্য চান?",
    sidebar_ai_subtitle: "সখী এআই-এর সাথে কথা বলুন",
    chat_now: "চ্যাট করুন",

    // Griha Hub
    griha_title: "গৃহ হাব",
    griha_desc: "আপনার সখিস্কোর বাড়াতে বিল এবং আয় ট্র্যাক করুন।",
    bills_due: "বকেয়া বিল",
    income_logged: "নথিভুক্ত আয়",
    tasks_pending: "বাকি কাজ",
    add_bill: "বিল যোগ করুন",
    mark_paid: "পরিশোধ করা হয়েছে",
    
    // General
    good_morning: "সুপ্রভাত",
    good_afternoon: "শুভ অপরাহ্ন",
    good_evening: "শুভ সন্ধ্যা",
    switch_user: "ব্যবহারকারী পরিবর্তন করুন",
    loading: "আপনার ড্যাশবোর্ড লোড হচ্ছে...",
    error_loading: "প্রোফাইল লোড করতে ত্রুটি।",

    // Income & Expenses
    cashflow_desc: "আপনার ক্যাশফ্লোর বিস্তারিত বিবরণ।",
    this_month: "এই মাসে",
    last_3_months: "গত ৩ মাস",
    this_year: "এই বছর",
    available_balance: "উপলব্ধ ব্যালেন্স",
    total_income: "মোট আয়",
    total_expenses: "মোট খরচ",
    expense_breakdown: "খরচের বিবরণ",
    transaction_history: "লেনদেন ইতিহাস",
    no_expenses_recorded: "এখনও কোনো খরচ নথিভুক্ত নেই।",
    log_household_expenses: "খরচের বিবরণ দেখতে পারিবারিক খরচ নথিভুক্ত করুন।",
    vs_last_month: "গত মাসের তুলনায়",

    // BBPS / Payments
    select_biller: "বিলার নির্বাচন করুন",
    search_biller_placeholder: "আপনার বিলার খুঁজুন (যেমন, বিদ্যুৎ, জল)",
    no_billers_found: "কোনো বিলার পাওয়া যায়নি",
    recent_transactions: "সাম্প্রতিক লেনদেন",
    system_status: "সিস্টেম স্ট্যাটাস",
    live_secure: "লাইভ ও সুরক্ষিত",
    pay_bills_title: "বিল পরিশোধ ও রিচার্জ",
    pay_bills_subtitle: "ভারত বিল পেমেন্ট সিস্টেমের মাধ্যমে নিরাপদে আপনার পারিবারিক বিল পরিশোধ করুন।",

    // Rewards Dashboard
    on_chain_balance: "অন-চেইন ব্যালেন্স",
    sakhi_tokens: "সখী টোকেন",
    ways_to_earn: "টোকেন উপার্জনের উপায়",
    complete_profile: "প্রোফাইল সম্পন্ন করুন",
    complete_profile_desc: "আপনার ব্যবসা সম্পর্কে আমাদের আরও বলুন।",
    pay_utility_bills: "ইউটিলিটি বিল পরিশোধ করুন",
    pay_utility_bills_desc: "BBPS-এ বিদ্যুৎ, জল বা ফোনের বিল পরিশোধ করুন।",
    financial_literacy_earn: "আর্থিক সাক্ষরতা",
    financial_literacy_earn_desc: "সঞ্চয় ও ঋণের নিয়ম সম্পর্কে জানুন।",
    weekly_log_streak: "সাপ্তাহিক লগ স্ট্রিক",
    weekly_log_streak_desc: "৭ দিন ধরে প্রতিদিন পারিবারিক লগ রাখুন।",
    earned_on_setup: "সেটআপে অর্জিত",
    automatic_on_payment: "পেমেন্টে স্বয়ংক্রিয়",
    earned_on_quiz: "কুইজ সম্পন্ন হলে অর্জিত",
    earned_on_streak: "৭ দিনের স্ট্রিকে অর্জিত",
    claimed: "দাবি করা হয়েছে",
    ledger_history: "লেজার লেনদেন ইতিহাস",
    no_ledger_history: "কোনো লেজার ইতিহাস নেই",
    no_ledger_history_desc: "আপনার অন-চেইন ট্রান্সফার এবং রিডেম্পশন এখানে প্রদর্শিত হবে।",
    redeem_store: "সখী রিওয়ার্ড স্টোর",
    redeem_store_desc: "ভাউচার বা ক্রেডিট স্কোর বুস্ট রিডিম করতে আপনার টোকেন ব্যবহার করুন।",
    redeem_voucher: "ভাউচার রিডিম করুন",
    not_enough_tokens: "পর্যাপ্ত কয়েন নেই",
    insufficient_tokens: "অপ্রতুল সখী কয়েন!",
    redeem_success: "অন-চেইনে সফলভাবে রিডিম করা হয়েছে!",

    // Shop Items
    store_recharge_label: "₹৫০ মোবাইল রিচার্জ ভাউচার",
    store_recharge_desc: "আপনার পরবর্তী মোবাইল প্রিপেইড/পোস্টপেইড রিচার্জে ₹৫০ ছাড় পান।",
    store_grocery_label: "₹১০০ গ্রোসারি ভাউচার",
    store_grocery_desc: "স্থানীয় দোকানে মুদি কেনাকাটায় ছাড়ের জন্য রিডিম করুন।",
    store_trust_label: "সখিস্কোর ট্রাস্ট বুস্ট (+৫)",
    store_trust_desc: "দ্রুত লোন মিলানোর জন্য আপনার সখিস্কোরে অবিলম্বে +৫ পয়েন্ট যোগ করুন।",
    store_advisor_label: "প্রিমিয়াম আর্থিক পরামর্শ",
    store_advisor_desc: "প্রকল্প আবেদন সহায়তার জন্য ১-অন-১ পরামর্শ চ্যাট আনলক করুন।"
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
