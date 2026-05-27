import { useState, useMemo } from 'react'
import { groupBy, calcPU, fmtPU, fmtNum, puColor, META_PU } from '../data'
import { StatusBadge, DetailPanel, CulpChart } from '../components/UI'

export default function VendedorView({ rows }) {
  const [sel, setSel] = useState(null)
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('')

  const vendedores = useMemo(()=>{
    let data = groupBy(rows,'shp_sender_nickname')
    if (search) data = data.filter(v=>v.name.toLowerCase().includes(search.toLowerCase()))
    if (fStatus==='ok') data = data.filter(v=>v.pu>=META_PU)
    if (fStatus==='bad') data = data.filter(v=>v.pu<META_PU)
    return data
  },[rows,search,fStatus])

  const selRows = sel ? rows.filter(r=>r.shp_sender_nickname===sel) : []
  const selInfo = vendedores.find(v=>v.name===sel)
  const selRotas = sel ? groupBy(selRows,'nome_rota') : []
  const initials = name => name ? name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : '??'

  const inp = { padding:'6px 10px',background:'#f8fafc',border:'0.5px solid #dde3ed',borderRadius:7,fontSize:11,color:'#0f172a',outline:'none' }

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
        <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:12,padding:'12px 14px' }}>
          <div style={{ display:'flex',gap:6,marginBottom:10,flexWrap:'wrap' }}>
            <div style={{ position:'relative',flex:1,minWidth:140 }}>
              <span style={{ position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#94a3b8' }}>🔍</span>
              <input style={{...inp,paddingLeft:26,width:'100%'}} placeholder="Buscar vendedor..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select style={inp} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
              <option value="">Todos status</option>
              <option value="ok">Acima da meta</option>
              <option value="bad">Abaixo da meta</option>
            </select>
            <span style={{ fontSize:10,color:'#94a3b8',fontFamily:'var(--mono)',alignSelf:'center' }}>{vendedores.length}</span>
          </div>

          <div style={{ overflowY:'auto',maxHeight:420 }}>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
              <thead>
                <tr style={{ background:'#f8fafc',borderBottom:'0.5px solid #f0f4f9' }}>
                  {['#','','Vendedor','ID','Pacotes','PU %','','Status'].map(h=>(
                    <th key={h} style={{ padding:'6px 8px',textAlign:'left',fontSize:9,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'#94a3b8',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendedores.map((v,i) => {
                  const ok = v.pu>=META_PU, warn = v.pu>=META_PU-1
                  const avatarBg = ok?'#eaf3de':warn?'#faeeda':'#fcebeb'
                  const avatarC  = ok?'#3b6d11':warn?'#854f0b':'#a32d2d'
                  const isSel = sel===v.name
                  const id = v.rows[0]?.shp_sender_id || '—'
                  return (
                    <tr key={v.name} onClick={()=>setSel(isSel?null:v.name)} style={{ borderBottom:'0.5px solid #f8fafc',cursor:'pointer',background:isSel?'#e6f1fb':'transparent',transition:'background 0.1s' }}>
                      <td style={{ padding:'6px 8px',color:'#94a3b8',fontFamily:'var(--mono)',fontSize:10 }}>{i+1}</td>
                      <td style={{ padding:'6px 8px' }}>
                        <div style={{ width:24,height:24,borderRadius:'50%',background:avatarBg,color:avatarC,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700 }}>{initials(v.name)}</div>
                      </td>
                      <td style={{ padding:'6px 8px',fontWeight:600,color:'#0f172a',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{v.name}</td>
                      <td style={{ padding:'6px 8px',fontSize:9,color:'#94a3b8',fontFamily:'var(--mono)' }}>{id}</td>
                      <td style={{ padding:'6px 8px',fontSize:10,color:'#64748b' }}>{fmtNum(v.est)}</td>
                      <td style={{ padding:'6px 8px',fontFamily:'var(--mono)',fontWeight:700,color:puColor(v.pu) }}>{fmtPU(v.pu)}</td>
                      <td style={{ padding:'6px 8px' }}><div style={{ width:55,height:5,background:'#f0f4f9',borderRadius:2,overflow:'hidden' }}><div style={{ width:`${Math.min(v.pu||0,100)}%`,height:'100%',background:puColor(v.pu) }}></div></div></td>
                      <td style={{ padding:'6px 8px' }}><StatusBadge pu={v.pu} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selInfo ? (
          <div style={{ background:'#f0f7ff',border:'1px solid #b5d4f4',borderRadius:12,padding:'12px 14px',display:'flex',flexDirection:'column',gap:10 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
              <div style={{ width:32,height:32,borderRadius:'50%',background:'#e6f1fb',color:'#185fa5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700 }}>{initials(sel)}</div>
              <div>
                <div style={{ fontSize:13,fontWeight:600,color:'#0f172a' }}>{sel}</div>
                <div style={{ fontSize:10,color:'#94a3b8',fontFamily:'var(--mono)' }}>{selRows[0]?.shp_sender_id}</div>
              </div>
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6 }}>
              {[{l:'PU',v:fmtPU(selInfo.pu),c:puColor(selInfo.pu)},{l:'Coletados',v:fmtNum(selInfo.col)},{l:'Não coletados',v:fmtNum(selInfo.nao),c:'#dc2626'},{l:'Rotas ativas',v:selRotas.length}].map((k,i)=>(
                <div key={i} style={{ background:'#fff',borderRadius:7,padding:'7px 9px',border:'0.5px solid #dde3ed' }}>
                  <div style={{ fontSize:9,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.04em' }}>{k.l}</div>
                  <div style={{ fontSize:14,fontWeight:700,fontFamily:'var(--mono)',color:k.c||'#0f172a',marginTop:1 }}>{k.v}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize:10,fontWeight:600,color:'#185fa5',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5 }}>Rotas com pacotes</div>
              <div style={{ display:'flex',flexDirection:'column',gap:3,maxHeight:150,overflowY:'auto' }}>
                {selRotas.map(r=>(
                  <div key={r.name} style={{ display:'flex',alignItems:'center',gap:6,padding:'4px 8px',background:'#fff',borderRadius:5,border:'0.5px solid #f0f4f9',fontSize:10 }}>
                    <span style={{ flex:1,fontWeight:600,color:'#0f172a' }}>{r.name}</span>
                    <span style={{ padding:'1px 5px',borderRadius:99,fontSize:8,background:'#e6f1fb',color:'#185fa5',fontWeight:500 }}>{[...new Set(r.rows.map(x=>x.cluster1).filter(Boolean))].join(',')}</span>
                    <span style={{ fontFamily:'var(--mono)',fontWeight:700,fontSize:11,color:puColor(r.pu) }}>{fmtPU(r.pu)}</span>
                    <span style={{ padding:'1px 5px',borderRadius:99,fontSize:8,fontWeight:600,background:r.pu>=META_PU?'#eaf3de':'#fcebeb',color:r.pu>=META_PU?'#3b6d11':'#a32d2d' }}>{r.pu>=META_PU?'✓':'✗'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop:'0.5px solid #dde3ed',paddingTop:10 }}>
              <div style={{ fontSize:10,fontWeight:600,color:'#185fa5',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8 }}>Culpabilidade</div>
              <CulpChart rows={selRows} />
            </div>
          </div>
        ) : (
          <div style={{ background:'#f8fafc',border:'0.5px solid #dde3ed',borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8',fontSize:12 }}>
            ← Selecione um vendedor para ver detalhes
          </div>
        )}
      </div>
    </div>
  )
}
