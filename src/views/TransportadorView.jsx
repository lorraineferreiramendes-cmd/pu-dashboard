import { useState, useMemo } from 'react'
import { groupBy, calcPU, fmtPU, fmtNum, puColor, META_PU } from '../data'
import { StatusBadge, DetailPanel, CulpChart } from '../components/UI'

export default function TransportadorView({ rows }) {
  const [sel, setSel] = useState(null)
  const carriers = useMemo(()=>groupBy(rows,'carrier'),[rows])
  const selRows = sel ? rows.filter(r=>r.carrier===sel) : []
  const veiculos = useMemo(()=>sel?groupBy(selRows,'VEIC_PLAN'):[],[sel,selRows])
  const selInfo = carriers.find(c=>c.name===sel)

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
        <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:12,padding:'12px 14px' }}>
          <div style={{ fontSize:12,fontWeight:600,color:'#0f172a',marginBottom:10,display:'flex',justifyContent:'space-between' }}>
            <span>PU por transportador</span>
            <span style={{ fontSize:10,color:'#94a3b8' }}>clique para detalhar</span>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            {carriers.map((c,i) => (
              <div key={c.name} onClick={()=>setSel(sel===c.name?null:c.name)} style={{
                display:'flex',alignItems:'center',gap:8,padding:'8px 10px',
                background:sel===c.name?'#e6f1fb':'#f8fafc',
                border:`0.5px solid ${sel===c.name?'#2563eb':'#f0f4f9'}`,
                borderRadius:8,cursor:'pointer',transition:'all 0.12s'
              }}>
                <span style={{ fontSize:10,fontFamily:'var(--mono)',color:'#94a3b8',width:16 }}>{i+1}</span>
                <span style={{ flex:1,fontSize:12,fontWeight:600,color:'#0f172a' }}>{c.name}</span>
                <div style={{ width:90,height:7,background:'#f0f4f9',borderRadius:3,overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(c.pu||0,100)}%`,height:'100%',background:puColor(c.pu),borderRadius:3 }}></div>
                </div>
                <span style={{ fontFamily:'var(--mono)',fontWeight:700,fontSize:12,color:puColor(c.pu),width:44,textAlign:'right' }}>{fmtPU(c.pu)}</span>
                <span style={{ fontSize:10,color:'#94a3b8',width:64,textAlign:'right' }}>{fmtNum(c.est)} pkgs</span>
                <StatusBadge pu={c.pu} />
              </div>
            ))}
          </div>
        </div>

        {sel && selInfo ? (
          <div style={{ background:'#fff',border:'0.5px solid #dde3ed',borderRadius:12,padding:'12px 14px' }}>
            <div style={{ fontSize:12,fontWeight:600,color:'#0f172a',marginBottom:10 }}>Veículos · {sel}</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:12 }}>
              {[{l:'PU',v:fmtPU(selInfo.pu),c:puColor(selInfo.pu)},{l:'Veículos',v:veiculos.length},{l:'Não coletados',v:fmtNum(selInfo.nao),c:'#dc2626'}].map((k,i)=>(
                <div key={i} style={{ background:'#f8fafc',borderRadius:7,padding:'7px 9px',border:'0.5px solid #f0f4f9' }}>
                  <div style={{ fontSize:9,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.04em' }}>{k.l}</div>
                  <div style={{ fontSize:14,fontWeight:700,fontFamily:'var(--mono)',color:k.c||'#0f172a',marginTop:1 }}>{k.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:5,marginBottom:12 }}>
              {veiculos.map(v=>(
                <div key={v.name} style={{ background:'#f8fafc',border:'0.5px solid #f0f4f9',borderRadius:7,padding:'7px 9px' }}>
                  <div style={{ fontSize:10,fontWeight:600,color:'#0f172a',marginBottom:2 }}>{v.name||'N/A'}</div>
                  <div style={{ fontSize:14,fontWeight:700,fontFamily:'var(--mono)',color:puColor(v.pu) }}>{fmtPU(v.pu)}</div>
                  <div style={{ fontSize:9,color:'#94a3b8',marginTop:1 }}>{fmtNum(v.est)} pkgs</div>
                  <div style={{ height:3,background:'#f0f4f9',borderRadius:2,marginTop:5,overflow:'hidden' }}>
                    <div style={{ width:`${Math.min(v.pu||0,100)}%`,height:'100%',background:puColor(v.pu),borderRadius:2 }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop:'0.5px solid #f0f4f9',paddingTop:10 }}>
              <div style={{ fontSize:10,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8 }}>Culpabilidade</div>
              <CulpChart rows={selRows} />
            </div>
          </div>
        ) : (
          <div style={{ background:'#f8fafc',border:'0.5px solid #dde3ed',borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8',fontSize:12 }}>
            ← Selecione um transportador para ver detalhes
          </div>
        )}
      </div>
    </div>
  )
}
