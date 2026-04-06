import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, StatusBar, Animated, Platform, ActivityIndicator,
  Switch, Modal,
} from 'react-native';

const { width } = Dimensions.get('window');
const pad = n => String(n).padStart(2,'0');
const fmtTime = sec => { const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60; return `${pad(h)}:${pad(m)}:${pad(s)}`; };
const nowSec = () => { const n=new Date(); return n.getHours()*3600+n.getMinutes()*60+n.getSeconds(); };
const timeToSec = hhmm => { if(!hhmm)return 0; const[h,m]=hhmm.split(':').map(Number); return h*3600+m*60; };
const PRAYER_ORDER = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
const ICONS = { Fajr:'🌙', Sunrise:'🌅', Dhuhr:'☀️', Asr:'🌤️', Maghrib:'🌇', Isha:'🌃' };
const AL = {
  appName:'Koha e Namazit',
  prayers:{ Fajr:'Sabahu', Sunrise:'Lindja e Diellit', Dhuhr:'Dreka', Asr:'Ikindia', Maghrib:'Akshami', Isha:'Jacia' },
  nextPrayer:'Namazi i ardhshëm', timeLeft:'Koha e mbetur',
  qiblaDir:'Drejtimi i Kibles', location:'Vendndodhja', loading:'Po ngarkohet...',
  darkMode:"Mënyra e errët", settings:'Cilësimet', dailyVerse:'Ajeti i Ditës',
  dailyHadith:'Hadithi i Ditës', prayerVerse:'Ajeti i Kohës',
  esmaulFull:"Esmau'l Husna — 99 Emrat", degrees:'gradë nga Veriu',
  calibrate:"Kalibroni telefonin duke e lëvizur në formë figure-8",
  zikir:'Zikirmatik', duas:"Duatë", imsakiye:'Imsakija 30 Ditore',
  themeColor:"Ngjyra e temës", calcMethod:'Metoda e llogaritjes',
  asrMethod:'Metoda Asr', hanafi:'Hanefi', shafi:"Shafi'i",
  reset:'Rifillo', completed:'Përfunduat! 🎉',
  tabs:{ home:'Kryefaqja', qibla:'Kibla', content:'Përmbajtja', settings:'Cilësimet' },
};
const ACCENTS = {
  gold:{name:'Ar',color:'#D4AF37'}, green:{name:'Gjelbër',color:'#2ECC71'},
  blue:{name:'Blu',color:'#3498DB'}, purple:{name:'Vjollcë',color:'#9B59B6'},
  teal:{name:'Teal',color:'#1ABC9C'},
};
const CALC_METHODS = [
  {id:3,name:'MWL — Lidhja Botërore Islame'},
  {id:2,name:'ISNA — Amerika Veriore'},
  {id:5,name:'Egjipt — Autoriteti Egjiptian'},
  {id:4,name:'Mekë — Umm Al-Qura'},
  {id:1,name:'Karaçi — Universiteti i Shkencave'},
  {id:7,name:'Diyanet — Turqia'},
];
const buildTheme = (dark,accent) => ({
  bg:dark?'#0A0E1A':'#F5F0E8', surface:dark?'#111827':'#FDFAF3',
  card:dark?'#1A2235':'#FFFFFF', accent,
  accentSoft:accent+(dark?'22':'18'),
  text:dark?'#E8EDF5':'#1A1408', textMuted:dark?'#7B8499':'#6B5B45',
  border:dark?'#252D40':'#E0D8C8',
});

const DAILY_VERSES = [
  {arabic:'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',albanian:'Me të vërtetë, Allahu është me të durueshmit.',ref:'El-Bekare: 153'},
  {arabic:'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',albanian:'Kush mbështetet tek Allahu, Ai i mjafton.',ref:'Et-Talak: 3'},
  {arabic:'إِنَّ مَعَ الْعُسْرِ يُسْرًا',albanian:'Me të vërtetë, pas vështirësisë vjen lehtësia.',ref:'El-Inshirah: 6'},
  {arabic:'فَاذْكُرُونِي أَذْكُرْكُمْ',albanian:"Më kujtoni Mua, Unë do t'ju kujtoj.",ref:'El-Bekare: 152'},
  {arabic:'وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ',albanian:'Mos e humbni shpresën në mëshirën e Allahut.',ref:'Jusuf: 87'},
  {arabic:'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ',albanian:'Allahu është drita e qiejve dhe e tokës.',ref:'En-Nur: 35'},
  {arabic:'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ',albanian:'Ai është me ju kudo që të jeni.',ref:'El-Hadid: 4'},
];
const DAILY_HADITHS = [
  {text:'Vepra më e dashur tek Allahu është namazi në kohën e tij.',source:'Buhari & Muslim'},
  {text:'Fjalë e mirë është sadaka. Largimi i një pengese nga rruga është sadaka.',source:'Buhari'},
  {text:'Muslimani është ai nga gjuha dhe dora e të cilit janë të sigurt të tjerët.',source:'Buhari'},
  {text:'Kush falë sabahun, është nën mbrojtjen e Allahut.',source:'Muslim'},
  {text:'Mos e nënçmo asnjë vepër të mirë, qoftë edhe takimi me vëllanë tënd me fytyrë të hapur.',source:'Muslim'},
  {text:'Kush falet dyzet ditë me xhemat, i shkruhen dy liri: nga zjarri dhe nga hipokrizia.',source:'Tirmidhiu'},
  {text:'Allahu është i mirë dhe pranon vetëm të mirën.',source:'Muslim'},
];
const PRAYER_VERSES = {
  Fajr:{arabic:'وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ',albanian:'Lartëso lavdinë e Zotit tënd para lindjes së diellit.',ref:'Kaf: 39'},
  Sunrise:{arabic:'وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ',albanian:'Lartëso lavdinë e Zotit tënd para lindjes së diellit.',ref:'Kaf: 39'},
  Dhuhr:{arabic:'حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ',albanian:'Ruajeni me kujdes namazet dhe namazin e mesëm.',ref:'El-Bekare: 238'},
  Asr:{arabic:'وَالْعَصْرِ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ',albanian:'Për kohën! Me të vërtetë, njeriu është në humbje.',ref:'El-Asr: 1-2'},
  Maghrib:{arabic:'وَسَبِّحْ بِحَمْدِ رَبِّكَ بِالْعَشِيِّ وَالْإِبْكَارِ',albanian:'Lartësoje Zotin tënd në mbrëmje dhe në mëngjes.',ref:'Gafir: 55'},
  Isha:{arabic:'وَمِنَ اللَّيْلِ فَسَبِّحْهُ وَأَدْبَارَ السُّجُودِ',albanian:'Dhe glorifikoje Atë gjatë natës dhe pas sexhdeve.',ref:'Kaf: 40'},
};
const FRIDAY_MSG = {
  arabic:'يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ',
  albanian:'O besimtarë! Kur thirret për namaz të xhumasë, nxitoni drejt përmendjes së Allahut.',
  ref:'El-Xhuma: 9',
  wish:"Xhuma mubarak! Allahu e pranoftë namazin dhe adhurimet tuaja. 🤲",
};
const ZIKIR_LIST = [
  {arabic:'سُبْحَانَ اللَّهِ',albanian:'SubhanAllah',meaning:'Lëvduar qoftë Allahu',target:33},
  {arabic:'الْحَمْدُ لِلَّهِ',albanian:'Elhamdulilah',meaning:'Falënderimi i takon Allahut',target:33},
  {arabic:'اللَّهُ أَكْبَرُ',albanian:'Allahu Ekber',meaning:'Allahu është më i Madhi',target:33},
  {arabic:'لَا إِلَهَ إِلَّا اللَّهُ',albanian:'La ilahe ilAllah',meaning:'Nuk ka zot tjetër veç Allahut',target:100},
  {arabic:'أَسْتَغْفِرُ اللَّهَ',albanian:'EstagfirAllah',meaning:'Kërkoj falje nga Allahu',target:100},
  {arabic:'صَلِّ عَلَى النَّبِيِّ',albanian:'Salavat',meaning:'Salavat mbi Profetin ﷺ',target:100},
];
const DUAS = [
  {category:'🌅 Duatë e Mëngjesit',items:[
    {title:'Dua e zgjimit',arabic:'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',albanian:'Gdhimë ne dhe gjithë mbretëria i takon Allahut.'},
    {title:'Dua e veshjes',arabic:'الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي',albanian:'Falënderimi i takon Allahut i cili më veshi.'},
    {title:'Dua e daljes nga shtëpia',arabic:'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ',albanian:'Me emrin e Allahut, u mbështeta tek Allahu.'},
  ]},
  {category:'🌙 Duatë e Mbrëmjes',items:[
    {title:'Dua e mbrëmjes',arabic:'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',albanian:'Ngrysëm ne dhe gjithë mbretëria i takon Allahut.'},
    {title:'Dua para gjumit',arabic:'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',albanian:'Me emrin Tënd, o Allah, vdes dhe ringjallëm.'},
    {title:'Ajeti Kursij',arabic:'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',albanian:'Allahu — nuk ka zot tjetër veç Tij, të Gjallit, të Vetëqëndrushmit.'},
  ]},
  {category:'🍽️ Dua të Përditshme',items:[
    {title:'Para ngrënies',arabic:'بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ',albanian:'Me emrin e Allahut dhe me bereqetin e Allahut.'},
    {title:'Pas ngrënies',arabic:'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا',albanian:'Falënderimi i takon Allahut i cili na ushqeu.'},
    {title:'Hyrja në xhami',arabic:'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',albanian:'O Allah, hapi për mua dyert e mëshirës Sate.'},
    {title:'Para udhëtimit',arabic:'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا',albanian:'I Lartësuar qoftë Ai i cili na e nënshtroi këtë.'},
  ]},
  {category:'🤲 Dua të Veçanta',items:[
    {title:'Dua për shëndet',arabic:'اللَّهُمَّ عَافِنِي فِي بَدَنِي',albanian:'O Allah, më jep shëndet në trupin tim.'},
    {title:'Dua për falje',arabic:'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ',albanian:'O Allah, Ti je Falës dhe e do faljen, më fal.'},
    {title:'Dua për udhëzim',arabic:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً',albanian:'Zoti ynë, na jep të mira në këtë botë dhe në botën tjetër.'},
  ]},
];
const ESMAUL = [
  {n:1,a:'الرَّحْمَنُ',t:'Er-Rrahman',m:'I Gjithëmëshirshmi'},{n:2,a:'الرَّحِيمُ',t:'Er-Rrahim',m:'Mëshiruesi'},
  {n:3,a:'الْمَلِكُ',t:'El-Melik',m:'Mbreti'},{n:4,a:'الْقُدُّوسُ',t:'El-Kuddus',m:'I Shenjti'},
  {n:5,a:'السَّلَامُ',t:'Es-Selam',m:'Paqja'},{n:6,a:'الْمُؤْمِنُ',t:"El-Mu'min",m:'Besëdhënësi'},
  {n:7,a:'الْمُهَيْمِنُ',t:'El-Muhejmin',m:'Mbikëqyrësi'},{n:8,a:'الْعَزِيزُ',t:'El-Aziz',m:'I Plotfuqishmi'},
  {n:9,a:'الْجَبَّارُ',t:'El-Xhebbar',m:'Gjithëpushtetari'},{n:10,a:'الْمُتَكَبِّرُ',t:'El-Mutekebbir',m:'Madhështori'},
  {n:11,a:'الْخَالِقُ',t:'El-Halik',m:'Krijuesi'},{n:12,a:'الْبَارِئُ',t:"El-Bari'",m:'Origjinuesi'},
  {n:13,a:'الْمُصَوِّرُ',t:'El-Musawwir',m:'Formuesi'},{n:14,a:'الْغَفَّارُ',t:'El-Gaffar',m:'Falësi i madh'},
  {n:15,a:'الْقَهَّارُ',t:'El-Kahhar',m:'Ngadhënjyesi'},{n:16,a:'الْوَهَّابُ',t:'El-Vehhab',m:'Dhurëdhënësi'},
  {n:17,a:'الرَّزَّاقُ',t:'Er-Rezzak',m:'Furnizuesi'},{n:18,a:'الْفَتَّاحُ',t:'El-Fettah',m:'Çeluesi'},
  {n:19,a:'الْعَلِيمُ',t:'El-Alim',m:'I Gjithëdituri'},{n:20,a:'الْقَابِضُ',t:'El-Kabid',m:'Ngushtuesi'},
  {n:21,a:'الْبَاسِطُ',t:'El-Basit',m:'Zgjeruesi'},{n:22,a:'الْخَافِضُ',t:'El-Hafid',m:'Poshtëruesi'},
  {n:23,a:'الرَّافِعُ',t:"Er-Rafi'",m:'Lartësuesi'},{n:24,a:'الْمُعِزُّ',t:'El-Muizz',m:'Nderonjësi'},
  {n:25,a:'الْمُذِلُّ',t:'El-Mudhil',m:'Nënçmuesi'},{n:26,a:'السَّمِيعُ',t:"Es-Semi'",m:'Dëgjuesi'},
  {n:27,a:'الْبَصِيرُ',t:'El-Basir',m:'Shikuesi'},{n:28,a:'الْحَكَمُ',t:'El-Hakem',m:'Gjyqtari'},
  {n:29,a:'الْعَدْلُ',t:'El-Adl',m:'I Drejti'},{n:30,a:'اللَّطِيفُ',t:'El-Latif',m:'I Butë e i Hollë'},
  {n:31,a:'الْخَبِيرُ',t:'El-Habir',m:'I Njohuri i mirë'},{n:32,a:'الْحَلِيمُ',t:'El-Halim',m:'I Durueshmi'},
  {n:33,a:'الْعَظِيمُ',t:'El-Adhim',m:'Madhështori'},{n:34,a:'الْغَفُورُ',t:'El-Gafur',m:'Falësi'},
  {n:35,a:'الشَّكُورُ',t:'Esh-Shekur',m:'Mirënjohësi'},{n:36,a:'الْعَلِيُّ',t:'El-Aliyy',m:'I Larti'},
  {n:37,a:'الْكَبِيرُ',t:'El-Kebir',m:'I Madhi'},{n:38,a:'الْحَفِيظُ',t:'El-Hafidh',m:'Ruajtësi'},
  {n:39,a:'الْمُقِيتُ',t:'El-Mukit',m:'Furnizuesi i forcës'},{n:40,a:'الْحَسِيبُ',t:'El-Hasib',m:'Llogaritësi'},
  {n:41,a:'الْجَلِيلُ',t:'El-Xhelil',m:'Madhështori'},{n:42,a:'الْكَرِيمُ',t:'El-Kerim',m:'Bujarori'},
  {n:43,a:'الرَّقِيبُ',t:'Er-Rakib',m:'Mbikëqyrësi'},{n:44,a:'الْمُجِيبُ',t:'El-Muxhib',m:'Përgjiguesi'},
  {n:45,a:'الْوَاسِعُ',t:"El-Vasi'",m:'Gjithëpërfshirësi'},{n:46,a:'الْحَكِيمُ',t:'El-Hakim',m:'I Urti'},
  {n:47,a:'الْوَدُودُ',t:'El-Vedud',m:'Dashuruesi'},{n:48,a:'الْمَجِيدُ',t:'El-Mexhid',m:'I Lavdishmi'},
  {n:49,a:'الْبَاعِثُ',t:"El-Ba'ith",m:'Ngritësi'},{n:50,a:'الشَّهِيدُ',t:'Esh-Shehid',m:'Dëshmuesi'},
  {n:51,a:'الْحَقُّ',t:'El-Hakk',m:'E Vërteta'},{n:52,a:'الْوَكِيلُ',t:'El-Vekil',m:'Mbështetuesi'},
  {n:53,a:'الْقَوِيُّ',t:'El-Kaviyy',m:'I Fuqishmi'},{n:54,a:'الْمَتِينُ',t:'El-Metin',m:'I Fortë'},
  {n:55,a:'الْوَلِيُّ',t:'El-Veliyy',m:'Miku'},{n:56,a:'الْحَمِيدُ',t:'El-Hamid',m:'I Lavdëruari'},
  {n:57,a:'الْمُحْصِي',t:'El-Muhsi',m:'Numëruesi'},{n:58,a:'الْمُبْدِئُ',t:"El-Mubdi'",m:'Fillimi'},
  {n:59,a:'الْمُعِيدُ',t:'El-Muid',m:'Kthyesi'},{n:60,a:'الْمُحْيِي',t:'El-Muhyi',m:'Dhënësi i jetës'},
  {n:61,a:'الْمُمِيتُ',t:'El-Mumit',m:'Marrësi i jetës'},{n:62,a:'الْحَيُّ',t:'El-Hajj',m:'I Gjalli'},
  {n:63,a:'الْقَيُّومُ',t:'El-Kajjum',m:'Ekzistuesi vetë'},{n:64,a:'الْوَاجِدُ',t:'El-Vaxhid',m:'Gjetësi'},
  {n:65,a:'الْمَاجِدُ',t:'El-Maxhid',m:'I Ndershmi'},{n:66,a:'الْوَاحِدُ',t:'El-Vahid',m:'I Vetmi'},
  {n:67,a:'الأَحَدُ',t:'El-Ehad',m:'Një'},{n:68,a:'الصَّمَدُ',t:'Es-Samed',m:'I Pavaruri'},
  {n:69,a:'الْقَادِرُ',t:'El-Kadir',m:'I Fuqishmi'},{n:70,a:'الْمُقْتَدِرُ',t:'El-Muktedir',m:'Zotëruesi i plotfuqisë'},
  {n:71,a:'الْمُقَدِّمُ',t:'El-Mukaddim',m:'Pararendësi'},{n:72,a:'الْمُؤَخِّرُ',t:'El-Muahkhir',m:'Shtyrësi'},
  {n:73,a:'الأَوَّلُ',t:'El-Evvel',m:'I Pari'},{n:74,a:'الآخِرُ',t:'El-Ahir',m:'I Fundit'},
  {n:75,a:'الظَّاهِرُ',t:'Edh-Dhahir',m:'I Dukshmi'},{n:76,a:'الْبَاطِنُ',t:'El-Batin',m:'I Fshehti'},
  {n:77,a:'الْوَالِي',t:'El-Vali',m:'Administruesi'},{n:78,a:'الْمُتَعَالِي',t:"El-Muta'ali",m:'I Lartësuari'},
  {n:79,a:'الْبَرُّ',t:'El-Berr',m:'Burimdashuria'},{n:80,a:'التَّوَّابُ',t:'Et-Tevvab',m:'Pranues i pendimit'},
  {n:81,a:'الْمُنْتَقِمُ',t:'El-Muntakim',m:'Hakmarrësi'},{n:82,a:'الْعَفُوُّ',t:'El-Afuvv',m:'Falësi'},
  {n:83,a:'الرَّؤُوفُ',t:"Er-Ra'uf",m:'I Dhembshuri'},{n:84,a:'مَالِكُ الْمُلْكِ',t:'Malikul-Mulk',m:'Zotëruesi i mbretërisë'},
  {n:85,a:'ذُو الْجَلالِ',t:'Dhul-Xhelali',m:'Zotëruesi i madhështisë'},{n:86,a:'الْمُقْسِطُ',t:'El-Muksit',m:'I Drejti'},
  {n:87,a:'الْجَامِعُ',t:"El-Xhami'",m:'Mbledhësi'},{n:88,a:'الْغَنِيُّ',t:'El-Ganiyy',m:'I Pasuri'},
  {n:89,a:'الْمُغْنِي',t:'El-Mugni',m:'Pasëruesi'},{n:90,a:'الْمَانِعُ',t:"El-Mani'",m:'Penguesit'},
  {n:91,a:'الضَّارُّ',t:'Ed-Darr',m:'Dëmuesi'},{n:92,a:'النَّافِعُ',t:"En-Nafi'",m:'Dobishmësia'},
  {n:93,a:'النُّورُ',t:'En-Nur',m:'Drita'},{n:94,a:'الْهَادِي',t:'El-Hadi',m:'Udhëzuesi'},
  {n:95,a:'الْبَدِيعُ',t:"El-Bedi'",m:'Shpikësi'},{n:96,a:'الْبَاقِي',t:'El-Baki',m:'I Përjetshmi'},
  {n:97,a:'الْوَارِثُ',t:'El-Varith',m:'Trashëgimtari'},{n:98,a:'الرَّشِيدُ',t:'Er-Reshid',m:'Udhëzuesi i drejtë'},
  {n:99,a:'الصَّبُورُ',t:'Es-Sabur',m:'I Durueshmi'},
];

export default function App() {
  const [darkMode,setDarkMode]=useState(true);
  const [accentKey,setAccentKey]=useState('gold');
  const [tab,setTab]=useState('home');
  const [contentTab,setContentTab]=useState('verse');
  const [prayerTimes,setPrayerTimes]=useState(null);
  const [monthCal,setMonthCal]=useState([]);
  const [loading,setLoading]=useState(true);
  const [coords,setCoords]=useState(null);
  const [qibla,setQibla]=useState(null);
  const [cityName,setCityName]=useState('');
  const [hijriDate,setHijriDate]=useState('');
  const [countdown,setCountdown]=useState(0);
  const [nextPrayer,setNextPrayer]=useState('');
  const [calcMethod,setCalcMethod]=useState(3);
  const [asrMethod,setAsrMethod]=useState(0);
  const [now,setNow]=useState(new Date());
  const fadeAnim=useRef(new Animated.Value(0)).current;
  const accent=ACCENTS[accentKey].color;
  const T=buildTheme(darkMode,accent);
  const todayVerse=DAILY_VERSES[now.getDate()%DAILY_VERSES.length];
  const todayHadith=DAILY_HADITHS[now.getDate()%DAILY_HADITHS.length];
  const isFriday=now.getDay()===5;

  useEffect(()=>{const id=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(id);},[]);
  useEffect(()=>{
    if(!prayerTimes)return;
    const cur=nowSec();let next=null,diff=Infinity;
    for(const p of PRAYER_ORDER){const t=timeToSec(prayerTimes[p]);if(t>cur&&t-cur<diff){diff=t-cur;next=p;}}
    if(!next){next='Fajr';diff=86400-cur+timeToSec(prayerTimes['Fajr']);}
    setNextPrayer(next);setCountdown(diff);
  },[now,prayerTimes]);
  useEffect(()=>{
    if(navigator?.geolocation)navigator.geolocation.getCurrentPosition(p=>setCoords({lat:p.coords.latitude,lon:p.coords.longitude}),fetchByIP);
    else fetchByIP();
  },[]);
  useEffect(()=>{if(coords){fetchPrayers();fetchQibla();fetchCity();fetchMonthCal();}},[ coords,calcMethod,asrMethod]);

  async function fetchByIP(){
    try{const r=await fetch('https://ipapi.co/json/');const d=await r.json();setCoords({lat:d.latitude,lon:d.longitude});setCityName(d.city||'');}
    catch{setCoords({lat:42.6629,lon:21.1655});setCityName('Prishtinë');}
  }
  async function fetchPrayers(){
    setLoading(true);fadeAnim.setValue(0);
    try{
      const d=new Date();
      const r=await fetch(`https://api.aladhan.com/v1/timings/${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()}?latitude=${coords.lat}&longitude=${coords.lon}&method=${calcMethod}&school=${asrMethod}`);
      const j=await r.json();
      if(j.code===200){
        const clean={};Object.keys(j.data.timings).forEach(k=>{clean[k]=j.data.timings[k].slice(0,5);});
        setPrayerTimes(clean);
        setHijriDate(`${j.data.date.hijri.day} ${j.data.date.hijri.month.en} ${j.data.date.hijri.year}`);
      }
    }catch{}
    setLoading(false);
    Animated.timing(fadeAnim,{toValue:1,duration:700,useNativeDriver:true}).start();
  }
  async function fetchQibla(){
    try{const r=await fetch(`https://api.aladhan.com/v1/qibla/${coords.lat}/${coords.lon}`);const d=await r.json();if(d.code===200)setQibla(d.data.direction);}catch{}
  }
  async function fetchCity(){
    try{if(cityName)return;const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lon}&format=json`);const d=await r.json();setCityName(d.address?.city||d.address?.town||d.address?.village||'');}catch{}
  }
  async function fetchMonthCal(){
    try{
      const d=new Date();
      const r=await fetch(`https://api.aladhan.com/v1/calendar/${d.getFullYear()}/${d.getMonth()+1}?latitude=${coords.lat}&longitude=${coords.lon}&method=${calcMethod}&school=${asrMethod}`);
      const j=await r.json();if(j.code===200)setMonthCal(j.data);
    }catch{}
  }

  return(
    <View style={[ss.root,{backgroundColor:T.bg}]}>
      <StatusBar barStyle={darkMode?'light-content':'dark-content'} backgroundColor={T.bg}/>
      <View style={[ss.header,{backgroundColor:T.surface,borderBottomColor:T.border}]}>
        <View>
          <Text style={[ss.appName,{color:T.accent}]}>{AL.appName}</Text>
          <Text style={[ss.cityRow,{color:T.textMuted}]}>📍 {cityName||'...'}</Text>
        </View>
        <View style={{alignItems:'flex-end'}}>
          <Text style={[{fontSize:11},{color:T.textMuted}]}>{hijriDate}</Text>
          {isFriday&&<Text style={[ss.fridayBadge,{backgroundColor:T.accentSoft,color:T.accent}]}>🕌 Xhuma Mubarak</Text>}
        </View>
      </View>
      <ScrollView style={{flex:1}} showsVerticalScrollIndicator={false}>
        {loading
          ?<View style={ss.centered}><ActivityIndicator size="large" color={T.accent}/><Text style={[{marginTop:14,fontSize:15},{color:T.textMuted}]}>{AL.loading}</Text></View>
          :<Animated.View style={{opacity:fadeAnim}}>
            {tab==='home'&&<HomeTab T={T} prayerTimes={prayerTimes} nextPrayer={nextPrayer} countdown={countdown} now={now} todayVerse={todayVerse} todayHadith={todayHadith} isFriday={isFriday}/>}
            {tab==='qibla'&&<QiblaTab T={T} qibla={qibla}/>}
            {tab==='content'&&<ContentTab T={T} contentTab={contentTab} setContentTab={setContentTab} todayVerse={todayVerse} todayHadith={todayHadith} nextPrayer={nextPrayer} monthCal={monthCal} now={now}/>}
            {tab==='settings'&&<SettingsTab T={T} darkMode={darkMode} setDarkMode={setDarkMode} cityName={cityName} accentKey={accentKey} setAccentKey={setAccentKey} calcMethod={calcMethod} setCalcMethod={setCalcMethod} asrMethod={asrMethod} setAsrMethod={setAsrMethod}/>}
          </Animated.View>
        }
      </ScrollView>
      <View style={[ss.tabBar,{backgroundColor:T.surface,borderTopColor:T.border}]}>
        {[{k:'home',i:'🕌',l:AL.tabs.home},{k:'qibla',i:'🧭',l:AL.tabs.qibla},{k:'content',i:'📖',l:AL.tabs.content},{k:'settings',i:'⚙️',l:AL.tabs.settings}].map(item=>(
          <TouchableOpacity key={item.k} style={ss.tabItem} onPress={()=>setTab(item.k)}>
            <Text style={{fontSize:22,opacity:tab===item.k?1:0.4}}>{item.i}</Text>
            <Text style={[ss.tabLabel,{color:tab===item.k?T.accent:T.textMuted}]}>{item.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function HomeTab({T,prayerTimes,nextPrayer,countdown,now,todayVerse,todayHadith,isFriday}){
  if(!prayerTimes)return null;
  const cur=nowSec();
  return(
    <View style={ss.pg}>
      {isFriday&&(
        <View style={[ss.fridayBanner,{backgroundColor:T.accentSoft,borderColor:T.accent+'44'}]}>
          <Text style={[{fontSize:13,textAlign:'right',lineHeight:24,marginBottom:6},{color:T.accent}]}>{FRIDAY_MSG.arabic}</Text>
          <Text style={[{fontSize:14,lineHeight:22,marginBottom:4},{color:T.text}]}>{FRIDAY_MSG.albanian}</Text>
          <Text style={[{fontSize:11,marginBottom:6},{color:T.textMuted}]}>{FRIDAY_MSG.ref}</Text>
          <Text style={[{fontSize:14,fontWeight:'700',textAlign:'center'},{color:T.accent}]}>{FRIDAY_MSG.wish}</Text>
        </View>
      )}
      <View style={[ss.clockCard,{backgroundColor:T.card,borderColor:T.border}]}>
        <Text style={[ss.clockTime,{color:T.accent}]}>{pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}</Text>
        <Text style={[{fontSize:13,marginTop:4,textTransform:'capitalize'},{color:T.textMuted}]}>{now.toLocaleDateString('sq-AL',{weekday:'long',day:'numeric',month:'long'})}</Text>
      </View>
      {nextPrayer&&(
        <View style={[ss.nextCard,{backgroundColor:T.accentSoft,borderColor:T.accent+'55'}]}>
          <View>
            <Text style={[ss.smallLabel,{color:T.textMuted}]}>{AL.nextPrayer}</Text>
            <Text style={[{fontSize:20,fontWeight:'700'},{color:T.accent}]}>{ICONS[nextPrayer]} {AL.prayers[nextPrayer]||nextPrayer}</Text>
            <Text style={[{fontSize:14,marginTop:2},{color:T.text}]}>{prayerTimes[nextPrayer]}</Text>
          </View>
          <View style={{alignItems:'flex-end'}}>
            <Text style={[ss.smallLabel,{color:T.textMuted}]}>{AL.timeLeft}</Text>
            <Text style={[{fontSize:26,fontWeight:'300'},{color:T.accent}]}>{fmtTime(countdown)}</Text>
          </View>
        </View>
      )}
      <View style={[ss.card,{backgroundColor:T.card,borderColor:T.border,overflow:'hidden'}]}>
        {PRAYER_ORDER.map((p,i)=>{
          const t=prayerTimes[p];const isPast=timeToSec(t)<cur;const isNext=p===nextPrayer;
          return(
            <View key={p} style={[ss.pRow,i<PRAYER_ORDER.length-1&&{borderBottomWidth:1,borderBottomColor:T.border},isNext&&{backgroundColor:T.accentSoft}]}>
              <Text style={{fontSize:19,marginRight:11}}>{ICONS[p]}</Text>
              <Text style={[{flex:1,fontSize:15},{color:isNext?T.accent:T.text,fontWeight:isNext?'700':'400'}]}>{AL.prayers[p]||p}</Text>
              <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                {isNext&&<View style={[ss.dot,{backgroundColor:T.accent}]}/>}
                <Text style={[{fontSize:15},{color:isPast?T.textMuted:T.text,fontWeight:isNext?'700':'400'}]}>{t}</Text>
              </View>
            </View>
          );
        })}
      </View>
      {nextPrayer&&PRAYER_VERSES[nextPrayer]&&(
        <View style={[ss.vCard,{backgroundColor:T.card,borderColor:T.border}]}>
          <Text style={[ss.vLabel,{color:T.textMuted}]}>{AL.prayerVerse} — {AL.prayers[nextPrayer]}</Text>
          <Text style={[{fontSize:16,textAlign:'right',lineHeight:28,marginBottom:8},{color:T.accent}]}>{PRAYER_VERSES[nextPrayer].arabic}</Text>
          <Text style={[{fontSize:14,lineHeight:22,marginBottom:5},{color:T.text}]}>{PRAYER_VERSES[nextPrayer].albanian}</Text>
          <Text style={[{fontSize:11},{color:T.textMuted}]}>{PRAYER_VERSES[nextPrayer].ref}</Text>
        </View>
      )}
      <View style={[ss.vCard,{backgroundColor:T.card,borderColor:T.border}]}>
        <Text style={[ss.vLabel,{color:T.textMuted}]}>📜 {AL.dailyHadith}</Text>
        <Text style={[{fontSize:14,lineHeight:22,marginBottom:5,fontStyle:'italic'},{color:T.text}]}>"{todayHadith.text}"</Text>
        <Text style={[{fontSize:11},{color:T.textMuted}]}>— {todayHadith.source}</Text>
      </View>
    </View>
  );
}

function QiblaTab({T,qibla}){
  const spinAnim=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    if(qibla===null)return;
    Animated.timing(spinAnim,{toValue:qibla,duration:1500,useNativeDriver:true}).start();
  },[qibla]);
  const rotate=spinAnim.interpolate({inputRange:[0,360],outputRange:['180deg','540deg']});
  return(
    <View style={ss.pg}>
      <Text style={[ss.secTitle,{color:T.text}]}>{AL.qiblaDir}</Text>
      <View style={[ss.card,{backgroundColor:T.card,borderColor:T.border,alignItems:'center',padding:24}]}>
        <View style={[ss.compassRing,{borderColor:T.border}]}>
          {Array.from({length:72},(_,i)=>i*5).map(deg=>(
            <View key={deg} style={[ss.tick,{transform:[{rotate:`${deg}deg`}]}]}>
              <View style={{width:deg%90===0?3:1.5,height:deg%90===0?18:deg%45===0?12:6,borderRadius:1,backgroundColor:deg%90===0?T.accent:deg%45===0?T.textMuted:T.border}}/>
            </View>
          ))}
          {[['V',0],['L',90],['J',180],['P',270]].map(([l,d])=>(
            <View key={l} style={[ss.cardinal,{transform:[{rotate:`${d}deg`}]}]}>
              <Text style={[{fontSize:14,fontWeight:'800'},{color:d===0?T.accent:T.textMuted}]}>{l}</Text>
            </View>
          ))}
          <Animated.View style={[ss.needle,{transform:[{rotate}]}]}>
            <View style={[ss.kaabaBox,{backgroundColor:T.accent+'33',borderColor:T.accent}]}>
              <Text style={{fontSize:22}}>🕋</Text>
            </View>
            <View style={[{width:4,height:70,borderTopLeftRadius:2,borderTopRightRadius:2},{backgroundColor:T.accent}]}/>
            <View style={[{width:4,height:70,borderBottomLeftRadius:2,borderBottomRightRadius:2,opacity:0.4},{backgroundColor:T.textMuted}]}/>
          </Animated.View>
          <View style={[ss.centerDot,{backgroundColor:T.accent,borderColor:T.card}]}/>
        </View>
        {qibla!==null&&(
          <View style={{alignItems:'center',marginTop:18}}>
            <Text style={[{fontSize:38,fontWeight:'200'},{color:T.accent}]}>{Math.round(qibla)}°</Text>
            <Text style={[{fontSize:13,marginTop:3},{color:T.textMuted}]}>{AL.degrees}</Text>
            <View style={[{paddingHorizontal:16,paddingVertical:8,borderRadius:20,borderWidth:1,marginTop:10},{backgroundColor:T.accentSoft,borderColor:T.accent+'44'}]}>
              <Text style={[{fontSize:14,fontWeight:'700'},{color:T.accent}]}>🕋 Drejtimi i Mekes</Text>
            </View>
          </View>
        )}
      </View>
      <Text style={[{textAlign:'center',fontSize:12,lineHeight:18,paddingHorizontal:10,marginTop:8},{color:T.textMuted}]}>ℹ️ {AL.calibrate}</Text>
    </View>
  );
}

function ContentTab({T,contentTab,setContentTab,todayVerse,todayHadith,nextPrayer,monthCal,now}){
  const tabs2=[{k:'verse',l:'Ajete'},{k:'hadith',l:'Hadithe'},{k:'dua',l:'Dua'},{k:'zikir',l:'Zikir'},{k:'esmaul',l:'99 Emrat'},{k:'imsakiye',l:'Imsakija'}];
  return(
    <View style={ss.pg}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:14}}>
        <View style={[{flexDirection:'row',borderRadius:12,borderWidth:1,overflow:'hidden'},{backgroundColor:T.card,borderColor:T.border}]}>
          {tabs2.map(t=>(
            <TouchableOpacity key={t.k} style={[{paddingHorizontal:14,paddingVertical:11,alignItems:'center'},contentTab===t.k&&{borderBottomWidth:2,borderBottomColor:T.accent}]} onPress={()=>setContentTab(t.k)}>
              <Text style={[{fontSize:12,fontWeight:'600'},{color:contentTab===t.k?T.accent:T.textMuted}]}>{t.l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {contentTab==='verse'&&<VerseSection T={T} todayVerse={todayVerse} nextPrayer={nextPrayer}/>}
      {contentTab==='hadith'&&<HadithSection T={T} todayHadith={todayHadith}/>}
      {contentTab==='dua'&&<DuaSection T={T}/>}
      {contentTab==='zikir'&&<ZikirSection T={T}/>}
      {contentTab==='esmaul'&&<EsmaulSection T={T}/>}
      {contentTab==='imsakiye'&&<ImsakiyeSection T={T} monthCal={monthCal} now={now}/>}
    </View>
  );
}

function VerseSection({T,todayVerse,nextPrayer}){
  return(
    <View>
      <View style={[ss.bigCard,{backgroundColor:T.card,borderColor:T.border}]}>
        <Text style={[ss.bigLabel,{color:T.textMuted}]}>📖 {AL.dailyVerse}</Text>
        <Text style={[{fontSize:20,textAlign:'right',lineHeight:36,marginBottom:10},{color:T.accent}]}>{todayVerse.arabic}</Text>
        <Text style={[{fontSize:15,lineHeight:24,marginBottom:7},{color:T.text}]}>{todayVerse.albanian}</Text>
        <Text style={[{fontSize:12},{color:T.textMuted}]}>{todayVerse.ref}</Text>
      </View>
      <Text style={[ss.secTitle,{color:T.text,marginTop:18}]}>{AL.prayerVerse}</Text>
      {PRAYER_ORDER.filter(p=>p!=='Sunrise').map(p=>(
        <View key={p} style={[ss.smallCard,{backgroundColor:T.card,borderColor:T.border}]}>
          <Text style={[{fontSize:14,fontWeight:'700',marginBottom:5},{color:T.accent}]}>{ICONS[p]} {AL.prayers[p]}</Text>
          <Text style={[{fontSize:14,textAlign:'right',marginBottom:5,lineHeight:26},{color:T.accent}]}>{PRAYER_VERSES[p]?.arabic}</Text>
          <Text style={[{fontSize:13,lineHeight:20,marginBottom:3},{color:T.text}]}>{PRAYER_VERSES[p]?.albanian}</Text>
          <Text style={[{fontSize:11},{color:T.textMuted}]}>{PRAYER_VERSES[p]?.ref}</Text>
        </View>
      ))}
    </View>
  );
}

function HadithSection({T,todayHadith}){
  return(
    <View>
      <View style={[ss.bigCard,{backgroundColor:T.card,borderColor:T.border}]}>
        <Text style={[ss.bigLabel,{color:T.textMuted}]}>📜 {AL.dailyHadith}</Text>
        <Text style={[{fontSize:16,lineHeight:26,fontStyle:'italic',marginBottom:7},{color:T.text}]}>"{todayHadith.text}"</Text>
        <Text style={[{fontSize:12},{color:T.textMuted}]}>— {todayHadith.source}</Text>
      </View>
      <Text style={[ss.secTitle,{color:T.text,marginTop:18}]}>Hadithe të tjera</Text>
      {DAILY_HADITHS.map((h,i)=>(
        <View key={i} style={[ss.smallCard,{backgroundColor:T.card,borderColor:T.border}]}>
          <Text style={[{fontSize:14,lineHeight:22,fontStyle:'italic',marginBottom:4},{color:T.text}]}>"{h.text}"</Text>
          <Text style={[{fontSize:11},{color:T.textMuted}]}>— {h.source}</Text>
        </View>
      ))}
    </View>
  );
}

function DuaSection({T}){
  const [open,setOpen]=useState({});
  return(
    <View>
      <Text style={[ss.secTitle,{color:T.text}]}>{AL.duas}</Text>
      {DUAS.map((cat,ci)=>(
        <View key={ci} style={{marginBottom:8}}>
          <Text style={[{fontSize:16,fontWeight:'700',marginBottom:8},{color:T.accent}]}>{cat.category}</Text>
          {cat.items.map((dua,di)=>{
            const key=`${ci}-${di}`;const isOpen=open[key];
            return(
              <TouchableOpacity key={di} style={[ss.smallCard,{backgroundColor:T.card,borderColor:T.border}]} onPress={()=>setOpen(o=>({...o,[key]:!o[key]}))}>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                  <Text style={[{fontSize:14,fontWeight:'600',flex:1},{color:T.text}]}>{dua.title}</Text>
                  <Text style={[{fontSize:16},{color:T.accent}]}>{isOpen?'▲':'▼'}</Text>
                </View>
                {isOpen&&(
                  <View style={{marginTop:10}}>
                    <Text style={[{fontSize:16,textAlign:'right',lineHeight:30,marginBottom:8},{color:T.accent}]}>{dua.arabic}</Text>
                    <Text style={[{fontSize:13,lineHeight:20},{color:T.text}]}>{dua.albanian}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function ZikirSection({T}){
  const [selected,setSelected]=useState(0);
  const [count,setCount]=useState(0);
  const [target,setTarget]=useState(ZIKIR_LIST[0].target);
  const scaleAnim=useRef(new Animated.Value(1)).current;
  const zikir=ZIKIR_LIST[selected];
  const progress=Math.min(count/target,1);
  const done=count>=target;
  function onPress(){
    if(done)return;
    setCount(c=>c+1);
    Animated.sequence([
      Animated.timing(scaleAnim,{toValue:0.9,duration:60,useNativeDriver:true}),
      Animated.timing(scaleAnim,{toValue:1,duration:60,useNativeDriver:true}),
    ]).start();
  }
  function onSelect(i){setSelected(i);setCount(0);setTarget(ZIKIR_LIST[i].target);}
  return(
    <View>
      <Text style={[ss.secTitle,{color:T.text}]}>{AL.zikir}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:14}}>
        {ZIKIR_LIST.map((z,i)=>(
          <TouchableOpacity key={i} onPress={()=>onSelect(i)}
            style={[{paddingHorizontal:14,paddingVertical:8,borderRadius:20,marginRight:8,borderWidth:1},selected===i?{backgroundColor:T.accent,borderColor:T.accent}:{backgroundColor:T.card,borderColor:T.border}]}>
            <Text style={[{fontSize:13,fontWeight:'600'},{color:selected===i?'#fff':T.textMuted}]}>{z.albanian}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={[ss.card,{backgroundColor:T.card,borderColor:T.border,padding:24,alignItems:'center'}]}>
        <Text style={[{fontSize:22,textAlign:'center',lineHeight:40,marginBottom:4},{color:T.accent}]}>{zikir.arabic}</Text>
        <Text style={[{fontSize:16,textAlign:'center',fontWeight:'700',marginBottom:2},{color:T.text}]}>{zikir.albanian}</Text>
        <Text style={[{fontSize:12,textAlign:'center',marginBottom:16},{color:T.textMuted}]}>{zikir.meaning}</Text>
        <View style={[{width:'100%',height:8,borderRadius:4,overflow:'hidden'},{backgroundColor:T.border}]}>
          <View style={[{height:8,borderRadius:4},{backgroundColor:T.accent,width:`${progress*100}%`}]}/>
        </View>
        <Text style={[{textAlign:'center',fontSize:13,marginTop:6,marginBottom:20},{color:T.textMuted}]}>{count} / {target}</Text>
        {done
          ?<Text style={[{fontSize:24,textAlign:'center'},{color:T.accent}]}>{AL.completed}</Text>
          :<Animated.View style={{transform:[{scale:scaleAnim}]}}>
            <TouchableOpacity onPress={onPress} style={[ss.zikirBtn,{backgroundColor:T.accent}]}>
              <Text style={{fontSize:44}}>📿</Text>
            </TouchableOpacity>
          </Animated.View>
        }
        <TouchableOpacity onPress={()=>setCount(0)} style={[{marginTop:16,paddingHorizontal:20,paddingVertical:8,borderRadius:20,borderWidth:1},{borderColor:T.border}]}>
          <Text style={[{fontSize:13},{color:T.textMuted}]}>🔄 {AL.reset}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EsmaulSection({T}){
  return(
    <View>
      <Text style={[ss.secTitle,{color:T.text}]}>{AL.esmaulFull}</Text>
      {ESMAUL.map(e=>(
        <View key={e.n} style={[ss.smallCard,{backgroundColor:T.card,borderColor:T.border,flexDirection:'row',alignItems:'center',gap:12}]}>
          <View style={[ss.esmaulBadge,{backgroundColor:T.accentSoft}]}><Text style={[{fontSize:11,fontWeight:'700'},{color:T.accent}]}>{e.n}</Text></View>
          <View style={{flex:1}}>
            <Text style={[{fontSize:19,textAlign:'right',marginBottom:2},{color:T.accent}]}>{e.a}</Text>
            <Text style={[{fontSize:14,fontWeight:'600'},{color:T.text}]}>{e.t}</Text>
            <Text style={[{fontSize:12},{color:T.textMuted}]}>{e.m}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function ImsakiyeSection({T,monthCal,now}){
  const today=now.getDate();
  const months=['Janar','Shkurt','Mars','Prill','Maj','Qershor','Korrik','Gusht','Shtator','Tetor','Nëntor','Dhjetor'];
  if(!monthCal||monthCal.length===0)return<View style={ss.centered}><ActivityIndicator color={T.accent}/></View>;
  return(
    <View>
      <Text style={[ss.secTitle,{color:T.text}]}>{AL.imsakiye} — {months[now.getMonth()]}</Text>
      <View style={[ss.card,{backgroundColor:T.card,borderColor:T.border,overflow:'hidden'}]}>
        <View style={[{flexDirection:'row',paddingVertical:10,paddingHorizontal:4},{backgroundColor:T.accent}]}>
          {['Ditë','Sabahu','Dreka','Ikindia','Akshami','Jacia'].map(h=>(
            <Text key={h} style={[ss.imsCell,{color:'#fff',fontWeight:'700'}]}>{h}</Text>
          ))}
        </View>
        {monthCal.map((day,i)=>{
          const isToday=(i+1)===today;
          const t=day.timings;
          return(
            <View key={i} style={[{flexDirection:'row',paddingVertical:9,paddingHorizontal:4,borderBottomWidth:1},{borderBottomColor:T.border},isToday&&{backgroundColor:T.accentSoft}]}>
              <Text style={[ss.imsCell,{color:isToday?T.accent:T.text,fontWeight:isToday?'700':'400'}]}>{i+1}</Text>
              <Text style={[ss.imsCell,{color:isToday?T.accent:T.text}]}>{t.Fajr?.slice(0,5)}</Text>
              <Text style={[ss.imsCell,{color:isToday?T.accent:T.text}]}>{t.Dhuhr?.slice(0,5)}</Text>
              <Text style={[ss.imsCell,{color:isToday?T.accent:T.text}]}>{t.Asr?.slice(0,5)}</Text>
              <Text style={[ss.imsCell,{color:isToday?T.accent:T.text}]}>{t.Maghrib?.slice(0,5)}</Text>
              <Text style={[ss.imsCell,{color:isToday?T.accent:T.text}]}>{t.Isha?.slice(0,5)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SettingsTab({T,darkMode,setDarkMode,cityName,accentKey,setAccentKey,calcMethod,setCalcMethod,asrMethod,setAsrMethod}){
  const [showMethod,setShowMethod]=useState(false);
  return(
    <View style={ss.pg}>
      <Text style={[ss.secTitle,{color:T.text}]}>{AL.settings}</Text>
      <Text style={[ss.settSection,{color:T.textMuted}]}>🎨 Pamja</Text>
      <View style={[ss.card,{backgroundColor:T.card,borderColor:T.border,overflow:'hidden'}]}>
        <View style={[ss.settRow,{borderBottomColor:T.border}]}>
          <View style={{flexDirection:'row',alignItems:'center'}}><Text style={{fontSize:17,marginRight:10}}>🌙</Text><Text style={[{fontSize:15},{color:T.text}]}>{AL.darkMode}</Text></View>
          <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{false:'#555',true:T.accent+'88'}} thumbColor={darkMode?T.accent:'#eee'}/>
        </View>
        <View style={[{paddingVertical:14,paddingHorizontal:15}]}>
          <Text style={[{fontSize:15,marginBottom:12},{color:T.text}]}>🎨 {AL.themeColor}</Text>
          <View style={{flexDirection:'row',gap:12}}>
            {Object.entries(ACCENTS).map(([key,val])=>(
              <TouchableOpacity key={key} onPress={()=>setAccentKey(key)}
                style={[{width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center'},{backgroundColor:val.color},accentKey===key&&{borderWidth:3,borderColor:'#fff'}]}>
                {accentKey===key&&<Text style={{fontSize:12,color:'#fff',fontWeight:'900'}}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      <Text style={[ss.settSection,{color:T.textMuted}]}>🕌 Cilësimet e Namazit</Text>
      <View style={[ss.card,{backgroundColor:T.card,borderColor:T.border,overflow:'hidden'}]}>
        <TouchableOpacity style={[ss.settRow,{borderBottomColor:T.border}]} onPress={()=>setShowMethod(true)}>
          <View style={{flex:1}}>
            <Text style={[{fontSize:15},{color:T.text}]}>⚙️ {AL.calcMethod}</Text>
            <Text style={[{fontSize:12,marginTop:3},{color:T.accent}]}>{CALC_METHODS.find(m=>m.id===calcMethod)?.name}</Text>
          </View>
          <Text style={[{fontSize:16},{color:T.textMuted}]}>›</Text>
        </TouchableOpacity>
        <View style={[ss.settRow,{borderBottomWidth:0}]}>
          <Text style={[{fontSize:15},{color:T.text}]}>🕐 {AL.asrMethod}</Text>
          <View style={{flexDirection:'row',gap:8}}>
            {[{v:0,l:AL.shafi},{v:1,l:AL.hanafi}].map(opt=>(
              <TouchableOpacity key={opt.v} onPress={()=>setAsrMethod(opt.v)}
                style={[{paddingHorizontal:12,paddingVertical:6,borderRadius:16,borderWidth:1},asrMethod===opt.v?{backgroundColor:T.accent,borderColor:T.accent}:{borderColor:T.border}]}>
                <Text style={[{fontSize:12,fontWeight:'600'},{color:asrMethod===opt.v?'#fff':T.textMuted}]}>{opt.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      <Text style={[ss.settSection,{color:T.textMuted}]}>📍 Vendndodhja</Text>
      <View style={[ss.card,{backgroundColor:T.card,borderColor:T.border}]}>
        <View style={[ss.settRow,{borderBottomWidth:0}]}>
          <Text style={[{fontSize:15},{color:T.text}]}>{cityName||'—'}</Text>
          <Text style={[{fontSize:12},{color:T.textMuted}]}>GPS automatik</Text>
        </View>
      </View>
      <View style={[{borderRadius:14,borderWidth:1,padding:18,alignItems:'center',marginTop:16},{backgroundColor:T.card,borderColor:T.border}]}>
        <Text style={[{fontSize:18,fontWeight:'700',marginBottom:8},{color:T.accent}]}>🕌 {AL.appName}</Text>
        <Text style={[{fontSize:13,lineHeight:20,textAlign:'center'},{color:T.textMuted}]}>Aplikacion islamik për komunitetin shqiptar.</Text>
        <Text style={[{fontSize:11,marginTop:10},{color:T.textMuted}]}>Versioni 3.0.0 • AlAdhan API</Text>
      </View>
      <Modal visible={showMethod} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <View style={[ss.modalBox,{backgroundColor:T.surface,borderColor:T.border}]}>
            <Text style={[{fontSize:18,fontWeight:'700',marginBottom:16},{color:T.text}]}>{AL.calcMethod}</Text>
            {CALC_METHODS.map(m=>(
              <TouchableOpacity key={m.id} onPress={()=>{setCalcMethod(m.id);setShowMethod(false);}}
                style={[{paddingVertical:14,paddingHorizontal:8,borderBottomWidth:1,flexDirection:'row',alignItems:'center'},{borderBottomColor:T.border},calcMethod===m.id&&{backgroundColor:T.accentSoft}]}>
                <Text style={[{fontSize:14,flex:1},{color:calcMethod===m.id?T.accent:T.text}]}>{m.name}</Text>
                {calcMethod===m.id&&<Text style={[{fontSize:16},{color:T.accent}]}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={()=>setShowMethod(false)} style={[{marginTop:16,padding:14,borderRadius:14,alignItems:'center'},{backgroundColor:T.accent}]}>
              <Text style={{color:'#fff',fontWeight:'700',fontSize:15}}>Mbyll</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ss = StyleSheet.create({
  root:{flex:1},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:18,paddingTop:Platform.OS==='ios'?50:28,paddingBottom:12,borderBottomWidth:1},
  appName:{fontSize:20,fontWeight:'800',letterSpacing:0.5},
  cityRow:{fontSize:12,marginTop:2},
  fridayBadge:{fontSize:11,fontWeight:'700',paddingHorizontal:8,paddingVertical:2,borderRadius:8,marginTop:4},
  centered:{alignItems:'center',justifyContent:'center',paddingTop:80,paddingBottom:40},
  pg:{padding:15,paddingBottom:110},
  fridayBanner:{borderRadius:14,borderWidth:1,padding:16,marginBottom:14},
  clockCard:{borderRadius:14,borderWidth:1,padding:18,alignItems:'center',marginBottom:13},
  clockTime:{fontSize:44,fontWeight:'200',letterSpacing:2},
  nextCard:{borderRadius:14,borderWidth:1,padding:15,flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:13},
  smallLabel:{fontSize:10,textTransform:'uppercase',letterSpacing:1,marginBottom:3},
  card:{borderRadius:14,borderWidth:1,marginBottom:13},
  pRow:{flexDirection:'row',alignItems:'center',paddingVertical:12,paddingHorizontal:14},
  dot:{width:7,height:7,borderRadius:3.5},
  vCard:{borderRadius:14,borderWidth:1,padding:15,marginBottom:11},
  vLabel:{fontSize:10,textTransform:'uppercase',letterSpacing:1,marginBottom:8},
  secTitle:{fontSize:20,fontWeight:'700',marginBottom:12},
  compassRing:{width:260,height:260,borderRadius:130,borderWidth:1.5,alignItems:'center',justifyContent:'center',position:'relative'},
  tick:{position:'absolute',width:260,height:260,alignItems:'center',justifyContent:'flex-start',paddingTop:4},
  cardinal:{position:'absolute',width:260,height:260,alignItems:'center',justifyContent:'flex-start',paddingTop:20},
  needle:{position:'absolute',width:10,height:210,alignItems:'center',justifyContent:'flex-start'},
  kaabaBox:{width:40,height:40,borderRadius:10,borderWidth:1.5,alignItems:'center',justifyContent:'center',marginBottom:2},
  centerDot:{position:'absolute',width:16,height:16,borderRadius:8,borderWidth:3},
  bigCard:{borderRadius:14,borderWidth:1,padding:18,marginBottom:10},
  bigLabel:{fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:12},
  smallCard:{borderRadius:12,borderWidth:1,padding:14,marginBottom:9},
  zikirBtn:{width:120,height:120,borderRadius:60,alignItems:'center',justifyContent:'center',elevation:8,shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:8},
  esmaulBadge:{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center'},
  imsCell:{flex:1,fontSize:11,textAlign:'center'},
  settSection:{fontSize:12,textTransform:'uppercase',letterSpacing:1,marginBottom:8,marginTop:14,marginLeft:2},
  settRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:14,paddingHorizontal:15,borderBottomWidth:1},
  modalOverlay:{flex:1,backgroundColor:'#00000088',justifyContent:'flex-end'},
  modalBox:{borderTopLeftRadius:20,borderTopRightRadius:20,borderWidth:1,padding:20},
  tabBar:{flexDirection:'row',borderTopWidth:1,paddingBottom:Platform.OS==='ios'?24:6,paddingTop:8,position:'absolute',bottom:0,left:0,right:0},
  tabItem:{flex:1,alignItems:'center'},
  tabLabel:{fontSize:10,marginTop:3,fontWeight:'600'},
});