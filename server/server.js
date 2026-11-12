/**
 * سرور همگام‌سازی سامانه بشری — چند موبایل با یک حساب
 * npm install && npm start  (پورت 3847)
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
      period: 'متوسطه دوم',
      absenceMode: 'per4',
      eitaaToken: 'bot524916:fcbbb06d-4ea5-4932-817c-f9b1a1a9993d',
      eitaaChannel: '@boshraM2',
      eitaaAdminId: '34964572',
      eitaaBot: '@dabirestanboshra_app',
      cloudLink: 'https://drive.google.com/drive/folders/1kuNTgWcTzhS4LtcJYBfOIdbl3kJyuOAx?usp=sharing',
    },
    users: [
      { id: 'u1', username: 'admin', password: 'admin123', name: 'مدیر سامانه', role: 'admin', subjects: [] },
      { id: 'u2', username: 'modir', password: 'modir123', name: 'مدیر مدرسه', role: 'manager', subjects: [] },
      { id: 'u3', username: 'moaven', password: 'm123', name: 'معاون', role: 'staff', subjects: [] },
      { id: 'u4', username: 'teacher1', password: 't123', name: 'خانم احمدی', role: 'teacher', subjects: ['ریاضی'] },
      { id: 'u5', username: 'teacher2', password: 't123', name: 'آقای کریمی', role: 'teacher', subjects: ['فارسی'] },
    ],
    grades: ['دهم', 'یازدهم', 'دوازدهم'],
    classes: [
      { id: 'c1', grade: 'دهم', classNo: '۱' },
      { id: 'c2', grade: 'یازدهم', classNo: '۱' },
      { id: 'c3', grade: 'دوازدهم', classNo: '۱' },
    ],
    subjects: ['ریاضی', 'فارسی', 'علوم', 'انگلیسی'],
    assignments: [
      { id: 'a1', classId: 'c1', subject: 'ریاضی', teacherId: 'u4' },
      { id: 'a2', classId: 'c1', subject: 'فارسی', teacherId: 'u5' },
    ],
    students: [
      { id: 's1', first: 'آوا', last: 'محمدی', classId: 'c1', phone: '09120000001', eitaaId: '11111111' },
      { id: 's2', first: 'کیا', last: 'رضایی', classId: 'c1', phone: '09120000002', eitaaId: '22222222' },
      { id: 's3', first: 'هستی', last: 'احمدی', classId: 'c1', phone: '09120000003', eitaaId: '33333333' },
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

const webRoot = path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'www');
if (fs.existsSync(webRoot)) app.use(express.static(webRoot));
const webAlt = path.join(__dirname, '..', 'web');
if (fs.existsSync(webAlt)) app.use(express.static(webAlt));

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
    exp: Date.now() + 30 * 24 * 3600 * 1000,
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
  if (role === 'manager' || role === 'deputy' || role === 'staff') {
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
  const token = db.settings && db.settings.eitaaToken;
  const { chat_id, text } = req.body || {};
  if (!token || !chat_id || !text) return res.status(400).json({ error: 'missing' });
  try {
    const url = 'https://eitaayar.ir/api/' + token + '/sendMessage';
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
  console.log('Boshra school server on http://0.0.0.0:' + PORT);
  readDb();
});
