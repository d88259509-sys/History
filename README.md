# Tarix by Muhammad Ayubxon

**Tarix by Muhammad Ayubxon** — Zamonaviy va qulay tarix fanini chuqur o'rganish bo'yicha to'liq funktsional (full-stack) onlayn ta'lim platformasi. Platforma O'zbekiston va jahon tarixi darsliklari, audio-vizual materiallar, 6 xonali maxfiy kod bilan himoyalangan onlayn sinov testlari hamda ilmiy tahlillarni o'z ichiga oladi.

---

## 🌟 Asosiy Imkoniyatlar

1. **Darsliklar (Darsliklar & Ma'ruzalar)**
   - O'zbekiston tarixi davrlari (Temuriylar davri, Qadimgi dunyo, Sharq Renessansi, Jadidchilik va boshqalar);
   - Rich-text formatlash, rasmlar, iqtiboslar, YouTube orqali video darslar va yuklab olinadigan PDF materiallar;
   - Talabalar uchun darsni "O'zlashtirildi" deb belgilash va umumiy kurs progress bar (o'zlashtirish foizi);
   - Oldingi va keyingi darsga o'tish (navigatsiya).

2. **Testlar Tizimi (Nazorat & Baholash)**
   - 6 xonali unikal test kodi (masalan: `TEMUR1`, `IPAK99`, `TARIX7`);
   - Jonli teskari vaqt hisoblagichi (Countdown Timer) va vaqt tugaganda avtomatik yakunlash;
   - 4 xil turdagi savollar:
     - Bitta to'g'ri javobli (Single choice)
     - Bir nechta to'g'ri javobli (Multiple choice)
     - To'g'ri / Noto'g'ri (True / False)
     - Qisqa yozma javob (Short text answer)
   - **Xavfsiz server baholash:** To'g'ri javoblar hech qachon mijozga yuborilmaydi, ball va foizlar faqat serverda hisoblanadi;
   - Test topshirilgach konfetti effekti, to'plangan ball, o'tish holati va har bir savol bo'yicha ilmiy izoh (explanation);
   - "Mening natijalarim" sahifasida barcha urinishlar tarixi.

3. **Ustoz (O'qituvchi / Admin) Boshqaruv Paneli**
   - Darsliklar yaratish, tahrirlash, o'chirish va tartibini o'zgartirish;
   - Testlar tuzish, vaqt va o'tish balini belgilash, savollar qo'shish;
   - Unikal 6 xonali kodlarni yangilash (regenerate) va nusxalash;
   - Talabalar natijalarini ko'rish, har bir savol bo'yicha to'g'ri javob berish aniqligi (savollar tahlili);
   - Natijalarni **CSV (Excel)** formatida UTF-8 BOM bilan yuklab olish (o'zbek va rus harflarini to'g'ri ochadi).

4. **Ko'p tilli (i18n)**
   - 🇺🇿 O'zbekcha (Lotin)
   - 🇬🇧 English
   - 🇷🇺 Русский
   - Til tanlash navigatsiyada joylashgan va `localStorage` hamda foydalanuvchi profilida saqlanadi.

5. **Mavzular (Light & Dark Theme)**
   - Elegant tarixiy kolorit: pergament va toza qora ranglar, oltin (amber) aksentlar, serif shriftlar.

---

## 🔑 Dastlabki Tizim Hisoblari (Default Seed Credentials)

Dastur birinchi marta ishga tushganda ma'lumotlar bazasi avtomatik yaratiladi va quyidagi hisoblar kiritiladi:

### 👑 Ustoz (Muhammad Ayubxon) Maxsus Hisobi:
- **Login:** `muhammadayubxon`
- **Parol:** `ustoz_ma`
- **Rol:** `teacher` (Ustoz paneli, darsliklar & testlarni boshqarish, Rasch modeli tahlili)

### 🎓 Talaba (Student) Hisobi:
- **Email:** `student@tarix.uz`
- **Parol:** `TarixStudent2026!`
- **Rol:** `student` (Darsliklarni o'rganish, test topshirish, shaxsiy natijalar)

*(Ustoz paneli faqat `muhammadayubxon` hisobi orqali ochiladi. Yangi ro'yxatdan o'tuvchilar avtomatik tarzda Talaba hisobiga ega bo'ladilar).*

---

## 🚀 O'rnatish va Ishga Tushirish

1. Bog'liqliklarni o'rnating:
```bash
npm install
```

2. `.env` faylini tekshiring:
```env
PORT=3000
TEACHER_SECRET_CODE="AYUBXON_USTOZ_2026"
JWT_SECRET="tarix_secret_jwt_key_ayubxon_2026"
```

3. Dasturni ishga tushirish (Full-stack bitta buyruq bilan):
```bash
npm run dev
```
Dastur `http://localhost:3000` manzilida ishga tushadi.

4. Ishlab chiqarish (Production) uchun build qilish:
```bash
npm run build
npm start
```

---

## 📁 Loyiha Tuzilmasi

```
├── server.ts                 # Express full-stack server + Vite dev middleware
├── server/
│   ├── db.ts                 # SQLite (sql.js) ma'lumotlar bazasi & seed
│   ├── auth.ts               # JWT autentifikatsiya & RBAC rollar tekshiruvi
│   ├── rateLimit.ts          # Brute-force himoyasi uchun rate limiter
│   └── routes/
│       ├── auth.ts           # Login, Register, Profile, Password API
│       ├── lessons.ts        # Darsliklar CRUD, progress API
│       ├── tests.ts          # Testlar CRUD, kod tekshirish, savollar, baholash
│       └── stats.ts          # Dashboard tahlillari va CSV eksport
├── src/
│   ├── types.ts              # TypeScript interfeyslari
│   ├── i18n/                 # O'zbek, Rus va Ingliz tarjima lug'atlari
│   ├── context/              # Auth, Theme va Toast Context provayderlari
│   ├── components/           # Navbar, Footer, Modal, RichContent
│   └── pages/                # Barcha sahifalar (Home, Lessons, Tests, Dashboard va b.)
├── data/
│   └── tarix.sqlite          # Real SQLite faylli ma'lumotlar bazasi
└── metadata.json             # AI Studio loyiha metama'lumotlari
```
