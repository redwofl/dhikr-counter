export const uid = () => Math.random().toString(36).slice(2, 10);
export const DEFAULT_TEMPLATES = [
  {
    id: "default-ttt",
    name: "Tasbih, Tahmid, Takbir",
    description: "The classic after-prayer dhikr routine.",
    isDefault: true,
    items: [
      { id: "i1", transliteration: "Subhan Allah", arabic: "سُبْحَانَ ٱللَّهِ", count: 33, localized: { ur: { arabic: "سبحان اللہ", transliteration: "Subhan Allah" } } },
      { id: "i2", transliteration: "Alhamdulillah", arabic: "ٱلْحَمْدُ لِلَّهِ", count: 33, localized: { ur: { arabic: "الحمد للہ", transliteration: "Alhamdulillah" } } },
      { id: "i3", transliteration: "Allahu Akbar", arabic: "ٱللَّهُ أَكْبَرُ", count: 33, localized: { ur: { arabic: "اللہ اکبر", transliteration: "Allahu Akbar" } } }
    ]
  },
  {
    id: "default-istighfar",
    name: "Istighfar",
    description: "Seeking forgiveness.",
    isDefault: true,
    infoText:
      "The number of times you recite istighfar depends on the situation, such as after prayer or when visiting graves.\n\nEvery day: reciting istighfar 100 times a day is recommended.\n\nAfter prayer: it is recommended to recite istighfar 3 times, following the sunnah of the Prophet.\n\nWhen visiting graves: it is recommended to recite istighfar 3 times after saying the greeting.\n\nIstighfar is a simple practice of asking forgiveness from Allah, and shows awareness of one's mistakes.",
    items: [{ id: "i1", transliteration: "Astaghfirullah al-'Azim", arabic: "أَسْتَغْفِرُ ٱللَّهَ ٱلْعَظِيمَ", count: 100, localized: { ur: { arabic: "استغفر اللہ العظیم", transliteration: "Astaghfirullah al-'Azim" } } }]
  },
  {
    id: "default-salawat",
    name: "Salawat",
    description: "Sending blessings upon the Prophet.",
    isDefault: true,
    items: [{ id: "i1", transliteration: "Sallallahu 'ala Muhammad", arabic: "صَلَّى ٱللَّهُ عَلَىٰ مُحَمَّدٍ", count: 100, localized: { ur: { arabic: "صلی اللہ علی محمد", transliteration: "Sallallahu 'ala Muhammad" } } }]
  },
  {
    id: "default-subhanallah",
    name: "Subhan Allah",
    description: "Glory be to Allah.",
    isDefault: true,
    items: [{ id: "i1", transliteration: "Subhan Allah", arabic: "سُبْحَانَ ٱللَّهِ", count: 33 }]
  },
  {
    id: "default-alhamdulillah",
    name: "Alhamdulillah",
    description: "All praise is due to Allah.",
    isDefault: true,
    items: [{ id: "i1", transliteration: "Alhamdulillah", arabic: "ٱلْحَمْدُ لِلَّهِ", count: 33 }]
  },
  {
    id: "default-allahuakbar",
    name: "Allahu Akbar",
    description: "Allah is the greatest.",
    isDefault: true,
    items: [{ id: "i1", transliteration: "Allahu Akbar", arabic: "ٱللَّهُ أَكْبَرُ", count: 33, localized: { ur: { arabic: "اللہ اکبر", transliteration: "Allahu Akbar" } } }]
  },
  {
    id: "default-lailaha",
    name: "La ilaha illallah",
    description: "There is no god but Allah.",
    isDefault: true,
    items: [{ id: "i1", transliteration: "La ilaha illallah", arabic: "لَا إِلَٰهَ إِلَّا ٱللَّهُ", count: 100, localized: { ur: { arabic: "لا إلہ إلا اللہ", transliteration: "La ilaha illallah" } } }]
  },
  {
    id: "default-hawqalah",
    name: "Hawqalah",
    description: "There is no might nor power except with Allah.",
    isDefault: true,
    infoText:
      "The Hawqalah is a declaration of complete reliance upon Allah.\n\nThe Prophet ﷺ said that it is one of the treasures of Paradise (Sahih al-Bukhari 6404).\n\nIt is the answer to a deep relaxation for the heart, and is especially recommended when facing hardships.",
    items: [{ id: "i1", transliteration: "La hawla wa la quwwata illa billah", arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّهِ", count: 100, localized: { ur: { arabic: "لا حول ولا قوة إلا باللہ", transliteration: "La hawla wa la quwwata illa billah" } } }]
  },
  {
    id: "default-afterquran",
    name: "After Quran",
    description: "The dhikr to say after completing the Quran.",
    isDefault: true,
    infoText:
      "After completing a recitation of the Quran, it is sunnah to say 'Subhan Allah' three times.\n\nIbn Kathir reported that the Prophet ﷺ used to say it after finishing the Quran.\n\nIt is a small phrase with great reward.",
    items: [{ id: "i1", transliteration: "Subhan Allah", arabic: "سُبْحَانَ ٱللَّهِ", count: 3, localized: { ur: { arabic: "سبحان اللہ", transliteration: "Subhan Allah" } } }]
  },
  {
    id: "default-subhanallahbihamdihi",
    name: "Subhan Allah wa bihamdihi",
    description: "Glory and praise be to Allah.",
    isDefault: true,
    infoText:
      "'Subhan Allah wa bihamdihi' is a phrase beloved to Allah.\n\nThe Prophet ﷺ said: 'Two words that are light on the tongue, heavy on the scales, and beloved to the Most Merciful: Subhan Allahi wa bihamdihi, Subhan Allahil-'Azim.' (Sahih al-Bukhari 6406)\n\nWhoever says it 100 times in a day has his sins forgiven even if they are like the foam of the sea.",
    items: [{ id: "i1", transliteration: "Subhan Allah wa bihamdihi", arabic: "سُبْحَانَ ٱللَّهِ وَبِحَمْدِهِ", count: 100, localized: { ur: { arabic: "سبحان اللہ وبحمدہ", transliteration: "Subhan Allah wa bihamdihi" } } }]
  },
  {
    id: "default-yahayyu",
    name: "Ya Hayyu Ya Qayyum",
    description: "O Living, O Self-Sustaining.",
    isDefault: true,
    infoText:
      "'Ya Hayyu Ya Qayyum' (O Ever-Living, O Self-Sustaining) are two of Allah's most beautiful names.\n\nThey appear in the famous supplication: 'O Living, O Sustainer, by Your mercy I seek help.' (Tirmidhi)\n\nRepeating them is a source of comfort and relief in difficult times.",
    items: [{ id: "i1", transliteration: "Ya Hayyu ya Qayyum", arabic: "يَا حَيُّ يَا قَيُّومُ", count: 100, localized: { ur: { arabic: "یا حی یا قیوم", transliteration: "Ya Hayyu ya Qayyum" } } }]
  },
  {
    id: "default-yadhaljalal",
    name: "Ya Dhal-Jalali wal-Ikram",
    description: "O Possessor of Majesty and Honour.",
    isDefault: true,
    infoText:
      "'Ya Dhal-Jalali wal-Ikram' (O Possessor of Majesty and Honour) is a name of Allah mentioned in the Quran.\n\nThe Prophet ﷺ recommended seeking Allah with it, and it is part of the supplication after the call to prayer.",
    items: [{ id: "i1", transliteration: "Ya Dhal-Jalali wal-Ikram", arabic: "يَا ذَا ٱلْجَلَالِ وَٱلْإِكْرَامِ", count: 100, localized: { ur: { arabic: "یا ذا الجلال والاکرام", transliteration: "Ya Dhal-Jalali wal-Ikram" } } }]
  },
  {
    id: "default-1000dinars",
    name: "1000 Dinars Verse",
    description: "The verse of reliance from Surah At-Talaq.",
    isDefault: true,
    infoText:
      "This is the famous 'verse of 1000 dinars' (Ayah al-Dinar) from Surah At-Talaq (65:2-3).\n\nThe Prophet ﷺ is reported to have said that whoever recites it and relies upon Allah will be provided for, and Allah will grant him a way out of every difficulty.\n\nIt is often recited 7 times or more for relief from hardship and abundant provision.",
    items: [
      { id: "i1", transliteration: "And whoever fears Allah, He will make a way out for him…", arabic: "وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًا", count: 7, localized: { ur: { arabic: "اور جو اللہ سے ڈرے گا اللہ اس کے لیے راستہ نکالے گا", transliteration: "Aur jo Allah se darega, Allah uske liye rasta nikalega" } } },
      { id: "i2", transliteration: "And will provide for him from where he does not expect…", arabic: "وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", count: 7, localized: { ur: { arabic: "اور اسے ایسی جگہ سے رزق دے گا جہاں سے اسے گمان بھی نہ ہو", transliteration: "Aur use aisi jagah se rizq dega jahan se use guman bhi na ho" } } },
      { id: "i3", transliteration: "And whoever relies upon Allah, then He is sufficient for him…", arabic: "وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ", count: 7, localized: { ur: { arabic: "اور جو اللہ پر بھروسہ کرے گا وہ اس کے لیے کافی ہے", transliteration: "Aur jo Allah par bharosa karega, wo uske liye kafi hai" } } }
    ]
  }
];

export const DEFAULT_SETTINGS = {
  theme: "system",
  language: "ur",
  vibration: true,
  sound: true,
  soundType: "wood",
  autoSave: true,
  dailyGoal: 333,
  weeklySummary: false,
  beadPalette: "rosewoodCopper"
};

export function newSession(templateId) {
  return {
    templateId,
    currentItemIndex: 0,
    currentCount: 0,
    completedItems: [],
    startedAt: Date.now(),
    updatedAt: Date.now(),
    completed: false,
    customMax: {}
  };
}

/**
 * Resolve a built-in template's item text for the active language. Built-in
 * dhikr phrases are authored in Arabic; languages that transliterate them
 * (e.g. Urdu script) can override the visible text while keeping the original
 * Arabic as the canonical recitation. Falls back to the authored text for any
 * language without an override. Template name/description stay as authored.
 */
export function localizeDefaultTemplate(tpl, lang) {
  if (!tpl || lang === "en") return tpl;
  const items = tpl.items.map((it) => {
    const loc = it.localized && it.localized[lang];
    if (!loc) return it;
    return { ...it, arabic: loc.arabic || it.arabic, transliteration: loc.transliteration || it.transliteration };
  });
  if (items.every((it, i) => it === tpl.items[i])) return tpl;
  return { ...tpl, items };
}
