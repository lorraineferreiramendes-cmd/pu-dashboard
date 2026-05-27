import { useState, useMemo } from 'react'
import { groupBy, calcPU, fmtPU, fmtNum, puColor, META_PU } from '../data'
import { StatusBadge, DetailPanel, CulpChart } from '../components/UI'

export default function RotasView({ rows }) {
  const [sel, setSel] = useState(null)
  const [search, setSearch] = useState('')
  const [fCluster, setFCluster] = useState('')
  const [fCarrier, setFCarrier] = useState('')
  const [fStatus, setFStatus] = useState('')

  const clusters = useMemo(()=>[...new Set(rows.map(r=>r.cluster1).filter(Boolean))].sort((a,b)=>+a-+b),[rows])
  const carriers = useMemo(()=>[...new Set(rows.map(r=>r.carrier).filter(Boolean))].sort(),[rows])

  const rotas = useMemo(()=>{
    let data = groupBy(rows,'nome_rota')
    if (search) data = data.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()))
    if (fCluster) data = data.filter(r=>r.rows[0]?.cluster1===fCluster)
    if (fCarrier) data = data.filter(r=>r.rows[0]?.carrier===fCarrier)
    if (fStatus==='ok') data = data.filter(r=>r.pu>=META_PU)
    if (fStatus==='bad') data = data.filter(r=>r.pu<META_PU)
    return data
  },[rows,search,fCluster,fCarrier,fStatus])

  const selRows = sel ? rows.filter(r=>r.nome_rota===sel) : []
  const selInfo = sel ? rotas.find(r=>r.name===sel) : null

  const inp = { padding:'6px 10px',background:'#f8fafc',border:'0.5px solid #dde3ed',borderRadius:7,fontSize:11,color:'#0f172a',outline:'none' }

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
      <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:12,padding:'12px 14px' }}>
        <div style={{ display:'flex',gap:6,marginBottom:10,flexWrap:'wrap',alignItems:'center' }}>
          <div style={{ position:'relative',flex:1,minWidth:160 }}>
            <span style={{ position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#94a3b8' }}>🔍</span>
            <input style={{...inp,paddingLeft:26,width:'100%'}} placeholder="Buscar rota..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <select style={inp} value={fCluster} onChange={e=>setFCluster(e.target.value)}>
            <option value="">Todos clusters</option>
            {clusters.map(c=><option key={c}>Cluster {c}</option>)}
          </select>
          <select style={inp} value={fCarrier} onChange={e=>setFCarrier(e.target.value)}>
            <option value="">Todos transportadores</option>
            {carriers.map(c=><option key={c}>{c}</option>)}
          </select>
          <select style={inp} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
            <option value="">Todos status</option>
            <option value="ok">Acima da meta</option>
            <option value="bad">Abaixo da meta</option>
          </select>
          <span style={{ fontSize:10,color:'#94a3b8',fontFamily:'var(--mono)' }}>{rotas.length} rotas</span>
        </div>

        <div style={{ overflowX:'auto',maxHeight:380,overflowY:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
            <thead>
              <tr style={{ background:'#f8fafc',borderBottom:'0.5px solid #f0f4f9',position:'sticky',top:0 }}>
                {['#','Rota','Cluster','Transportador','Coletados','Estimados','PU %','','Status'].map(h=>(
                  <th key={h} style={{ padding:'7px 8px',textAlign:'left',fontSize:9,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'#94a3b8',whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rotas.map((r,i) => {
                const carrier = [...new Set(r.rows.map(x=>x.carrier).filter(Boolean))].join(', ')
                const cluster = [...new Set(r.rows.map(x=>x.cluster1).filter(Boolean))].join(', ')
                const isSel = sel===r.name
                return (
                  <tr key={r.name} onClick={()=>setSel(isSel?null:r.name)} style={{ borderBottom:'0.5px solid #f8fafc',cursor:'pointer',background:isSel?'#e6f1fb':'transparent',transition:'background 0.1s' }}>
                    <td style={{ padding:'6px 8px',color:'#94a3b8',fontFamily:'var(--mono)',fontSize:10 }}>{i+1}</td>
                    <td style={{ padding:'6px 8px',fontWeight:600,color:'#0f172a' }}>{r.name}</td>
                    <td style={{ padding:'6px 8px' }}><span style={{ padding:'1px 6px',borderRadius:99,fontSize:9,background:'#e6f1fb',color:'#185fa5',fontWeight:500 }}>{cluster}</span></td>
                    <td style={{ padding:'6px 8px',fontSize:10,color:'#64748b' }}>{carrier}</td>
                    <td style={{ padding:'6px 8px',fontSize:10,color:'#64748b' }}>{fmtNum(r.col)}</td>
                    <td style={{ padding:'6px 8px',fontSize:10,color:'#64748b' }}>{fmtNum(r.est)}</td>
                    <td style={{ padding:'6px 8px',fontFamily:'var(--mono)',fontWeight:700,color:puColor(r.pu) }}>{fmtPU(r.pu)}</td>
                    <td style={{ padding:'6px 8px' }}><div style={{ width:60,height:6,background:'#f0f4f9',borderRadius:3,overflow:'hidden' }}><div style={{ width:`${Math.min(r.pu||0,100)}%`,height:'100%',background:puColor(r.pu),borderRadius:3 }}></div></div></td>
                    <td style={{ padding:'6px 8px' }}><StatusBadge pu={r.pu} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selInfo && (
        <DetailPanel title={`${sel} · ${[...new Set(selRows.map(r=>r.cluster1).filter(Boolean))].map(c=>`Cluster ${c}`).join(', ')}`} kpis={[
          {label:'PU',value:fmtPU(selInfo.pu),color:puColor(selInfo.pu)},
          {label:'Coletados',value:fmtNum(selInfo.col)},
          {label:'Não coletados',value:fmtNum(selInfo.nao),color:'#dc2626'},
          {label:'Transportador',value:[...new Set(selRows.map(r=>r.carrier).filter(Boolean))].join(', '),color:'#2563eb'},
          {label:'Veículo',value:[...new Set(selRows.map(r=>r.VEIC_PLAN).filter(Boolean))].join(', ')},
        ]}>
          <div style={{ marginTop:10,paddingTop:10,borderTop:'0.5px solid #dde3ed' }}>
            <CulpChart rows={selRows} />
          </div>
        </DetailPanel>
      )}
    </div>
  )
}
