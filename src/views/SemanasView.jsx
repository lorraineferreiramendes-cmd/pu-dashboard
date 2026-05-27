import { useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'
import { getWeeks, groupBy, groupByDate, groupByDow, calcPU, fmtPU, fmtNum, fmtDate, puColor, META_PU } from '../data'
import { KpiCard, CulpChart } from '../components/UI'

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:8,padding:'8px 12px',fontSize:11 }}>
      <div style={{ color:'#94a3b8',marginBottom:3 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color,fontWeight:600 }}>{p.name}: {typeof p.value==='number'?p.value.toFixed(1)+'%':p.value}</div>)}
      <div style={{ color:'#d97706',fontSize:10,marginTop:3 }}>Meta: {META_PU}%</div>
    </div>
  )
}

export default function SemanasView({ rows }) {
  const weeks = useMemo(()=>getWeeks(rows),[rows])
  const byDate = useMemo(()=>groupByDate(rows),[rows])
  const byDow  = useMemo(()=>groupByDow(rows),[rows])
  const puGeral = calcPU(rows)
  const totalCol = rows.reduce((s,r)=>s+r._col,0)
  const totalNao = rows.reduce((s,r)=>s+r._nao,0)

  const bestDay = byDate.reduce((best,d) => (!best||d.pu>best.pu)?d:best, null)
  const worstDay = byDate.reduce((worst,d) => (!worst||d.pu<worst.pu)?d:worst, null)
  const bestWeek = weeks.reduce((best,w) => (!best||w.pu>best.pu)?w:best, null)
  const worstWeek = weeks.reduce((worst,w) => (!worst||w.pu<worst.pu)?w:worst, null)

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8 }}>
        <KpiCard label="PU acumulado" value={fmtPU(puGeral)} color={puGeral>=META_PU?'green':puGeral>=META_PU-1?'amber':'blue'} sub={`Meta: ${META_PU}%`} trend={puGeral!==null?puGeral-META_PU:null} />
        <KpiCard label="Total coletados" value={fmtNum(totalCol)} color="green" sub={`${rows.filter((v,i,a)=>a.findIndex(x=>x._dateStr===v._dateStr)===i).length} dias`} />
        <KpiCard label="Não coletados" value={fmtNum(totalNao)} color="red" sub="pacotes perdidos" />
        <KpiCard label="Melhor dia" value={fmtPU(bestDay?.pu)} color="green" sub={bestDay?fmtDate(bestDay.date):''} />
        <KpiCard label="Pior dia" value={fmtPU(worstDay?.pu)} color="red" sub={worstDay?fmtDate(worstDay.date):''} />
      </div>

      <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:12,padding:'12px 14px' }}>
        <div style={{ fontSize:12,fontWeight:600,color:'#0f172a',marginBottom:12,display:'flex',justifyContent:'space-between' }}>
          <span>Evolução diária do PU — acumulado</span>
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
        <div style={{ fontSize:12,fontWeight:600,color:'#0f172a',marginBottom:12 }}>Semanas acumuladas — comparativo detalhado</div>
        <div style={{ display:'grid',gridTemplateColumns:`repeat(${Math.max(weeks.length,1)},1fr)`,gap:8 }}>
          {weeks.map((w,i) => {
            const prev = weeks[i-1]
            const delta = prev ? w.pu - prev.pu : null
            const isLast = i===weeks.length-1
            const isBest = bestWeek && w.label===bestWeek.label
            const isWorst = worstWeek && w.label===worstWeek.label && weeks.length>1
            return (
              <div key={w.label} style={{
                background: isLast?'#f0f7ff':'#fff',
                border: `0.5px solid ${isLast?'#b5d4f4':isBest?'#a0c87a':'#dde3ed'}`,
                borderRadius:10,padding:'10px 12px',
              }}>
                <div style={{ fontSize:9,color:isLast?'#185fa5':'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <span>{w.label}</span>
                  {isBest && <span style={{ padding:'1px 5px',borderRadius:99,fontSize:8,background:'#eaf3de',color:'#3b6d11',fontWeight:600 }}>melhor</span>}
                  {isWorst && <span style={{ padding:'1px 5px',borderRadius:99,fontSize:8,background:'#fcebeb',color:'#a32d2d',fontWeight:600 }}>pior</span>}
                  {isLast && !isBest && <span style={{ padding:'1px 5px',borderRadius:99,fontSize:8,background:'#e6f1fb',color:'#185fa5',fontWeight:600 }}>atual</span>}
                </div>
                <div style={{ fontSize:18,fontWeight:700,fontFamily:'var(--mono)',color:puColor(w.pu) }}>{fmtPU(w.pu)}</div>
                {delta!==null && (
                  <div style={{ fontSize:9,marginTop:2,color:delta>=0?'#16a34a':'#dc2626' }}>
                    {delta>=0?'▲':'▼'} {Math.abs(delta).toFixed(1)}pp vs sem. ant.
                  </div>
                )}
                <div style={{ height:3,background:'#f0f4f9',borderRadius:2,marginTop:6,overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(w.pu||0,100)}%`,height:'100%',background:puColor(w.pu),borderRadius:2 }}></div>
                </div>
                <div style={{ fontSize:8,color:'#94a3b8',marginTop:4 }}>{fmtDate(w.start)} → {fmtDate(w.end)}</div>
                <div style={{ fontSize:9,color:'#64748b',marginTop:4,paddingTop:4,borderTop:'0.5px solid #f0f4f9',display:'flex',justifyContent:'space-between' }}>
                  <span>Col: {fmtNum(w.col)}</span>
                  <span>Est: {fmtNum(w.est)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
        <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:12,padding:'12px 14px' }}>
          <div style={{ fontSize:12,fontWeight:600,color:'#0f172a',marginBottom:12 }}>PU médio por dia da semana</div>
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
          <div style={{ fontSize:12,fontWeight:600,color:'#0f172a',marginBottom:12 }}>Culpabilidade acumulada</div>
          <CulpChart rows={rows} />
        </div>
      </div>
    </div>
  )
}
