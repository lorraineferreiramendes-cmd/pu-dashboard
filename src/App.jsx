import { useState, useMemo } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { useSheetsData, META_PU } from './data'
import OverviewView from './views/OverviewView'
import RotasView from './views/RotasView'
import TransportadorView from './views/TransportadorView'
import VendedorView from './views/VendedorView'
import SemanasView from './views/SemanasView'

const TABS = [
  { id:'overview', label:'Visão geral', icon:'📊' },
  { id:'rotas',    label:'Rotas',       icon:'🗺️' },
  { id:'transp',   label:'Transportador', icon:'🚛' },
  { id:'vendedor', label:'Vendedor',    icon:'👤' },
  { id:'semanas',  label:'Semanas do mês', icon:'📅' },
]

function today() { return new Date().toISOString().slice(0,10) }
function yesterday() { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10) }
function fmtDisplay(str) { if (!str) return '—'; const [y,m,d]=str.split('-'); return `${d}/${m}/${y}` }
function monthStart() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` }
function weekStart() { const d = new Date(); d.setDate(d.getDate()-d.getDay()+1); return d.toISOString().slice(0,10) }

export default function App() {
  const { raw, loading, error, refetch, lastUpdated } = useSheetsData()
  const [tab, setTab] = useState('overview')
  const [period, setPeriod] = useState('d0')
  const [accumRange, setAccumRange] = useState('month')
  const [customFrom, setCustomFrom] = useState(monthStart())
  const [customTo,   setCustomTo]   = useState(today())
  const [fCluster, setFCluster] = useState('')
  const [fCarrier, setFCarrier] = useState('')

  const clusters = useMemo(()=>[...new Set(raw.map(r=>r.cluster1).filter(Boolean))].sort((a,b)=>+a-+b),[raw])
  const carriers  = useMemo(()=>[...new Set(raw.map(r=>r.carrier).filter(Boolean))].sort(),[raw])

  const rows = useMemo(()=>{
    let dateFrom, dateTo
    if (period==='d0')  { dateFrom = today();     dateTo = today() }
    if (period==='d-1') { dateFrom = yesterday(); dateTo = yesterday() }
    if (period==='accum') {
      if (accumRange==='week')  { dateFrom = weekStart();  dateTo = today() }
      if (accumRange==='month') { dateFrom = monthStart(); dateTo = today() }
      if (accumRange==='custom'){ dateFrom = customFrom;   dateTo = customTo }
    }
    return raw.filter(r => {
      if (dateFrom && r._dateStr < dateFrom) return false
      if (dateTo   && r._dateStr > dateTo)   return false
      if (fCluster && r.cluster1 !== fCluster) return false
      if (fCarrier && r.carrier  !== fCarrier)  return false
      return true
    })
  },[raw,period,accumRange,customFrom,customTo,fCluster,fCarrier])

  const periodLabel = useMemo(()=>{
    if (period==='d0')  return `${fmtDisplay(today())} · em andamento`
    if (period==='d-1') return `${fmtDisplay(yesterday())} · fechado`
    if (accumRange==='week')   return `${fmtDisplay(weekStart())} → hoje`
    if (accumRange==='month')  return `${fmtDisplay(monthStart())} → hoje`
    return `${fmtDisplay(customFrom)} → ${fmtDisplay(customTo)}`
  },[period,accumRange,customFrom,customTo])

  const inp = { padding:'5px 8px',background:'#f8fafc',border:'0.5px solid #dde3ed',borderRadius:7,fontSize:11,color:'#64748b',outline:'none' }

  if (loading) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:12,color:'#64748b' }}>
      <RefreshCw size={24} style={{ animation:'spin 1s linear infinite' }} />
      <span style={{ fontSize:14 }}>Carregando dados da planilha...</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:12,color:'#64748b' }}>
      <AlertTriangle size={24} color="#dc2626" />
      <span style={{ fontSize:14 }}>Erro: {error}</span>
      <button onClick={refetch} style={{ padding:'8px 16px',background:'#e6f1fb',color:'#2563eb',border:'0.5px solid #b5d4f4',borderRadius:8,fontSize:13,cursor:'pointer' }}>Tentar novamente</button>
    </div>
  )

  return (
    <div style={{ background:'#f0f4f9',minHeight:'100vh',padding:'1.25rem 1.5rem',fontFamily:'var(--font)' }}>
      <div style={{ maxWidth:1300,margin:'0 auto',display:'flex',flexDirection:'column',gap:10 }}>

        <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8 }}>
          <div>
            <h1 style={{ fontSize:18,fontWeight:700,color:'#0f172a',letterSpacing:'-0.02em' }}>
              Dashboard PU <span style={{ color:'#2563eb',background:'#e6f1fb',padding:'1px 8px',borderRadius:5,fontSize:12,marginLeft:6 }}>CPS</span>
            </h1>
            <p style={{ fontSize:10,color:'#64748b',marginTop:2 }}>Pickup Success · Meta: <strong style={{ color:'#d97706' }}>{META_PU}%</strong> · {lastUpdated ? `Atualizado ${lastUpdated.toLocaleTimeString('pt-BR')}` : ''}</p>
          </div>
          <div style={{ display:'flex',gap:6 }}>
            <button onClick={refetch} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',background:'#f8fafc',color:'#64748b',border:'0.5px solid #dde3ed',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer' }}>
              <RefreshCw size={13}/> Atualizar
            </button>
          </div>
        </div>

        <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:12,padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
            <div style={{ display:'inline-flex',background:'#f0f4f9',borderRadius:9,padding:3,gap:2 }}>
              {[{id:'d0',l:'D0',sub:'hoje'},{id:'d-1',l:'D-1',sub:'ontem'},{id:'accum',l:'Acumulado',sub:'período'}].map(p=>(
                <div key={p.id} onClick={()=>setPeriod(p.id)} style={{
                  padding:'5px 14px',borderRadius:7,fontSize:11,fontWeight:500,cursor:'pointer',
                  background:period===p.id?'#fff':'transparent',
                  color:period===p.id?'#185fa5':'#64748b',
                  border:period===p.id?'0.5px solid #b5d4f4':'0.5px solid transparent',
                  transition:'all 0.12s',
                }}>
                  {p.l} <span style={{ fontSize:8,display:'block',color:period===p.id?'#2563eb':'#94a3b8' }}>{p.sub}</span>
                </div>
              ))}
            </div>
            {period==='accum' && (
              <div style={{ display:'flex',gap:5,alignItems:'center',flexWrap:'wrap' }}>
                {[{id:'week',l:'Semana atual'},{id:'month',l:'Mês atual'},{id:'custom',l:'Personalizado'}].map(r=>(
                  <div key={r.id} onClick={()=>setAccumRange(r.id)} style={{ padding:'4px 10px',borderRadius:7,fontSize:11,fontWeight:500,cursor:'pointer',background:accumRange===r.id?'#e6f1fb':'#f8fafc',color:accumRange===r.id?'#185fa5':'#64748b',border:`0.5px solid ${accumRange===r.id?'#b5d4f4':'#dde3ed'}` }}>
                    {r.l}
                  </div>
                ))}
                {accumRange==='custom' && (
                  <>
                    <input type="date" style={inp} value={customFrom} onChange={e=>setCustomFrom(e.target.value)} />
                    <span style={{ fontSize:10,color:'#94a3b8' }}>até</span>
                    <input type="date" style={inp} value={customTo} onChange={e=>setCustomTo(e.target.value)} />
                  </>
                )}
              </div>
            )}
            <div style={{ padding:'4px 10px',borderRadius:6,fontSize:10,fontWeight:600,background:'#e6f1fb',color:'#185fa5',border:'0.5px solid #b5d4f4' }}>{periodLabel}</div>
          </div>

          <div style={{ display:'flex',gap:6,alignItems:'center',flexWrap:'wrap' }}>
            <select style={inp} value={fCluster} onChange={e=>setFCluster(e.target.value)}>
              <option value="">Todos clusters</option>
              {clusters.map(c=><option key={c} value={c}>Cluster {c}</option>)}
            </select>
            <select style={inp} value={fCarrier} onChange={e=>setFCarrier(e.target.value)}>
              <option value="">Todos transportadores</option>
              {carriers.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            {(fCluster||fCarrier) && (
              <button onClick={()=>{setFCluster('');setFCarrier('')}} style={{ padding:'4px 10px',borderRadius:7,fontSize:11,background:'#fcebeb',color:'#a32d2d',border:'0.5px solid #f09595',cursor:'pointer' }}>Limpar</button>
            )}
            <span style={{ fontSize:10,color:'#94a3b8',fontFamily:'var(--mono)' }}>{rows.length} registros</span>
          </div>
        </div>

        <div style={{ display:'flex',gap:3,background:'#fff',border:'0.5px solid #dde3ed',borderRadius:10,padding:4 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              display:'flex',alignItems:'center',gap:5,padding:'5px 14px',borderRadius:7,
              fontSize:12,fontWeight:500,cursor:'pointer',border:'none',
              background:tab===t.id?'#e6f1fb':'transparent',
              color:tab===t.id?'#185fa5':'#64748b',
              outline:tab===t.id?'0.5px solid #b5d4f4':'none',
              transition:'all 0.12s',
            }}>
              <span style={{ fontSize:13 }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {rows.length === 0 && !loading ? (
          <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:12,padding:'3rem',textAlign:'center',color:'#94a3b8',fontSize:13 }}>
            Nenhum dado encontrado para o período e filtros selecionados.
          </div>
        ) : (
          <>
            {tab==='overview'  && <OverviewView rows={rows} />}
            {tab==='rotas'     && <RotasView rows={rows} />}
            {tab==='transp'    && <TransportadorView rows={rows} />}
            {tab==='vendedor'  && <VendedorView rows={rows} />}
            {tab==='semanas'   && <SemanasView rows={rows} />}
          </>
        )}

      </div>
    </div>
  )
}
