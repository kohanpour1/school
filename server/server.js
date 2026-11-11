/**
 * سرور همگام‌سازی سامانه بشری
 * داده مشترک بین موبایل‌ها با ورود به حساب
 *
 * اجرا: npm install && npm start
 * پورت پیش‌فرض: 3847
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3847;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'school.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function defaultDb() {
  return {
    settings: {
      schoolName: 'مؤسسه آموزشی غیر دولتی بشری',
      academicYear: '۱۴۰۴–۱۴۰۵',
      stage: 'متوسطه دوم',
      period: 'نوبت اول',
      absenceMode: 'per4',
      eitaaToken: 'bot524916:fcbbb06d-4ea5-4932-817c-f9b1a1a9993d',
      eitaaChannel: '@boshraM2',
      eitaaAdminId: '34964572',
      eitaaBot: '@dabirestanboshra_app',
      cloudLink: 'https://drive.google.com/drive/folders/1kuNTgWcTzhS4LtcJYBfOIdbl3kJyuOAx?usp=sharing',
    },
    users: [
      { id: 'u1', username: 'admin', password: 'admin123', name: 'مدیر سامانه', role: 'admin' },
      { id: 'u2', username: 'modir', password: 'modir123', name: 'مدیر مدرسه', role: 'manager' },
      { id: 'u3', username: 'moaven', password: 'm123', name: 'معاون', role: 'deputy' },
      { id: 'u4', username: 'teacher1', password: 't123', name: 'خانم احمدی', role: 'teacher', subjects: ['ریاضی'] },
      { id: 'u5', username: 'teacher2', password: 't123', name: 'آقای کریمی', role: 'teacher', subjects: ['فارسی'] },
    ],
    classes: [
      { id: 'c1', stage: 'متوسطه دوم', grade: 'دهم', classNo: '۱' },
      { id: 'c2', stage: 'متوسطه دوم', grade: 'دهم', classNo: '۲' },
      { id: 'c3', stage: 'متوسطه دوم', grade: 'یازدهم', classNo: '۱' },
    ],
    subjects: ['ریاضی', 'فارسی', 'علوم', 'انگلیسی', 'دینی'],
    students: [
      { id: 's1', first: 'آوا', last: 'محمدی', classId: 'c1', photo: '', phone: '09121234567', eitaaId: '11111111', parentName: 'والد آوا' },
      { id: 's2', first: 'کیا', last: 'رضایی', classId: 'c1', photo: '', phone: '09129876543', eitaaId: '22222222', parentName: 'والد کیا' },
      { id: 's3', first: 'هستی', last: 'احمدی', classId: 'c1', photo: '', phone: '09121112233', eitaaId: '33333333', parentName: 'والد هستی' },
      { id: 's4', first: 'پارسا', last: 'نوری', classId: 'c1', photo: '', phone: '09124445566', eitaaId: '44444444', parentName: 'والد پارسا' },
      { id: 's5', first: 'ملیکا', last: 'کریمی', classId: 'c1', photo: '', phone: '09127778899', eitaaId: '55555555', parentName: 'والد ملیکا' },
      { id: 's6', first: 'آرین', last: 'حسینی', classId: 'c2', photo: '', phone: '09120001122', eitaaId: '66666666', parentName: 'والد آرین' },
      { id: 's7', first: 'سارا', last: 'کاظمی', classId: 'c3', photo: '', phone: '09123334455', eitaaId: '77777777', parentName: 'والد سارا' },
      { id: 's8', first: 'امیر', last: 'موسوی', classId: 'c3', photo: '', phone: '09126667788', eitaaId: '88888888', parentName: 'والد امیر' },
    ],
    attendance: [],
    scores: [],
    marks: [],
    notices: [],
    messages: [],
    updatedAt: new Date().toISOString(),
  };
}

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error('readDb', e.message);
  }
  const db = defaultDb();
  writeDb(db);
  return db;
}

function writeDb(db) {
  db.updatedAt = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

const sessions = new Map();

function makeToken() {
  return crypto.randomBytes(24).toString('hex');
}

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : (req.query.token || '');
  const sess = sessions.get(token);
  if (!sess || sess.exp < Date.now()) {
    if (sess) sessions.delete(token);
    return res.status(401).json({ error: 'unauthorized' });
  }
  req.user = sess;
  req.token = token;
  next();
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '8mb' }));

const webRoot = path.join(__dirname, '..', 'web');
if (fs.existsSync(webRoot)) {
  app.use(express.static(webRoot));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'boshra-school', time: new Date().toISOString() });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const db = readDb();
  const user = (db.users || []).find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });
  const token = makeToken();
  sessions.set(token, {
    userId: user.id,
    role: user.role,
    name: user.name,
    subjects: user.subjects || [],
    exp: Date.now() + 7 * 24 * 3600 * 1000,
  });
  res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role, subjects: user.subjects || [] },
  });
});

app.post('/api/logout', auth, (req, res) => {
  sessions.delete(req.token);
  res.json({ ok: true });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/state', auth, (_req, res) => {
  res.json(readDb());
});

app.put('/api/state', auth, (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'bad_body' });
  const role = req.user.role;
  if (role === 'manager' || role === 'deputy') {
    return res.status(403).json({ error: 'view_only' });
  }
  if (role !== 'admin' && role !== 'teacher') {
    return res.status(403).json({ error: 'forbidden' });
  }
  const current = readDb();
  const next = {
    ...current,
    ...body,
    users: role === 'admin' ? (body.users || current.users) : current.users,
    settings: role === 'admin' ? (body.settings || current.settings) : current.settings,
  };
  writeDb(next);
  res.json({ ok: true, updatedAt: next.updatedAt });
});

app.post('/api/eitaa', auth, async (req, res) => {
  const db = readDb();
  const token = db.settings?.eitaaToken;
  const { chat_id, text } = req.body || {};
  if (!token || !chat_id || !text) return res.status(400).json({ error: 'missing' });
  try {
    const url = `https://eitaayar.ir/api/${token}/sendMessage`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ chat_id: String(chat_id), text: String(text) }),
    });
    const data = await r.text();
    res.json({ ok: r.ok, data });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Boshra school server on http://0.0.0.0:${PORT}`);
  console.log(`Web UI: http://localhost:${PORT}/`);
  readDb();
});
