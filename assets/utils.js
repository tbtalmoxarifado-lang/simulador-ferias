export const Storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  del(key){ localStorage.removeItem(key); }
};

export function iso(d){
  // Date -> YYYY-MM-DD
  const pad = (n)=> String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

export function parseISO(s){
  // "YYYY-MM-DD" -> Date (local)
  const [y,m,d] = s.split("-").map(Number);
  return new Date(y, m-1, d);
}

export function dateDiffDays(a,b){
  // inclusive diff days: 2026-01-01 to 2026-01-01 => 1
  const ms = 24*60*60*1000;
  const aa = parseISO(a); const bb = parseISO(b);
  const diff = Math.floor((bb - aa)/ms);
  return diff + 1;
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd){
  return aStart <= bEnd && aEnd >= bStart;
}

export function eachDay(startISO, endISO){
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  const out = [];
  for(let d = new Date(start); d <= end; d.setDate(d.getDate()+1)){
    out.push(iso(d));
  }
  return out;
}

export function escapeHTML(str){
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[s]));
}
