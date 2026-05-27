import { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'
import { groupBy, groupByDate, groupByDow, calcPU, fmtPU, fmtNum, puColor, META_PU } from '../data'
import { KpiCard, ClusterGrid, DetailPanel, CulpChart } from '../components/UI'

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:8,padding:'8px 12px',fontSize:11,boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ color:'#94a3b8',marginBottom:3 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color,fontWeight:600 }}>{p.name}: {typeof p.value==='number'?p.value.toFixed(1)+'%':p.value}</div>)}
      <div style={{ color:'#d97706',fontSize:10,marginTop:3 }}>Meta: {META_PU}%</div>
    </div>
  )
}

export default function OverviewView({ rows }) {
  const [selCluster, setSelCluster] = useState(null)
  const puGeral = calcPU(rows)
  const totalCol = rows.reduce((s,r)=>s+r._col,0)
  const totalEst = rows.reduce((s,r)=>s+r._est,0)
  const totalNao = rows.reduce((s,r)=>s+r._nao,0)
  const byCluster = groupBy(rows, 'cluster1').sort((a,b)=>+a.name - +b.name)
  const rotasAbaixo = groupBy(rows,'nome_rota').filter(r=>r.pu!==null&&r.pu<META_PU).length
  const totalRotas = groupBy(rows,'nome_rota').length
  const byDate = groupByDate(rows)
  const byDow = groupByDow(rows)
  const selRows = selCluster ? rows.filter(r=>r.cluster1===selCluster) : []
  const selData = selCluster ? groupBy(selRows,'nome_rota') : []

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
        <KpiCard label="PU Geral" value={fmtPU(puGeral)} color={puGeral>=META_PU?'green':puGeral>=META_PU-1?'amber':'blue'} sub={`Meta: ${META_PU}%`} trend={puGeral!==null?puGeral-META_PU:null} />
        <KpiCard label="Coletados" value={fmtNum(totalCol)} color="green" sub={`de ${fmtNum(totalEst)} estimados`} />
        <KpiCard label="Não coletados" value={fmtNum(totalNao)} color={totalNao>0?'red':'green'} sub="pacotes" />
        <KpiCard label="Rotas abaixo meta" value={rotasAbaixo} color={rotasAbaixo>0?'amber':'green'} sub={`de ${totalRotas} rotas`} />
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'3fr 2fr',gap:12 }}>
        <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:12,padding:'12px 14px' }}>
          <div style={{ fontSize:12,fontWeight:600,color:'#0f172a',marginBottom:12,display:'flex',justifyContent:'space-between' }}>
            <span>Evolução diária do PU</span>
            <span style={{ fontSize:10,color:'#94a3b8' }}>— meta {META_PU}%</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={byDate} margin={{top:5,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f9" />
              <XAxis dataKey="label" tick={{fill:'#94a3b8',fontSize:9}} interval="preserveStartEnd" />
              <YAxis domain={[75,100]} tick={{fill:'#94a3b8',fontSize:9}} tickFormatter={v=>v+'%'} />
              <Tooltip content={<Tip/>} />
              <ReferenceLine y={META_PU} stroke="#d97706" strokeDasharray="4 3" />
              <Line type="monotone" dataKey="pu" name="PU" stroke="#2563eb" strokeWidth={2} dot={{r:2,fill:'#2563eb'}} activeDot={{r:4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:12,padding:'12px 14px' }}>
          <div style={{ fontSize:12,fontWeight:600,color:'#0f172a',marginBottom:12 }}>Mapa de clusters</div>
          <ClusterGrid data={byCluster} onSelect={setSelCluster} selected={selCluster} />
        </div>
      </div>

      {selCluster && (
        <DetailPanel title={`Cluster ${selCluster}`} kpis={[
          {label:'PU cluster',value:fmtPU(calcPU(selRows)),color:puColor(calcPU(selRows))},
          {label:'Não coletados',value:fmtNum(selRows.reduce((s,r)=>s+r._nao,0)),color:'#dc2626'},
          {label:'Rotas',value:selData.length},
          {label:'Transportadores',value:[...new Set(selRows.map(r=>r.carrier).filter(Boolean))].length},
        ]}>
          <div style={{ display:'flex',flexDirection:'column',gap:3,maxHeight:180,overflowY:'auto' }}>
            {selData.map(r => (
              <div key={r.name} style={{ display:'flex',alignItems:'center',gap:8,padding:'5px 8px',background:'#fff',borderRadius:6,border:'0.5px solid #f0f4f9',fontSize:11 }}>
                <span style={{ flex:1,fontWeight:600,color:'#0f172a' }}>{r.name}</span>
                <span style={{ fontFamily:'var(--mono)',fontWeight:700,color:puColor(r.pu) }}>{fmtPU(r.pu)}</span>
                <span style={{ padding:'1px 6px',borderRadius:99,fontSize:9,fontWeight:600,background:r.pu>=META_PU?'#eaf3de':'#fcebeb',color:r.pu>=META_PU?'#3b6d11':'#a32d2d' }}>{r.pu>=META_PU?'✓':'✗'}</span>
              </div>
            ))}
          </div>
        </DetailPanel>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
        <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:12,padding:'12px 14px' }}>
          <div style={{ fontSize:12,fontWeight:600,color:'#0f172a',marginBottom:12 }}>PU por dia da semana</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byDow} margin={{top:5,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f9" />
              <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} />
              <YAxis domain={[75,100]} tick={{fill:'#94a3b8',fontSize:9}} tickFormatter={v=>v+'%'} />
              <Tooltip content={<Tip/>} />
              <ReferenceLine y={META_PU} stroke="#d97706" strokeDasharray="4 3" />
              <Bar dataKey="pu" name="PU" radius={[3,3,0,0]}>
                {byDow.map((e,i) => <Cell key={i} fill={puColor(e.pu)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:12,padding:'12px 14px' }}>
          <div style={{ fontSize:12,fontWeight:600,color:'#0f172a',marginBottom:12 }}>Culpabilidade</div>
          <CulpChart rows={rows} />
        </div>
      </div>
    </div>
  )
}
