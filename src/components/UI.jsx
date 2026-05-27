import { META_PU, fmtPU, fmtNum, puColor } from '../data'

export function KpiCard({ label, value, sub, color, trend, onClick }) {
  const colors = {
    blue: '#2563eb', green: '#16a34a', red: '#dc2626',
    amber: '#d97706', purple: '#7c3aed', gray: '#94a3b8'
  }
  const c = colors[color] || colors.blue
  return (
    <div onClick={onClick} style={{
      background: '#fff', border: `0.5px solid #dde3ed`, borderRadius: 10,
      padding: '10px 12px', borderTop: `3px solid ${c}`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.15s',
    }}>
      <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', lineHeight: 1, color: c, marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: '#94a3b8' }}>{sub}</div>}
      {trend !== undefined && trend !== null && (
        <div style={{
          display: 'inline-block', marginTop: 4, padding: '1px 6px',
          borderRadius: 99, fontSize: 9, fontWeight: 600,
          background: trend >= 0 ? '#eaf3de' : '#fcebeb',
          color: trend >= 0 ? '#3b6d11' : '#a32d2d'
        }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}pp vs meta
        </div>
      )}
    </div>
  )
}

export function Badge({ value, ok, warn }) {
  const bg = ok ? '#eaf3de' : warn ? '#faeeda' : '#fcebeb'
  const color = ok ? '#3b6d11' : warn ? '#854f0b' : '#a32d2d'
  const label = ok ? '✓ meta' : warn ? '≈ meta' : '✗ abaixo'
  return <span style={{ padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 600, background: bg, color }}>{label}</span>
}

export function StatusBadge({ pu }) {
  const ok = pu >= META_PU, warn = pu >= META_PU - 1
  return <Badge ok={ok} warn={!ok && warn} />
}

export function ClusterGrid({ data, onSelect, selected }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {data.map(c => {
          const ok = c.pu >= META_PU, warn = c.pu >= META_PU - 1
          const bg = ok ? '#eaf3de' : warn ? '#faeeda' : '#fcebeb'
          const textC = ok ? '#3b6d11' : warn ? '#854f0b' : '#a32d2d'
          const isSelected = selected === c.name
          return (
            <div key={c.name} onClick={() => onSelect(isSelected ? null : c.name)} style={{
              borderRadius: 5, padding: '4px 3px', textAlign: 'center',
              cursor: 'pointer', background: bg,
              border: isSelected ? '1.5px solid #2563eb' : '0.5px solid transparent',
              transition: 'border-color 0.12s',
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--mono)', color: textC }}>{c.name.padStart(2,'0')}</div>
              <div style={{ fontSize: 8, fontFamily: 'var(--mono)', color: textC }}>{fmtPU(c.pu)}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, fontSize: 9, color: '#64748b', marginTop: 6 }}>
        <span><span style={{ display:'inline-block',width:8,height:8,borderRadius:2,background:'#eaf3de',marginRight:3 }}></span>Acima meta</span>
        <span><span style={{ display:'inline-block',width:8,height:8,borderRadius:2,background:'#faeeda',marginRight:3 }}></span>±1pp</span>
        <span><span style={{ display:'inline-block',width:8,height:8,borderRadius:2,background:'#fcebeb',marginRight:3 }}></span>Abaixo meta</span>
      </div>
    </div>
  )
}

export function CulpChart({ rows }) {
  const byCateg = {}
  const byIncid = {}
  const byResp = {}
  rows.forEach(r => {
    if (!r._nao) return
    const cat = r.culpabilidad_categoria || 'Não informado'
    const inc = r.culpabilidad_incidente || 'Não informado'
    const resp = r.culpabilidad || 'Não informado'
    byCateg[cat] = (byCateg[cat]||0) + r._nao
    byIncid[inc] = (byIncid[inc]||0) + r._nao
    byResp[resp] = (byResp[resp]||0) + r._nao
  })
  const total = Object.values(byCateg).reduce((s,v)=>s+v,0)
  const colors = ['#dc2626','#d97706','#2563eb','#94a3b8','#7c3aed']
  const categEntries = Object.entries(byCateg).sort((a,b)=>b[1]-a[1]).slice(0,5)
  const incidEntries = Object.entries(byIncid).sort((a,b)=>b[1]-a[1]).slice(0,5)
  const respEntries  = Object.entries(byResp).sort((a,b)=>b[1]-a[1]).slice(0,4)
  const chipColors = { cat: ['#fcebeb','#faeeda','#e6f1fb','#f1efe8'], ctxt: ['#a32d2d','#854f0b','#185fa5','#5f5e5a'] }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
      <div>
        <div style={{ fontSize:9,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'#94a3b8',marginBottom:6 }}>Por categoria</div>
        {categEntries.map(([name,val],i) => {
          const pct = total > 0 ? (val/total)*100 : 0
          return (
            <div key={name} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:4 }}>
              <div style={{ fontSize:10,color:'#0f172a',width:110,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{name}</div>
              <div style={{ flex:1,height:13,background:'#f0f4f9',borderRadius:3,overflow:'hidden' }}>
                <div style={{ width:`${Math.min(pct,100)}%`,height:'100%',background:colors[i],display:'flex',alignItems:'center',paddingLeft:5,borderRadius:3 }}>
                  <span style={{ fontSize:8,fontWeight:600,color:'#fff' }}>{Math.round(pct)}%</span>
                </div>
              </div>
              <div style={{ fontSize:9,fontFamily:'var(--mono)',color:'#64748b',width:40,textAlign:'right' }}>{fmtNum(val)}</div>
            </div>
          )
        })}
      </div>
      <div>
        <div style={{ fontSize:9,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'#94a3b8',marginBottom:5 }}>Incidentes</div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>
          {incidEntries.map(([name,val],i) => (
            <span key={name} style={{ padding:'2px 7px',borderRadius:99,fontSize:9,fontWeight:500,background:chipColors.cat[Math.min(i,3)],color:chipColors.ctxt[Math.min(i,3)] }}>
              {name} · {fmtNum(val)}
            </span>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize:9,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'#94a3b8',marginBottom:5 }}>Responsabilidade</div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>
          {respEntries.map(([name,val],i) => {
            const pct = total > 0 ? Math.round((val/total)*100) : 0
            return (
              <span key={name} style={{ padding:'2px 7px',borderRadius:99,fontSize:9,fontWeight:500,background:chipColors.cat[Math.min(i,3)],color:chipColors.ctxt[Math.min(i,3)] }}>
                {name} · {pct}%
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function DetailPanel({ title, kpis, children }) {
  return (
    <div style={{ background:'#f0f7ff',border:'1px solid #b5d4f4',borderRadius:10,padding:'12px 14px' }}>
      <div style={{ fontSize:11,fontWeight:600,color:'#185fa5',marginBottom:10,display:'flex',alignItems:'center',gap:5 }}>
        <span style={{ fontSize:14 }}>🔍</span> {title}
      </div>
      {kpis && (
        <div style={{ display:'grid',gridTemplateColumns:`repeat(${kpis.length},1fr)`,gap:6,marginBottom:10 }}>
          {kpis.map((k,i) => (
            <div key={i} style={{ background:'#fff',borderRadius:7,padding:'7px 9px',border:'0.5px solid #dde3ed' }}>
              <div style={{ fontSize:9,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.04em' }}>{k.label}</div>
              <div style={{ fontSize:13,fontWeight:700,fontFamily:'var(--mono)',marginTop:1,color:k.color||'#0f172a' }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

export function RankTable({ data, cols, onSelect, selected, maxHeight = 380 }) {
  return (
    <div style={{ overflowX:'auto',overflowY:'auto',maxHeight }}>
      <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
        <thead>
          <tr style={{ background:'#f8fafc',borderBottom:'0.5px solid #f0f4f9' }}>
            <th style={{ padding:'7px 8px',textAlign:'left',fontSize:9,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'#94a3b8',whiteSpace:'nowrap' }}>#</th>
            {cols.map(c => <th key={c.key} style={{ padding:'7px 8px',textAlign:'left',fontSize:9,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'#94a3b8',whiteSpace:'nowrap' }}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.name} onClick={() => onSelect && onSelect(selected===row.name?null:row.name)}
              style={{ borderBottom:'0.5px solid #f8fafc',cursor:onSelect?'pointer':'default',background:selected===row.name?'#e6f1fb':'transparent',transition:'background 0.1s' }}>
              <td style={{ padding:'6px 8px',color:'#94a3b8',fontFamily:'var(--mono)',fontSize:10 }}>{i+1}</td>
              {cols.map(c => <td key={c.key} style={{ padding:'6px 8px',...(c.style||{}) }}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
