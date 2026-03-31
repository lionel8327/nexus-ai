// api/activar.js — NEXUS AI — Sistema de códigos de un solo uso
// Verifica si el código fue usado y lo marca como usado en Upstash Redis

const KV_URL   = "https://huge-lynx-89605.upstash.io";
const KV_TOKEN = "gQAAAAAAAV4FAAIncDE2ZDA5ZmMwZmI3NDY0MDUxYmEyZjFjZTAwYWRlZmY4MHAxODk2MDU";

// ── CÓDIGOS VÁLIDOS ──
const NEXUS_PRIVILEGED = {
  'NEXUS-OWNER-CWEX-4R38-XVOX': { plan:'full', tipo:'eterno', rol:'owner', label:'Owner' },
  'NEXUS-ADMIN-AZOX-0CS3-GD4Y': { plan:'full', tipo:'eterno', rol:'admin', label:'Admin' },
  'NEXUS-MOD-6HX2-CJ3Q-ZAGH':   { plan:'pro',  tipo:'eterno', rol:'mod',   label:'Moderador' },
};

const NEXUS_CODES = {
  'PRO-MES-042026-NX7K': { plan:'pro',  tipo:'mensual', mesVence:4,  añoVence:2026, label:'Pro Mensual' },
  'PRO-MES-052026-KM3P': { plan:'pro',  tipo:'mensual', mesVence:5,  añoVence:2026, label:'Pro Mensual' },
  'PRO-MES-062026-RT5Q': { plan:'pro',  tipo:'mensual', mesVence:6,  añoVence:2026, label:'Pro Mensual' },
  'PRO-MES-072026-WB2L': { plan:'pro',  tipo:'mensual', mesVence:7,  añoVence:2026, label:'Pro Mensual' },
  'PRO-MES-082026-YH6N': { plan:'pro',  tipo:'mensual', mesVence:8,  añoVence:2026, label:'Pro Mensual' },
  'PRO-MES-092026-PD4R': { plan:'pro',  tipo:'mensual', mesVence:9,  añoVence:2026, label:'Pro Mensual' },
  'PRO-MES-102026-GF8S': { plan:'pro',  tipo:'mensual', mesVence:10, añoVence:2026, label:'Pro Mensual' },
  'PRO-MES-112026-XC1T': { plan:'pro',  tipo:'mensual', mesVence:11, añoVence:2026, label:'Pro Mensual' },
  'PRO-MES-122026-VJ9U': { plan:'pro',  tipo:'mensual', mesVence:12, añoVence:2026, label:'Pro Mensual' },
  'PRO-ANU-2026-ZX9M':   { plan:'pro',  tipo:'anual',   mesVence:12, añoVence:2026, label:'Pro Anual' },
  'PRO-ANU-2027-AB3C':   { plan:'pro',  tipo:'anual',   mesVence:12, añoVence:2027, label:'Pro Anual' },
  'FULL-MES-042026-QW2E':{ plan:'full', tipo:'mensual', mesVence:4,  añoVence:2026, label:'Full Mensual' },
  'FULL-MES-052026-ER4T':{ plan:'full', tipo:'mensual', mesVence:5,  añoVence:2026, label:'Full Mensual' },
  'FULL-MES-062026-TY6U':{ plan:'full', tipo:'mensual', mesVence:6,  añoVence:2026, label:'Full Mensual' },
  'FULL-MES-072026-UI8O':{ plan:'full', tipo:'mensual', mesVence:7,  añoVence:2026, label:'Full Mensual' },
  'FULL-MES-082026-OP0A':{ plan:'full', tipo:'mensual', mesVence:8,  añoVence:2026, label:'Full Mensual' },
  'FULL-MES-092026-AS2D':{ plan:'full', tipo:'mensual', mesVence:9,  añoVence:2026, label:'Full Mensual' },
  'FULL-MES-102026-DF4G':{ plan:'full', tipo:'mensual', mesVence:10, añoVence:2026, label:'Full Mensual' },
  'FULL-MES-112026-GH6J':{ plan:'full', tipo:'mensual', mesVence:11, añoVence:2026, label:'Full Mensual' },
  'FULL-MES-122026-JK8L':{ plan:'full', tipo:'mensual', mesVence:12, añoVence:2026, label:'Full Mensual' },
  'FULL-ANU-2026-LZ7X':  { plan:'full', tipo:'anual',   mesVence:12, añoVence:2026, label:'Full Anual' },
  'FULL-ANU-2027-CV5B':  { plan:'full', tipo:'anual',   mesVence:12, añoVence:2027, label:'Full Anual' },
};

async function redis(cmd, ...args) {
  const res = await fetch(`${KV_URL}/${cmd}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const data = await res.json();
  return data.result;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, msg: 'Método no permitido' });

  const { codigo } = req.body || {};
  if (!codigo) return res.status(400).json({ ok: false, msg: 'Código requerido' });

  const code = codigo.trim().toUpperCase();

  // ── 1. Verificar si es código privilegiado (nunca se marcan como usados) ──
  const priv = NEXUS_PRIVILEGED[code];
  if (priv) {
    return res.json({ ok: true, entry: priv, privileged: true });
  }

  // ── 2. Verificar si existe en la tabla de códigos ──
  const entry = NEXUS_CODES[code];
  if (!entry) {
    return res.json({ ok: false, msg: 'Código no válido. Verifica que lo copiaste correctamente.' });
  }

  // ── 3. Verificar vencimiento ──
  const now = new Date();
  const mesActual = now.getMonth() + 1;
  const añoActual = now.getFullYear();

  if (entry.tipo === 'mensual') {
    const venceEn = new Date(entry.añoVence, entry.mesVence - 1, 1);
    const inicioMes = new Date(añoActual, mesActual - 1, 1);
    if (inicioMes > venceEn) {
      return res.json({ ok: false, msg: `Este código venció en ${entry.mesVence}/${entry.añoVence}. Contacta al administrador para renovar.` });
    }
  } else if (entry.tipo === 'anual') {
    if (añoActual > entry.añoVence) {
      return res.json({ ok: false, msg: `Este código venció en ${entry.añoVence}. Contacta al administrador para renovar.` });
    }
  }

  // ── 4. Verificar en Upstash si ya fue usado ──
  const usado = await redis('GET', `nexus:codigo:${code}`);
  if (usado) {
    return res.json({ ok: false, msg: '⚠ Este código ya fue utilizado. Cada código es válido para un solo dispositivo. Contacta al administrador para obtener uno nuevo.' });
  }

  // ── 5. Marcar como usado en Upstash (con expiración al final del período) ──
  const ahora = Math.floor(Date.now() / 1000);
  let expira;
  if (entry.tipo === 'mensual') {
    // Expira el 1ro del mes siguiente al de vencimiento
    const fechaExp = new Date(entry.añoVence, entry.mesVence, 1);
    expira = Math.floor(fechaExp.getTime() / 1000) - ahora;
  } else {
    // Expira el 1 de enero del año siguiente
    const fechaExp = new Date(entry.añoVence + 1, 0, 1);
    expira = Math.floor(fechaExp.getTime() / 1000) - ahora;
  }

  if (expira > 0) {
    await redis('SET', `nexus:codigo:${code}`, `usado:${Date.now()}`, 'EX', expira.toString());
  } else {
    await redis('SET', `nexus:codigo:${code}`, `usado:${Date.now()}`);
  }

  return res.json({ ok: true, entry, privileged: false });
}
