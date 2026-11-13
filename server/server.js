/**
 * سرور همگام‌سازی سامانه بشری v1.5.7
 * دسترسی معلم بر اساس تخصیص کلاس/درس | تنظیمات ایتا سمت سرور
 * npm install && npm start  (PORT 3847)
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3847;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'school.json');
const SECRETS_FILE = path.join(DATA_DIR, 'secrets.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function defaultDb() {
  return {
    settings: {
      schoolName: '',
      logo: '',
      setupComplete: false,
      academicYear: '۱۴۰۵–۱۴۰۶',
      period: 'نوبت اول',
      absenceMode: 'per4',
      eitaaChannel: '@boshraM2',
      eitaaAdminId: '',
      eitaaBot: '@dabirestanboshra_app',
      cloudLink: ''
    },
    users: [
      { id: 'u1', username: 'admin', password: 'admin123', name: 'مدیر سامانه', role: 'admin' }
    ],
    grades: ['هفتم', 'هشتم', 'نهم', 'دهم', 'یازدهم', 'دوازدهم'],
    classes: [],
    subjects: [],
    assignments: [],
    students: [],
    attendance: [],
    scores: [],
    scoreEntries: [],
    assessments: [],
    marks: [],
    notices: [],
    messages: [],
    history: []
  };
}

function loadSecrets() {
  try {
    if (fs.existsSync(SECRETS_FILE)) return JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8'));
  } catch (e) {}
  return { eitaaToken: '' };
}
function saveSecrets(s) {
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(s, null, 2), 'utf8');
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const d = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (d && d.settings) return d;
    }
  } catch (e) {}
  return defaultDb();
}
function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

let DB = loadDb();
let SECRETS = loadSecrets();
const tokens = new Map();

function uid() {
  return crypto.randomBytes(8).toString('hex');
}

function publicUser(u) {
  if (!u) return null;
  return { id: u.id, username: u.username, name: u.name, role: u.role };
}

function auth(req) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!t || !tokens.has(t)) return null;
  const id = tokens.get(t);
  return (DB.users || []).find((u) => u.id === id) || null;
}

function isAdmin(u) {
  return u && u.role === 'admin';
}
function isTeacher(u) {
  return u && u.role === 'teacher';
}

function teacherAssignments(user) {
  return (DB.assignments || []).filter((a) => a.teacherId === user.id);
}

function filterStateForUser(user) {
  const state = JSON.parse(JSON.stringify(DB));
  if (state.settings) {
    delete state.settings.eitaaToken;
  }
  if (isAdmin(user) || (user && (user.role === 'manager' || user.role === 'staff'))) {
    return state;
  }
  if (isTeacher(user)) {
    const asg = teacherAssignments(user);
    const classIds = new Set(asg.map((a) => a.classId));
    const subjects = new Set(asg.map((a) => a.subject));
    state.assignments = asg;
    state.classes = (state.classes || []).filter((c) => classIds.has(c.id));
    state.students = (state.students || []).filter((s) => classIds.has(s.classId));
    state.subjects = (state.subjects || []).filter((s) => subjects.has(s));
    state.assessments = (state.assessments || []).filter(
      (a) => (!a.classId || classIds.has(a.classId)) && (!a.subject || subjects.has(a.subject))
    );
    state.scoreEntries = (state.scoreEntries || []).filter((e) => {
      const a = (DB.assessments || []).find((x) => x.id === e.assessmentId);
      if (!a) return false;
      return (!a.classId || classIds.has(a.classId)) && (!a.subject || subjects.has(a.subject));
    });
    state.scores = (state.scores || []).filter((sc) => subjects.has(sc.subject));
    state.attendance = (state.attendance || []).filter((at) => {
      const st = (DB.students || []).find((s) => s.id === at.studentId);
      return st && classIds.has(st.classId);
    });
    state.users = (state.users || []).filter((u) => u.id === user.id || u.role === 'admin');
  }
  return state;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, version: '1.5.7' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = (DB.users || []).find((x) => x.username === username && x.password === password);
  if (!u) return res.status(401).json({ ok: false, error: 'invalid' });
  const token = uid() + uid();
  tokens.set(token, u.id);
  res.json({ ok: true, token, user: publicUser(u) });
});

app.get('/api/state', (req, res) => {
  const u = auth(req);
  if (!u) return res.status(401).json({ ok: false });
  res.json(filterStateForUser(u));
});

app.put('/api/state', (req, res) => {
  const u = auth(req);
  if (!u) return res.status(401).json({ ok: false });
  if (!isAdmin(u) && u.role !== 'manager') {
    const body = req.body || {};
    const asg = teacherAssignments(u);
    const classIds = new Set(asg.map((a) => a.classId));
    const subjects = new Set(asg.map((a) => a.subject));
    if (Array.isArray(body.attendance)) {
      const others = (DB.attendance || []).filter((at) => {
        const st = (DB.students || []).find((s) => s.id === at.studentId);
        return !(st && classIds.has(st.classId));
      });
      const mine = body.attendance.filter((at) => {
        const st = (DB.students || []).find((s) => s.id === at.studentId) ||
          (body.students || []).find((s) => s.id === at.studentId);
        return st && classIds.has(st.classId);
      });
      DB.attendance = others.concat(mine);
    }
    if (Array.isArray(body.scoreEntries)) {
      const others = (DB.scoreEntries || []).filter((e) => {
        const a = (DB.assessments || []).find((x) => x.id === e.assessmentId);
        return !(a && (!a.classId || classIds.has(a.classId)) && (!a.subject || subjects.has(a.subject)));
      });
      const mine = body.scoreEntries.filter((e) => {
        const a = (body.assessments || DB.assessments || []).find((x) => x.id === e.assessmentId);
        return a && (!a.classId || classIds.has(a.classId)) && (!a.subject || subjects.has(a.subject));
      });
      DB.scoreEntries = others.concat(mine);
    }
    if (Array.isArray(body.assessments)) {
      const others = (DB.assessments || []).filter(
        (a) => !(classIds.has(a.classId) && subjects.has(a.subject))
      );
      const mine = body.assessments.filter((a) => classIds.has(a.classId) && subjects.has(a.subject));
      DB.assessments = others.concat(mine);
    }
    if (Array.isArray(body.scores)) {
      const others = (DB.scores || []).filter((sc) => !subjects.has(sc.subject));
      const mine = body.scores.filter((sc) => subjects.has(sc.subject));
      DB.scores = others.concat(mine);
    }
    saveDb(DB);
    return res.json({ ok: true });
  }
  const body = req.body || {};
  if (body.settings) {
    delete body.settings.eitaaToken;
  }
  DB = Object.assign(defaultDb(), body);
  saveDb(DB);
  res.json({ ok: true });
});

app.get('/api/secrets/eitaa', (req, res) => {
  const u = auth(req);
  if (!u || !isAdmin(u)) return res.status(403).json({ ok: false });
  res.json({
    ok: true,
    eitaaToken: SECRETS.eitaaToken || '',
    eitaaAdminId: (DB.settings && DB.settings.eitaaAdminId) || '',
    eitaaChannel: (DB.settings && DB.settings.eitaaChannel) || ''
  });
});

app.put('/api/secrets/eitaa', (req, res) => {
  const u = auth(req);
  if (!u || !isAdmin(u)) return res.status(403).json({ ok: false });
  const { eitaaToken, eitaaAdminId, eitaaChannel } = req.body || {};
  if (typeof eitaaToken === 'string') {
    SECRETS.eitaaToken = eitaaToken;
    saveSecrets(SECRETS);
  }
  if (!DB.settings) DB.settings = {};
  if (typeof eitaaAdminId === 'string') DB.settings.eitaaAdminId = eitaaAdminId;
  if (typeof eitaaChannel === 'string') DB.settings.eitaaChannel = eitaaChannel;
  saveDb(DB);
  res.json({ ok: true });
});

app.post('/api/eitaa', async (req, res) => {
  const u = auth(req);
  if (!u) return res.status(401).json({ ok: false });
  const token = SECRETS.eitaaToken || (DB.settings && DB.settings.eitaaToken) || '';
  if (!token) return res.status(400).json({ ok: false, error: 'no_token' });
  const { chat_id, text } = req.body || {};
  if (!chat_id || !text) return res.status(400).json({ ok: false, error: 'missing' });
  try {
    const url = 'https://eitaayar.ir/api/' + encodeURIComponent(token) + '/sendMessage';
    const body = new URLSearchParams({ chat_id: String(chat_id), text: String(text) });
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const t = await r.text();
    let j = {};
    try { j = JSON.parse(t); } catch (e) {}
    res.json({ ok: !!(j && j.ok), raw: j });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.listen(PORT, () => {
  console.log('Boshra School server 1.5.7 on http://0.0.0.0:' + PORT);
});
