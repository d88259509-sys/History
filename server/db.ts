import initSqlJs, { Database, QueryExecResult } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'tarix.sqlite');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Failed to load existing SQLite database, creating fresh one:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initTables(dbInstance);
  await seedInitialData(dbInstance);
  saveDb(dbInstance);

  return dbInstance;
}

export function saveDb(db: Database = dbInstance!): void {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

function initTables(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('teacher', 'student')),
      preferred_language TEXT DEFAULT 'uz',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      short_description TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      attachment_name TEXT,
      attachment_url TEXT,
      youtube_video_id TEXT,
      order_index INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      content_language TEXT DEFAULT 'uz',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lesson_completions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      UNIQUE(user_id, lesson_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      access_code TEXT NOT NULL UNIQUE,
      time_limit_minutes INTEGER DEFAULT 20,
      passing_score INTEGER DEFAULT 60,
      is_active INTEGER DEFAULT 1,
      allow_retakes INTEGER DEFAULT 1,
      shuffle_questions INTEGER DEFAULT 1,
      show_explanations INTEGER DEFAULT 1,
      content_language TEXT DEFAULT 'uz',
      start_date TEXT,
      end_date TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL CHECK(question_type IN ('single', 'multiple', 'true_false', 'text')),
      options_json TEXT NOT NULL,
      correct_answers_json TEXT NOT NULL,
      points INTEGER DEFAULT 1,
      explanation TEXT,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY(test_id) REFERENCES tests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_attempts (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      score REAL NOT NULL,
      total_points REAL NOT NULL,
      percent REAL NOT NULL,
      passed INTEGER NOT NULL,
      time_spent_seconds INTEGER NOT NULL,
      student_answers_json TEXT NOT NULL,
      question_results_json TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      FOREIGN KEY(test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

// Helpers for querying
export function queryAll<T = any>(db: Database, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T = any>(db: Database, sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function execute(db: Database, sql: string, params: any[] = []): void {
  const stmt = db.prepare(sql);
  stmt.run(params);
  stmt.free();
  saveDb(db);
}

async function seedInitialData(db: Database) {
  const existingUsers = queryAll(db, 'SELECT COUNT(*) as count FROM users');
  if (existingUsers[0]?.count > 0) {
    return;
  }

  console.log('Seeding initial database for Tarix by Muhammad Ayubxon...');

  // 1. Seed Teacher and Student
  const teacherPasswordHash = await bcrypt.hash('TarixTeacher2026!', 10);
  const studentPasswordHash = await bcrypt.hash('TarixStudent2026!', 10);
  const now = new Date().toISOString();

  execute(db, `
    INSERT INTO users (id, name, email, password_hash, role, preferred_language, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    'usr_teacher_01',
    'Muhammad Ayubxon (Ustoz)',
    'teacher@tarix.uz',
    teacherPasswordHash,
    'teacher',
    'uz',
    now
  ]);

  execute(db, `
    INSERT INTO users (id, name, email, password_hash, role, preferred_language, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    'usr_student_01',
    'Alisher Qodirov (Talaba)',
    'student@tarix.uz',
    studentPasswordHash,
    'student',
    'uz',
    now
  ]);

  // 2. Seed Rich Lessons
  const sampleLessons = [
    {
      id: 'lsn_01',
      title: 'Amir Temur va Temuriylar davlati: Markazlashgan saltanatning yuksalishi',
      short_description: 'Sohibqiron Amir Temurning davlat boshqaruvi, harbiy san\'ati va "Temur tuzuklari" asarining ahamiyati.',
      category: 'Temuriylar Davri (XIV-XV asrlar)',
      order_index: 1,
      is_published: 1,
      content_language: 'uz',
      youtube_video_id: 'e_rO9Yw-fS8',
      attachment_name: 'Temur_Tuzuklari_Asosiy_Qoidalar.pdf',
      attachment_url: 'https://example.com/materials/temur_tuzuklari.pdf',
      content: `<h2>Sohibqiron Amir Temur (1336–1405)</h2>
<p>Amir Temur Kesh (hozirgi Shahrisabz) yaqinidagi Xo'ja Ilg'or qishlog'ida barlos beklari xonadonida tavallud topgan. U parokanda bo'lib ketgan Movarounnahr zaminini birlashtirib, dunyodagi eng qudratli markazlashgan davlatlardan biriga asos soldi.</p>

<h3>1. "Temur tuzuklari" – Davlatchilik qonunnomasi</h3>
<p>Amir Temurning davlat boshqaruvi va harbiy san'atga oid falsafiy-huquqiy asari <strong>"Temur tuzuklari"</strong> hisoblanadi. Unda quyidagi mashhur shior ilgari surilgan:</p>
<blockquote><em>"Kuch — adolatdadir!" (Rosti-rusti)</em></blockquote>
<p>Asarda davlat ustunlari quyidagi asoslarga tayangan:</p>
<ul>
  <li><strong>Adolat va qonun ustuvorligi:</strong> Mansabdorlar o'z vazifalarini mas'uliyat bilan bajarishi;</li>
  <li><strong>Kengash va tadbir:</strong> Har qanday muhim yurish yoki islohotdan oldin olimlar va tajribali beklarning kengashini o'tkazish;</li>
  <li><strong>Ilm-fan va hunarmandchilikni qo'llab-quvvatlash:</strong> Samarqand, Kesh, Buxoroda bunyodkorlik ishlarining avj olishi.</li>
</ul>

<h3>2. Harbiy san'at va sarkardalik mahorati</h3>
<p>Amir Temur qo'shini qat'iy intizomga asoslangan bo'lib, o'nlik, yuzlik, minglik va tumanlarga (o'n minglik) bo'lingan. Jang maydonida 7 ta asosiy bo'linmadan iborat mukammal jangovar tartib qo'llanilgan:</p>
<ol>
  <li>Qorovul (avangard)</li>
  <li>Qalb (markaziy qo'shin)</li>
  <li>O'ng qanot (barang'ar)</li>
  <li>Chap qanot (javang'ar)</li>
  <li>Qo'shimcha madad qismlari (kambal va otliq qo'riqchilar)</li>
</ol>

<h3>3. Me'morchilik va Temuriylar Renessansi</h3>
<p>Samarqand saltanat poytaxtiga aylantirilib, dunyoning eng go'zal shahriga aylantirildi. <strong>Bibixonim masjidi</strong>, <strong>Go'ri Amir maqbarasi</strong>, <strong>Shohi Zinda</strong> me'moriy majmuasi hamda Shahrisabzdagi muazzam <strong>Oqsroy</strong> saroyi aynan shu davrning yuksak yodgorliklaridir.</p>`
    },
    {
      id: 'lsn_02',
      title: 'Buyuk Ipak Yo\'li va O\'zbekiston hududidagi qadimiy sivilizatsiyalar',
      short_description: 'Sharq va G\'arbni bog\'lagan xalqaro savdo arteriyasi hamda So\'g\'diyona, Baqtriya va Xorazm madaniy aloqalari.',
      category: 'Qadimgi Dunyo va Ilk O\'rta Asrlar',
      order_index: 2,
      is_published: 1,
      content_language: 'uz',
      youtube_video_id: '9lT63uGjS34',
      attachment_name: 'Buyuk_Ipak_Yoli_Xaritasi.pdf',
      attachment_url: 'https://example.com/materials/silk_road_map.pdf',
      content: `<h2>Buyuk Ipak Yo'lining vujudga kelishi</h2>
<p>Miloddan avvalgi II asrda Xitoy elchisi Chjan Syan sayohatidan so'ng muntazam ishlay boshlagan Buyuk Ipak Yo'li nafaqat ipak va ziravorlar savdosi, balki jahon sivilizatsiyalari dialogi markazi bo'lgan.</p>

<h3>1. So'g'diylar — Ipak yo'lining asosiy vositachilari</h3>
<p>O'zbekiston hududida yashagan <strong>so'g'diylar</strong> savdo karvonlarining eng mohir boshqaruvchilari bo'lishgan. Ular Xitoydan tortib Vizantiya chegaralarigacha savdo koloniyalarini tashkil etganlar.</p>
<ul>
  <li><strong>Afrosiyob devoriy suratlari:</strong> Samarqanddagi Afrosiyob muzeyida saqlanayotgan mashhur freskalarda Koreya, Xitoy va Chag'oniyon elchilarining qabul marosimlari tasvirlangan.</li>
  <li><strong>Til va yozuv:</strong> So'g'd tili butun Markaziy Osiyo va Ipak yo'li bo'ylab xalqaro muomala tili (lingua franca) vazifasini bajargan.</li>
</ul>

<h3>2. Qadimgi Baqtriya va Xorazm tamadduni</h3>
<p>Surxondaryo viloyatidagi <em>Dalvarzintepa</em>, <em>Xolchayon</em> va Qoraqalpog'istondagi <em>Tuproqqal'a</em>, <em>Qo'yqirilganqal'a</em> yodgorliklari bu hududlarda yuksak shaharsozlik, astronomiya va metallurgiya rivojlanganidan dalolat beradi.</p>`
    },
    {
      id: 'lsn_03',
      title: 'Zahiriddin Muhammad Bobur va Boburiylar imperiyasi',
      short_description: 'Andijon farzandi Bobur Mirzoning hayoti, "Boburnoma" asari va Hindistonda qudratli saltanat barpo etilishi.',
      category: 'Yangi Davr Davlatchiligi (XVI-XVIII asrlar)',
      order_index: 3,
      is_published: 1,
      content_language: 'uz',
      youtube_video_id: 'vn-2aL3_cM4',
      attachment_name: 'Boburnoma_Tahlili.pdf',
      attachment_url: 'https://example.com/materials/boburnoma_overview.pdf',
      content: `<h2>Zahiriddin Muhammad Bobur (1483–1530)</h2>
<p>Temuriylar sulolasining yorqin vakili, buyuk shoir, sarkarda va davlat arbobi Zahiriddin Muhammad Bobur Andijon hokimi Umarshayx Mirzoning to'ng'ich o'g'li bo'lgan.</p>

<h3>1. 1526-yil Panipat jangi</h3>
<p>Bobur Mirzo zamonaviy harbiy taktikani, jumladan to'p va mushaklar (o't sochuvchi qurollar) hamda mashhur <em>"To'lg'ama"</em> usulini qo'llab, Ibrohim Lo'diyning ulkan qo'shinini mag'lubiyatga uchratdi va Dehli hamda Agrani egalladi.</p>

<h3>2. "Boburnoma" qomusi</h3>
<p>"Boburnoma" — jahon adabiyotidagi eng nodir memuar va geografik-tarixiy asarlardan biri. Unda Bobur O'rta Osiyo, Afg'oniston va Hindistonning tabiati, o'simlik dunyosi, xalqlari, urf-odatlari va tarixiy shaxslariga xolis va teran baho bergan.</p>

<h3>3. Toj Mahal va Boburiylar me'moriy merosi</h3>
<p>Bobur asos solgan saltanat keyinchalik Akbarshoh va Shohjahon davrida o'zining oltin asrini o'tkazdi. Agra shahridagi dunyoning 7 mo'jizasidan biri hisoblangan <strong>Toj Mahal</strong> majmuasi Temuriylar me'moriy an'analarining Hindistondagi cho'qqisidir.</p>`
    },
    {
      id: 'lsn_04',
      title: 'Sharq Uyg\'onish Davri (Birinchi va Ikkinchi Renessans)',
      short_description: 'Al-Xorazmiy, Ibn Sino, Abu Rayhon Beruniy va Mirzo Ulug\'bekning jahon sivilizatsiyasiga qo\'shgan buyuk hissasi.',
      category: 'Sharq Renessansi va Ilm-fan',
      order_index: 4,
      is_published: 1,
      content_language: 'uz',
      youtube_video_id: 'pD0b7P_F39w',
      attachment_name: 'Sharq_Allomalari_Ilmiy_Kashfiyotlar.pdf',
      attachment_url: 'https://example.com/materials/oriental_scholars.pdf',
      content: `<h2>Jahon ilm-fani beshigi</h2>
<p>IX-XII asrlarda (Birinchi Renessans) va XIV-XV asrlarda (Ikkinchi Renessans) O'zbekiston zamini butun dunyo aql-zakovat markaziga aylandi.</p>

<h3>Buyuk daho allomalar:</h3>
<ul>
  <li><strong>Muhammad ibn Muso al-Xorazmiy:</strong> Algebra fanining asoschisi ("Al-Jabr"). Algoritm tushunchasi uning nomi bilan bog'liq.</li>
  <li><strong>Abu Rayhon Beruniy:</strong> Yer radiusini aniq hisoblab chiqqan, Yerning Quyosh atrofida aylanishini taxmin qilgan va Kolumbdan 500 yil oldin Amerika qit'asi mavjudligini ilmiy bashorat qilgan olim.</li>
  <li><strong>Abu Ali ibn Sino (Avitsenna):</strong> "Tib qonunlari" asari bir necha asr davomida Yevropa universitetlarida asosiy tibbiyot darsligi bo'lib xizmat qilgan.</li>
  <li><strong>Mirzo Ulug'bek:</strong> Samarqand rasadxonasida 1018 ta yulduzning aniq harakat jadvali — "Ziji Ko'ragoniy"ni yaratgan tengsiz munajjim va hukmdor.</li>
</ul>`
    },
    {
      id: 'lsn_05',
      title: 'Turk Xoqonligi va Markaziy Osiyo qavmlarining birlashuvi',
      short_description: 'Buyuk Turk xoqonligining tashkil topishi, O\'rxun-Enasoy toshbitiklari va Kultegin yodgorligi.',
      category: 'Qadimgi Dunyo va Ilk O\'rta Asrlar',
      order_index: 5,
      is_published: 1,
      content_language: 'uz',
      youtube_video_id: '',
      attachment_name: 'Kul_Tegin_Bitiklari.pdf',
      attachment_url: 'https://example.com/materials/kultegin.pdf',
      content: `<h2>Turk Xoqonligi (552–744)</h2>
<p>Bumin xoqon va Istami xoqon boshchiligida Oltoy tog'larida vujudga kelgan Turk xoqonligi Tinch okeanidan Qora dengizgacha cho'zilgan ulkan imperiyaga aylandi.</p>
<p>Kultegin, Bilga xoqon va To'nyuquq toshbitiklari qadimgi turkiy yozuvning va vatanparvarlik g'oyalarining buyuk durdonalaridir.</p>`
    },
    {
      id: 'lsn_06',
      title: 'Jadidchilik harakati: Milliy uyg\'onish va ma\'rifatparvarlik',
      short_description: 'XIX asr oxiri va XX asr boshlarida Turkistonda ta\'lim, matbuot va milliy ozodlik uchun kurashgan fidoyi jadidlar.',
      category: 'Yangi Davr va Milliy Uyg\'onish',
      order_index: 6,
      is_published: 1,
      content_language: 'uz',
      youtube_video_id: '',
      attachment_name: 'Jadidlar_Merosi.pdf',
      attachment_url: 'https://example.com/materials/jadidlar.pdf',
      content: `<h2>"Tarbiya biz uchun yo hayot — yo mamot..."</h2>
<p>Mahmudxo'ja Behbudiy, Munavvarqori Abdurashidxonov, Abdurauf Fitrat, Abdulla Avloniy va Cho'lpon boshchiligidagi jadidlar xalqni jaholatdan qutqarish uchun <strong>yangi usul (usuli jadid)</strong> maktablarini ochdilar.</p>
<p>Ular teatr, gazeta va darsliklar orqali jamiyatni modernizatsiya qilish hamda mustaqillik yo'lida mislsiz xizmat ko'rsatdilar.</p>`
    }
  ];

  for (const l of sampleLessons) {
    execute(db, `
      INSERT INTO lessons (
        id, title, short_description, category, content, attachment_name,
        attachment_url, youtube_video_id, order_index, is_published, content_language,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      l.id, l.title, l.short_description, l.category, l.content, l.attachment_name,
      l.attachment_url, l.youtube_video_id, l.order_index, l.is_published, l.content_language,
      now, now
    ]);
  }

  // Mark 1 lesson as completed by sample student
  execute(db, `
    INSERT INTO lesson_completions (id, user_id, lesson_id, completed_at)
    VALUES (?, ?, ?, ?)
  `, ['comp_01', 'usr_student_01', 'lsn_01', now]);

  // 3. Seed Realistic Tests with Unique 6-character codes
  const sampleTests = [
    {
      id: 'tst_01',
      title: 'Amir Temur davri va Temuriylar saltanati bo\'yicha test',
      description: 'Sohibqiron Amir Temurning davlat siyosati, "Temur tuzuklari", harbiy tuzilmasi va me\'morchilik yodgorliklari bo\'yicha bilimlarni tekshirish.',
      access_code: 'TEMUR1',
      time_limit_minutes: 15,
      passing_score: 70,
      is_active: 1,
      allow_retakes: 1,
      shuffle_questions: 1,
      show_explanations: 1,
      content_language: 'uz',
      created_by: 'usr_teacher_01',
      questions: [
        {
          id: 'q_01_1',
          question_text: 'Amir Temurning davlat boshqaruvidagi bosh shiori qaysi edi?',
          question_type: 'single',
          options: [
            { id: 'opt_1', text: 'Kuch — adolatdadir (Rosti-rusti)' },
            { id: 'opt_2', text: 'Qilich kuchli bo\'lsa, yurt tinch bo\'lur' },
            { id: 'opt_3', text: 'Boylik va qudrat saltanat asosidir' },
            { id: 'opt_4', text: 'Tinchlik istasang, jangga shay tur' }
          ],
          correct_answers: ['opt_1'],
          points: 5,
          explanation: '"Temur tuzuklari" asarida bayon qilinganidek, Sohibqiron saltanatining bosh shiori va ustuni "Kuch — adolatdadir" hisoblangan.'
        },
        {
          id: 'q_01_2',
          question_text: 'Amir Temur qo\'shinining asosiy harbiy qismlarini to\'g\'ri tanlang (bir nechta to\'g\'ri javob):',
          question_type: 'multiple',
          options: [
            { id: 'opt_m1', text: 'Qalb (markaziy qism)' },
            { id: 'opt_m2', text: 'Barang\'ar (o\'ng qanot)' },
            { id: 'opt_m3', text: 'Javang\'ar (chap qanot)' },
            { id: 'opt_m4', text: 'Falanx (yunoncha to\'rtburchak saf)' }
          ],
          correct_answers: ['opt_m1', 'opt_m2', 'opt_m3'],
          points: 5,
          explanation: 'Temur qo\'shini 7 qismli jangovar tartibdan iborat bo\'lib, Qalb, Barang\'ar va Javang\'ar uning asosiy bo\'linmalari sanalgan. Falanx esa qadimgi Yunoniston safiga tegishli.'
        },
        {
          id: 'q_01_3',
          question_text: 'Amir Temurning Shahrisabzda bunyod etgan muazzam saroyi Oqsroy deb atalgan.',
          question_type: 'true_false',
          options: [
            { id: 'true', text: 'To\'g\'ri' },
            { id: 'false', text: 'Noto\'g\'ri' }
          ],
          correct_answers: ['true'],
          points: 5,
          explanation: 'Haqiqatan ham, Amir Temur vataniga ehtirom ramzi sifatida Keshda muhtasham Oqsroy saroyini barpo ettirgan.'
        },
        {
          id: 'q_01_4',
          question_text: 'Amir Temur saltanatining bosh poytaxti qaysi shahar bo\'lgan? (Qisqa matnli javob)',
          question_type: 'text',
          options: [],
          correct_answers: ['samarqand', 'samarkand', 'samarqand shahri'],
          points: 5,
          explanation: 'Amir Temur davlatining poytaxti "Sayqali ro\'yi zamin" deb atalgan azim Samarqand shahri bo\'lgan.'
        }
      ]
    },
    {
      id: 'tst_02',
      title: 'Buyuk Ipak Yo\'li va Qadimgi Sivilizatsiyalar',
      description: 'So\'g\'d savdogarlari, qadimgi Baqtriya, Xorazm xaritalari va madaniy almashinuv.',
      access_code: 'IPAK99',
      time_limit_minutes: 20,
      passing_score: 60,
      is_active: 1,
      allow_retakes: 1,
      shuffle_questions: 1,
      show_explanations: 1,
      content_language: 'uz',
      created_by: 'usr_teacher_01',
      questions: [
        {
          id: 'q_02_1',
          question_text: 'Buyuk Ipak Yo\'lida asosiy xalqaro vositachi va savdogar sifatida tanilgan O\'rta Osiyo xalqi qaysi?',
          question_type: 'single',
          options: [
            { id: 'opt_1', text: 'So\'g\'diylar' },
            { id: 'opt_2', text: 'Finikiyaliklar' },
            { id: 'opt_3', text: 'Vikinglar' },
            { id: 'opt_4', text: 'Rimliklar' }
          ],
          correct_answers: ['opt_1'],
          points: 10,
          explanation: 'So\'g\'diylar Xitoydan tortib Vizantiyagacha bo\'lgan oraliqda karvon yo\'llarini boshqaruvchi asosiy etnos bo\'lgan.'
        },
        {
          id: 'q_02_2',
          question_text: 'Mashhur elchilar tasvirlangan Afrosiyob devoriy suratlari qaysi shaharda topilgan?',
          question_type: 'single',
          options: [
            { id: 'opt_1', text: 'Samarqand' },
            { id: 'opt_2', text: 'Buxoro' },
            { id: 'opt_3', text: 'Xiva' },
            { id: 'opt_4', text: 'Termiz' }
          ],
          correct_answers: ['opt_1'],
          points: 10,
          explanation: 'Afrosiyob qadimiy Samarqand shahrining arxeologik yodgorligi hisoblanadi.'
        }
      ]
    },
    {
      id: 'tst_03',
      title: 'O\'zbekiston tarixi: Umumiy nazorat va Sharq Renessansi',
      description: 'Al-Xorazmiy, Ibn Sino, Beruniy va Ulug\'bek kashfiyotlariga bag\'ishlangan sinov.',
      access_code: 'TARIX7',
      time_limit_minutes: 25,
      passing_score: 75,
      is_active: 1,
      allow_retakes: 1,
      shuffle_questions: 1,
      show_explanations: 1,
      content_language: 'uz',
      created_by: 'usr_teacher_01',
      questions: [
        {
          id: 'q_03_1',
          question_text: 'Algebra faniga asos solgan va "Algoritm" tushunchasiga sababchi bo\'lgan alloma kim?',
          question_type: 'single',
          options: [
            { id: 'opt_1', text: 'Al-Xorazmiy' },
            { id: 'opt_2', text: 'Ibn Sino' },
            { id: 'opt_3', text: 'Ahmad Farg\'oniy' },
            { id: 'opt_4', text: 'Abu Rayhon Beruniy' }
          ],
          correct_answers: ['opt_1'],
          points: 5,
          explanation: 'Muhammad ibn Muso al-Xorazmiy o\'zining "Al-Kitob al-muxtasar fi hisob al-jabr va al-muqobala" asari bilan algebraga asos solgan.'
        },
        {
          id: 'q_03_2',
          question_text: 'Samarqandda ulkan rasadxona qurdirib, 1018 ta yulduz harakatini o\'rgangan olim-hukmdorni yozing:',
          question_type: 'text',
          options: [],
          correct_answers: ['mirzo ulugbek', 'ulugbek', 'mirzo ulug\'bek', 'ulug\'bek'],
          points: 5,
          explanation: 'Mirzo Ulug\'bek 1424-1428-yillarda Samarqandda noyob rasadxona bino qildirgan.'
        }
      ]
    }
  ];

  for (const t of sampleTests) {
    execute(db, `
      INSERT INTO tests (
        id, title, description, access_code, time_limit_minutes, passing_score,
        is_active, allow_retakes, shuffle_questions, show_explanations,
        content_language, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      t.id, t.title, t.description, t.access_code, t.time_limit_minutes, t.passing_score,
      t.is_active, t.allow_retakes, t.shuffle_questions, t.show_explanations,
      t.content_language, t.created_by, now, now
    ]);

    let qIdx = 0;
    for (const q of t.questions) {
      execute(db, `
        INSERT INTO questions (
          id, test_id, question_text, question_type, options_json, correct_answers_json,
          points, explanation, order_index
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        q.id, t.id, q.question_text, q.question_type, JSON.stringify(q.options),
        JSON.stringify(q.correct_answers), q.points, q.explanation, qIdx++
      ]);
    }
  }

  // 4. Seed an initial test attempt for the sample student so stats are alive!
  execute(db, `
    INSERT INTO test_attempts (
      id, test_id, user_id, student_name, score, total_points, percent, passed,
      time_spent_seconds, student_answers_json, question_results_json, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'att_01',
    'tst_01',
    'usr_student_01',
    'Alisher Qodirov (Talaba)',
    20,
    20,
    100,
    1,
    240,
    JSON.stringify({
      q_01_1: 'opt_1',
      q_01_2: ['opt_m1', 'opt_m2', 'opt_m3'],
      q_01_3: 'true',
      q_01_4: 'Samarqand'
    }),
    JSON.stringify([
      { questionId: 'q_01_1', isCorrect: true, pointsAwarded: 5, maxPoints: 5 },
      { questionId: 'q_01_2', isCorrect: true, pointsAwarded: 5, maxPoints: 5 },
      { questionId: 'q_01_3', isCorrect: true, pointsAwarded: 5, maxPoints: 5 },
      { questionId: 'q_01_4', isCorrect: true, pointsAwarded: 5, maxPoints: 5 }
    ]),
    now
  ]);

  console.log('Database seeded successfully!');
}
