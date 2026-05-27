import fs from 'fs'
import path from 'path'

function csvToRows(csv) {
  const lines = csv.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g,'').replace(/\r/g,'').trim())
  return lines.slice(1).map(line => {
    const vals = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') inQ = !inQ
      else if (c === ',' && !inQ) { vals.push(cur.trim()); cur = '' }
      else cur += c
    }
    vals.push(cur.replace(/\r/g,'').trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (vals[i]||'').replace(/^"|"$/g,'') })
    return obj
  }).filter(r => r.route_date)
}

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data.csv')
    const csv = fs.readFileSync(filePath, 'utf-8')
    const rows = csvToRows(csv)
    res.setHeader('Cache-Control', 's-maxage=3600')
    res.status(200).json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
