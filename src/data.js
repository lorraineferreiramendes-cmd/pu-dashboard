import { useState, useEffect, useMemo } from 'react'

export const APPS_SCRIPT_URL = 'https://script.google.com/a/macros/mercadolivre.com/s/AKfycbyLil7nGAYDnEcC2iK3n0gdVNv_jCfAL6dQ2Td-lva1OtLQZgC5KB5TOGxq3jvWJPZG/exec'
export const META_PU = 92.9

function parseDate(str) {
  if (!str) return null
  if (str.includes('/')) {
    const [d, m, y] = str.split('/')
    return new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`)
  }
  return new Date(str)
}

function csvToRows(csv) {
  const lines = csv.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g,'').trim())
  return lines.slice(1).map(line => {
    const vals = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') inQ = !inQ
      else if (c === ',' && !inQ) { vals.push(cur.trim()); cur = '' }
      else cur += c
    }
    vals.push(cur.trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (vals[i]||'').replace(/^"|"$/g,'') })
    return obj
  }).filter(r => r.route_date)
}

function processRows(rows) {
  return rows.map(r => {
    const col = parseFloat(r.total_pacotes_coletados) || 0
    const est = parseFloat(r.total_pacotes_estimados) || 0
    const nao = parseFloat(r.pacotes_nao_coletados) || 0
    const pu = est > 0 ? (col / est) * 100 : null
    const date = parseDate(r.route_date)
    const dateStr = date ? date.toISOString().slice(0,10) : ''
    const dow = date ? date.getDay() : -1
    return { ...r, _col: col, _est: est, _nao: nao, _pu: pu, _date: date, _dateStr: dateStr, _dow: dow }
  })
}

export function useSheetsData() {
  const [raw, setRaw] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(APPS_SCRIPT_URL)
      if (!res.ok) throw new Error('Erro ao carregar planilha')
      const json = await res.json()
      setRaw(processRows(json))
      setLastUpdated(new Date())
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  return { raw, loading, error, refetch: load, lastUpdated }
}

export function calcPU(rows) {
  const col = rows.reduce((s,r) => s + r._col, 0)
  const est = rows.reduce((s,r) => s + r._est, 0)
  return est > 0 ? (col/est)*100 : null
}

export function groupBy(rows, key) {
  const map = {}
  rows.forEach(r => {
    const k = r[key] || 'N/A'
    if (!map[k]) map[k] = []
    map[k].push(r)
  })
  return Object.entries(map).map(([name, items]) => ({
    name,
    pu: calcPU(items),
    col: items.reduce((s,r)=>s+r._col,0),
    est: items.reduce((s,r)=>s+r._est,0),
    nao: items.reduce((s,r)=>s+r._nao,0),
    count: items.length,
    rows: items,
  })).sort((a,b) => (b.pu||0)-(a.pu||0))
}

export function groupByDate(rows) {
  const map = {}
  rows.forEach(r => {
    if (!r._dateStr) return
    if (!map[r._dateStr]) map[r._dateStr] = []
    map[r._dateStr].push(r)
  })
  return Object.entries(map).map(([date, items]) => ({
    date,
    label: date.slice(5).replace('-','/'),
    pu: calcPU(items),
    col: items.reduce((s,r)=>s+r._col,0),
    est: items.reduce((s,r)=>s+r._est,0),
  })).sort((a,b) => a.date.localeCompare(b.date))
}

export function getWeeks(rows) {
  if (!rows.length) return []
  const sorted = [...rows].filter(r=>r._date).sort((a,b)=>a._date-b._date)
  const first = sorted[0]._date
  const weeks = []
  let wStart = new Date(first)
  wStart.setDate(wStart.getDate() - wStart.getDay() + 1)
  for (let i = 0; i < 6; i++) {
    const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate()+6)
    const wRows = rows.filter(r => r._date && r._date >= wStart && r._date <= wEnd)
    if (wRows.length) {
      weeks.push({
        label: `Semana ${i+1}`,
        start: new Date(wStart),
        end: new Date(wEnd),
        pu: calcPU(wRows),
        col: wRows.reduce((s,r)=>s+r._col,0),
        est: wRows.reduce((s,r)=>s+r._est,0),
        rows: wRows,
      })
    }
    wStart = new Date(wEnd); wStart.setDate(wStart.getDate()+1)
  }
  return weeks
}

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
export function groupByDow(rows) {
  const map = {}
  rows.forEach(r => {
    if (r._dow < 0) return
    const k = DIAS[r._dow]
    if (!map[k]) map[k] = []
    map[k].push(r)
  })
  return DIAS.map(d => ({ name: d, pu: map[d] ? calcPU(map[d]) : null })).filter(d=>d.pu!==null)
}

export function fmtDate(d) {
  if (!d) return '—'
  const s = typeof d === 'string' ? d : d.toISOString().slice(0,10)
  const [y,m,day] = s.split('-')
  return `${day}/${m}/${y.slice(2)}`
}

export function fmtNum(n) { return n?.toLocaleString('pt-BR') ?? '—' }
export function fmtPU(n) { return n !== null && n !== undefined ? n.toFixed(1)+'%' : '—' }
export function puColor(pu) {
  if (pu === null) return '#94a3b8'
  if (pu >= META_PU) return '#16a34a'
  if (pu >= META_PU - 1) return '#d97706'
  return '#dc2626'
}
export function puClass(pu) {
  if (pu === null) return 'dim'
  if (pu >= META_PU) return 'ok'
  if (pu >= META_PU - 1) return 'warn'
  return 'bad'
}
