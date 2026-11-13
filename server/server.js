#!/usr/bin/env node
/**
 * Boshra School Server 1.6.0
 * Single EXE: runs server + opens status page in browser
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3847;
const BASE = process.pkg ? path.dirname(process.execPath) : __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(BASE, 'data');
const DB_FILE = path.join(DATA_DIR, 'school.json');
const SECRETS_FILE = path.join(DATA_DIR, 'secrets.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function defaultDb() {
  return {
    settings: {
      schoolName: '', logo: '', setupComplete: false,
      academicYear: '۱۴۰۵–۱۴۰۶', period: 'نوبت اول', absenceMode: 'per4',
      eitaaChannel: '@boshraM2', eitaaAdminId: '', eitaaBot: '@dabirestanboshra_app', cloudLink: ''
    },
    users: [{ id: 'u1', username: 'admin', password: 'admin123', name: 'مدیر سامانه', role: 'admin' }],
    grades: ['هفتم', 'هشتم', 'نهم', 'دهم', 'یازدهم', 'دوازدهم'],
    classes: [], subjects: [], assignments: [], students: [],
    attendance: [], scores: [], scoreEntries: [], assessments: [], marks: [], messages: [], history: []
  };
}
function loadSecrets() {
  try { if (fs.existsSync(SECRETS_FILE)) return JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8')); } catch (e) {}
  return { eitaaToken: '' };
}
function saveSecrets(s) { fs.writeFileSync(SECRETS_FILE, JSON.stringify(s, null, 2), 'utf8'); }
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const d = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (d && d.settings) return d;
    }
  } catch (e) {}
  return defaultDb();
}
function saveDb(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8'); }
let DB = loadDb(), SECRETS = loadSecrets();
const tokens = new Map();
function uid() { return crypto.randomBytes(8).toString('hex'); }
function publicUser(u) { return u ? { id: u.id, username: u.username, name: u.name, role: u.role } : null; }
function auth(req) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!t || !tokens.has(t)) return null;
  return (DB.users || []).find((u) => u.id === tokens.get(t)) || null;
}
function isAdmin(u) { return u && u.role === 'admin'; }
function teacherAssignments(user) { return (DB.assignments || []).filter((a) => a.teacherId === user.id); }
function filterStateForUser(user) {
  const state = JSON.parse(JSON.stringify(DB));
  if (state.settings) delete state.settings.eitaaToken;
  if (isAdmin(user) || (user && (user.role === 'manager' || user.role === 'staff'))) return state;
  if (user && user.role === 'teacher') {
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
      return a && (!a.classId || classIds.has(a.classId)) && (!a.subject || subjects.has(a.subject));
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
function httpPostForm(urlStr, formBody) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(formBody) }
    }, (res) => { let buf = ''; res.on('data', (c) => { buf += c; }); res.on('end', () => resolve(buf)); });
    req.on('error', reject); req.write(formBody); req.end();
  });
}
function openBrowser(url) {
  const plat = process.platform;
  let cmd;
  if (plat === 'win32') cmd = 'cmd /c start "" "' + url + '"';
  else if (plat === 'darwin') cmd = 'open "' + url + '"';
  else cmd = 'xdg-open "' + url + '"';
  try { exec(cmd, () => {}); } catch (e) {}
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.get('/api/health', (q, r) => r.json({ ok: true, version: '1.6.0', dataDir: DATA_DIR }));
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = (DB.users || []).find((x) => x.username === username && x.password === password);
  if (!u) return res.status(401).json({ ok: false });
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
    if (Array.isArray(body.scoreEntries)) {
      const others = (DB.scoreEntries || []).filter((e) => {
        const a = (DB.assessments || []).find((x) => x.id === e.assessmentId);
        return !(a && classIds.has(a.classId));
      });
      const mine = body.scoreEntries.filter((e) => {
        const a = (body.assessments || DB.assessments || []).find((x) => x.id === e.assessmentId);
        return a && classIds.has(a.classId);
      });
      DB.scoreEntries = others.concat(mine);
    }
    if (Array.isArray(body.assessments)) {
      const others = (DB.assessments || []).filter((a) => !(classIds.has(a.classId) && subjects.has(a.subject)));
      const mine = body.assessments.filter((a) => classIds.has(a.classId) && subjects.has(a.subject));
      DB.assessments = others.concat(mine);
    }
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
    saveDb(DB);
    return res.json({ ok: true });
  }
  const body = req.body || {};
  if (body.settings) delete body.settings.eitaaToken;
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
  if (typeof eitaaToken === 'string') { SECRETS.eitaaToken = eitaaToken; saveSecrets(SECRETS); }
  if (!DB.settings) DB.settings = {};
  if (typeof eitaaAdminId === 'string') DB.settings.eitaaAdminId = eitaaAdminId;
  if (typeof eitaaChannel === 'string') DB.settings.eitaaChannel = eitaaChannel;
  saveDb(DB);
  res.json({ ok: true });
});
app.post('/api/eitaa', async (req, res) => {
  const u = auth(req);
  if (!u) return res.status(401).json({ ok: false });
  const token = SECRETS.eitaaToken || '';
  if (!token) return res.status(400).json({ ok: false, error: 'no_token' });
  const { chat_id, text } = req.body || {};
  if (!chat_id || !text) return res.status(400).json({ ok: false });
  try {
    const url = 'https://eitaayar.ir/api/' + encodeURIComponent(token) + '/sendMessage';
    const body = new URLSearchParams({ chat_id: String(chat_id), text: String(text) }).toString();
    const t = await httpPostForm(url, body);
    let j = {}; try { j = JSON.parse(t); } catch (e) {}
    res.json({ ok: !!(j && j.ok), raw: j });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});
app.get('/', (q, r) => {
  const os = require('os');
  const nets = os.networkInterfaces();
  let ips = [];
  Object.keys(nets).forEach((name) => {
    (nets[name] || []).forEach((n) => { if (n.family === 'IPv4' && !n.internal) ips.push(n.address); });
  });
  const localLinks = ips.map((ip) => '<li dir="ltr"><code>http://' + ip + ':' + PORT + '</code></li>').join('') || '<li>—</li>';
  r.setHeader('Content-Type', 'text/html;charset=utf-8');
  r.end('<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/><title>سرور بشری</title></head><body style="font-family:Tahoma;padding:2rem;background:#f8f5fc"><div style="max-width:480px;margin:auto;background:#fff;padding:1.5rem;border-radius:1rem;box-shadow:0 6px 24px rgba(91,44,138,.1)"><h1 style="color:#5B2C8A">سرور بشری ۱.۶.۰</h1><p style="color:#166534;font-weight:700">● در حال اجرا</p><p><code>http://127.0.0.1:' + PORT + '</code></p><p>موبایل:</p><ul>' + localLinks + '</ul><p style="color:#6b7280;font-size:.85rem">این آدرس را در اپ وارد کنید. پنجره را نبندید.</p></div></body></html>');
});
app.listen(PORT, '0.0.0.0', () => {
  const url = 'http://127.0.0.1:' + PORT + '/';
  console.log('Boshra School Server 1.6.0 ' + url);
  console.log('Data: ' + DATA_DIR);
  setTimeout(() => openBrowser(url), 600);
});
