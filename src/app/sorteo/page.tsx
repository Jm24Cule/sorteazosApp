'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

interface Comment { username: string; text: string; timestamp?: string }
interface Filters {
  minMentions: number; requireDistinctMentions: boolean
  hashtags: string[]; keywords: string[]
  excludeDuplicates: boolean; excludeOrganizer: boolean; organizerUsername: string
  requireFollow: boolean; followAccount: string
  requireLike: boolean
}
interface Participant { username: string; comment: Comment }
type Phase = 'setup' | 'ready' | 'rolling' | 'winner'
type Theme = 'dark' | 'light'

function parseComments(raw: string): Comment[] {
  return raw.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const match = line.match(/^@?([\w.]+)[:\s]+(.+)/)
    if (match) return { username: match[1].toLowerCase(), text: match[2] }
    const atMatch = line.match(/@([\w.]+)/)
    if (atMatch) return { username: atMatch[1].toLowerCase(), text: line }
    return null
  }).filter(Boolean) as Comment[]
}

function getMentions(text: string, self: string): string[] {
  return [...text.matchAll(/@([\w.]+)/g)].map(m => m[1].toLowerCase()).filter(u => u !== self.toLowerCase())
}

function filterParticipants(comments: Comment[], filters: Filters) {
  const valid: Participant[] = []
  const invalid: Array<Participant & { reason: string }> = []
  const seen = new Set<string>()
  for (const c of comments) {
    const p: Participant = { username: c.username, comment: c }
    let reason = ''
    if (filters.excludeOrganizer && filters.organizerUsername && c.username === filters.organizerUsername.toLowerCase().replace(/^@/, '')) {
      reason = 'Es el organizador'
    } else if (filters.excludeDuplicates && seen.has(c.username)) {
      reason = 'Comentario duplicado'
    } else {
      const mentions = getMentions(c.text, c.username)
      const eff = filters.requireDistinctMentions ? [...new Set(mentions)] : mentions
      if (eff.length < filters.minMentions) {
        reason = `Solo ${eff.length} mención(es) (mínimo ${filters.minMentions})`
      } else if (filters.hashtags.length > 0) {
        const low = c.text.toLowerCase()
        const miss = filters.hashtags.find(h => !low.includes('#' + h))
        if (miss) reason = `Falta hashtag: #${miss}`
      }
      if (!reason && filters.keywords.length > 0) {
        const low = c.text.toLowerCase()
        const miss = filters.keywords.find(k => !low.includes(k))
        if (miss) reason = `Falta palabra: "${miss}"`
      }
    }
    if (reason) invalid.push({ ...p, reason })
    else { valid.push(p); seen.add(c.username) }
  }
  return { valid, invalid }
}

function launchConfetti() {
  const colors = ['#f97316','#fb923c','#fbbf24','#4ade80','#60a5fa','#f472b6','#a78bfa']
  for (let i = 0; i < 80; i++) {
    const d = document.createElement('div')
    const size = 6 + Math.random() * 8
    d.style.cssText = `position:fixed;width:${size}px;height:${size}px;border-radius:${Math.random()>.5?'50%':'2px'};background:${colors[Math.floor(Math.random()*colors.length)]};left:${Math.random()*100}vw;top:-10px;z-index:9999;animation:fall ${1.8+Math.random()*2}s linear ${Math.random()*.6}s forwards;`
    document.body.appendChild(d)
    setTimeout(() => d.remove(), 5000)
  }
}

function TagInput({ tags, onAdd, onRemove, placeholder, prefix='', theme }: { tags: string[]; onAdd:(t:string)=>void; onRemove:(i:number)=>void; placeholder:string; prefix?:string; theme:Theme }) {
  const [val, setVal] = useState('')
  const isDark = theme === 'dark'
  return (
    <div>
      <input className="w-full rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none transition-colors"
        style={{ background: isDark?'#18181b':'#f4f4f5', border:`1px solid ${isDark?'#3f3f46':'#d4d4d8'}`, color: isDark?'#fafafa':'#18181b' }}
        value={val} onChange={e=>setVal(e.target.value)} placeholder={placeholder}
        onKeyDown={e=>{ if(e.key==='Enter'){e.preventDefault(); const c=val.trim().replace(/^[#@]/,'').toLowerCase(); if(c&&!tags.includes(c))onAdd(c); setVal('')}}}
      />
      {tags.length>0&&<div className="flex flex-wrap gap-2 mt-2">{tags.map((t,i)=>(
        <span key={t} className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-mono"
          style={{ background:isDark?'#27272a':'#e4e4e7', border:`1px solid ${isDark?'#3f3f46':'#d4d4d8'}`, color:'#f97316' }}>
          {prefix}{t}<button onClick={()=>onRemove(i)} className="ml-1 text-sm" style={{color:isDark?'#71717a':'#a1a1aa'}}>×</button>
        </span>
      ))}</div>}
    </div>
  )
}

function Toggle({ checked, onChange, label, desc, theme, children }: { checked:boolean; onChange:(v:boolean)=>void; label:string; desc?:string; theme:Theme; children?: React.ReactNode }) {
  const isDark = theme === 'dark'
  return (
    <div className="py-3.5 border-b last:border-0" style={{borderColor:isDark?'#27272a':'#e4e4e7'}}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold" style={{color:isDark?'#e4e4e7':'#27272a'}}>{label}</div>
          {desc&&<div className="text-xs mt-0.5" style={{color:'#71717a'}}>{desc}</div>}
        </div>
        <button onClick={()=>onChange(!checked)}
          className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-4"
          style={{background:checked?'#f97316':(isDark?'#3f3f46':'#d4d4d8')}}>
          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked?'translate-x-6':''}`}/>
        </button>
      </div>
      {checked && children && <div className="mt-3">{children}</div>}
    </div>
  )
}

export default function SorteoPage() {
  const [theme, setTheme] = useState<Theme>('dark')
  const isDark = theme === 'dark'
  const [comments, setComments] = useState<Comment[]>([])
  const [rawText, setRawText] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [loadingApi, setLoadingApi] = useState(false)
  const [apiError, setApiError] = useState('')
  const [importMode, setImportMode] = useState<'url'|'paste'|'file'>('url')
  const [filters, setFilters] = useState<Filters>({
    minMentions: 2, requireDistinctMentions: true,
    hashtags: [], keywords: [],
    excludeDuplicates: true, excludeOrganizer: false, organizerUsername: '',
    requireFollow: false, followAccount: '',
    requireLike: false,
  })
  const [phase, setPhase] = useState<Phase>('setup')
  const [validParticipants, setValidParticipants] = useState<Participant[]>([])
  const [invalidParticipants, setInvalidParticipants] = useState<Array<Participant&{reason:string}>>([])
  const [drumName, setDrumName] = useState('')
  const [winner, setWinner] = useState<Participant|null>(null)
  const [usedWinners, setUsedWinners] = useState<string[]>([])
  const [showInvalid, setShowInvalid] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const t = {
    bg: isDark?'#09090b':'#f7f7f8',
    surface: isDark?'#111113':'#ffffff',
    surface2: isDark?'#18181b':'#f0f0f2',
    border: isDark?'#27272a':'#e4e4e7',
    text: isDark?'#fafafa':'#09090b',
    muted: isDark?'#71717a':'#71717a',
    inputBg: isDark?'#18181b':'#f4f4f5',
    inputBorder: isDark?'#3f3f46':'#d4d4d8',
  }
  const inp = { background:t.inputBg, border:`1px solid ${t.inputBorder}`, color:t.text }

  const loadFromApi = useCallback(async () => {
    if (!postUrl.trim()) { setApiError('Introduce la URL del post'); return }
    setLoadingApi(true); setApiError('')
    try {
      const res = await fetch(`/api/comments?url=${encodeURIComponent(postUrl)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')
      setComments(data.comments.map((c:{username:string;text:string;timestamp?:string})=>({...c,username:c.username.toLowerCase()})))
      setPhase('ready'); setApiError('')
    } catch(e:unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar'
      // Friendlier message for token errors
      if (msg.toLowerCase().includes('oauth') || msg.toLowerCase().includes('token') || msg.toLowerCase().includes('access')) {
        setApiError('El token de Instagram no está configurado o ha expirado. Usa "Pegar texto" o "Archivo" para continuar.')
      } else {
        setApiError(msg)
      }
    }
    finally { setLoadingApi(false) }
  }, [postUrl])

  const loadFromPaste = useCallback(() => {
    const p = parseComments(rawText)
    if(!p.length){setGlobalError('No se encontraron comentarios válidos');return}
    setComments(p); setPhase('ready'); setGlobalError('')
  }, [rawText])

  const loadFromFile = useCallback((e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file)return
    const reader = new FileReader()
    reader.onload = ev => {
      const p = parseComments(ev.target?.result as string)
      if(!p.length){setGlobalError('No se encontraron comentarios válidos');return}
      setComments(p); setPhase('ready'); setGlobalError('')
    }
    reader.readAsText(file)
  }, [])

  const runDrum = useCallback((pool:Participant[], excluded:string[]) => {
    const available = pool.filter(p=>!excluded.includes(p.username))
    if(!available.length){setGlobalError('No quedan más participantes disponibles');return}
    setPhase('rolling'); setWinner(null)
    let ticks=0
    const iv = setInterval(()=>{
      setDrumName('@'+available[Math.floor(Math.random()*available.length)].username)
      if(++ticks>=45){
        clearInterval(iv)
        const picked = available[Math.floor(Math.random()*available.length)]
        setWinner(picked); setUsedWinners(prev=>[...prev,picked.username]); setPhase('winner'); launchConfetti()
      }
    },65)
  },[])

  const startSorteo = useCallback(()=>{
    const {valid,invalid}=filterParticipants(comments,filters)
    if(!valid.length){setGlobalError('No hay participantes válidos con los requisitos actuales');return}
    setValidParticipants(valid); setInvalidParticipants(invalid); setUsedWinners([]); setWinner(null); setGlobalError('')
    runDrum(valid,[])
  },[comments,filters,runDrum])

  const reroll = useCallback(()=>{ setPhase('rolling'); setWinner(null); runDrum(validParticipants,usedWinners) },[validParticipants,usedWinners,runDrum])
  const reset = useCallback(()=>{ setComments([]); setRawText(''); setPostUrl(''); setPhase('setup'); setWinner(null); setUsedWinners([]); setValidParticipants([]); setInvalidParticipants([]); setGlobalError('') },[])

  // Build manual verification checklist for winner
  const manualChecks: string[] = []
  if (filters.requireFollow && filters.followAccount) manualChecks.push(`Seguir a @${filters.followAccount.replace(/^@/,'')} en Instagram`)
  if (filters.requireLike) manualChecks.push('Haber dado like a la publicación del sorteo')

  return (
    <div className="min-h-screen transition-colors duration-300" style={{background:t.bg,color:t.text}}>
      <div className="max-w-2xl mx-auto px-5 py-10 pb-36">

        {/* ── HEADER ── */}
        <header className="mb-10">
          <div className="flex items-center justify-end gap-2 mb-4">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:'rgba(249,115,22,0.12)',color:'#f97316',border:'1px solid rgba(249,115,22,0.3)'}}>
              🚧 En desarrollo
            </span>
            <button onClick={()=>setTheme(isDark?'light':'dark')}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all hover:scale-110"
              style={{background:t.surface2,border:`1px solid ${t.border}`}}>
              {isDark?'☀️':'🌙'}
            </button>
          </div>
          <h1 className="font-extrabold leading-none mb-3"
            style={{
              fontSize:'clamp(3rem,11vw,5rem)',letterSpacing:'-3px',
              background:'linear-gradient(135deg,#f97316 0%,#fbbf24 50%,#f97316 100%)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
            }}>
            Sorteazos
          </h1>
          <p className="text-lg font-medium" style={{color:t.muted}}>
            Sorteos de Instagram —{' '}
            <span style={{color:t.text,fontWeight:700}}>gratis, sin registro, sin límites.</span>
          </p>
        </header>

        {/* ── WELCOME CARD ── */}
        <section className="rounded-2xl border mb-6 overflow-hidden" style={{background:t.surface,borderColor:t.border}}>
          <div className="h-1.5" style={{background:'linear-gradient(90deg,#f97316,#fbbf24,#f97316)'}}/>
          <div className="p-7">
            <div className="flex flex-wrap gap-2 mb-5">
              {['✅ 100% Gratuito','🚫 Sin registro','♾️ Sin límites','🔒 Sin almacenamiento'].map(b=>(
                <span key={b} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{background:t.surface2,border:`1px solid ${t.border}`,color:t.text}}>{b}</span>
              ))}
            </div>
            <p className="text-base leading-relaxed mb-6" style={{color:t.muted}}>
              Haz sorteos en Instagram de forma{' '}
              <span style={{color:t.text,fontWeight:600}}>justa y transparente</span>.
              Carga los comentarios, define los requisitos y obtén un ganador al instante.
              Si no cumple las bases, pulsa{' '}
              <span style={{color:'#f97316',fontWeight:700}}>Reroll</span> y listo.
            </p>
            <div className="rounded-xl p-4 mb-6 flex items-center gap-4"
              style={{background:isDark?'rgba(249,115,22,0.08)':'rgba(249,115,22,0.07)',border:'1.5px solid rgba(249,115,22,0.3)'}}>
              <span className="text-4xl flex-shrink-0">☕</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm mb-1" style={{color:t.text}}>¿Te resulta útil? ¡Invítame a un café!</div>
                <div className="text-xs leading-relaxed" style={{color:t.muted}}>
                  Sorteazos es gratuito, pero el dominio tiene un coste. Tu donación ayuda a mantenerlo vivo. ¡Gracias! 🙏
                </div>
              </div>
              <a href="https://paypal.me/juanm95" target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{background:'#0070ba',color:'white',textDecoration:'none',boxShadow:'0 4px 16px rgba(0,112,186,0.4)'}}>
                <svg width="14" height="16" viewBox="0 0 24 28" fill="white"><path d="M19.5 3.5C18.3 1.9 15.9 1 13 1H5.5C4.7 1 4 1.6 3.9 2.4L1 21.6c-.1.6.4 1.2 1 1.2h5l1.3-8.1-.1.4C8.4 14.3 9.1 13.7 9.9 13.7h2c5.4 0 9.6-2.2 10.8-8.5.1-.3.1-.6.1-.9-.3-.3-.3-.5-.3-.8z"/><path d="M19.8 5.7c-.1.5-.3 1-.5 1.5-1.4 7.2-6.3 9.7-12.5 9.7H4.5L3.1 26h4.5c.7 0 1.3-.5 1.4-1.2l.1-.3.9-5.4.1-.3c.1-.7.7-1.2 1.4-1.2h.9c5.7 0 10.1-2.3 11.4-9 .5-2.7.3-5-1-6.9z"/></svg>
                Donar
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-5 pt-5" style={{borderTop:`1px solid ${t.border}`}}>
              <p className="text-xs font-semibold" style={{color:t.muted}}>Una colaboración de:</p>
              {[
                {href:'https://www.instagram.com/jagarcia95',src:'/juan.jpeg',name:'Juan María',handle:'@jagarcia95'},
                {href:'https://www.instagram.com/la_nana_de_nala',src:'/nana.png',name:'La Ñañá de Nala',handle:'@la_nana_de_nala'},
              ].map(c=>(
                <a key={c.handle} href={c.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{border:'2.5px solid #f97316'}}>
                    <Image src={c.src} alt={c.name} width={48} height={48} className="object-cover w-full h-full"/>
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{color:t.text}}>{c.name}</div>
                    <div className="text-xs font-mono" style={{color:'#f97316'}}>{c.handle}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── GLOBAL ERROR ── */}
        {globalError&&(
          <div className="mb-5 px-4 py-3 rounded-xl text-sm border"
            style={{background:'rgba(248,113,113,0.08)',borderColor:'rgba(248,113,113,0.3)',color:'#f87171'}}>
            {globalError}
          </div>
        )}

        {/* ── SETUP / READY ── */}
        {(phase==='setup'||phase==='ready')&&(<>

          {/* Step 1 — Load */}
          <section className="rounded-2xl border p-6 mb-4" style={{background:t.surface,borderColor:t.border}}>
            <div className="text-xs font-bold tracking-widest uppercase mb-5" style={{color:'#f97316'}}>
              01 — Cargar comentarios
            </div>
            <div className="flex gap-1 p-1 rounded-xl mb-5" style={{background:t.surface2}}>
              {(['url','paste','file'] as const).map(m=>(
                <button key={m} onClick={()=>setImportMode(m)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                  style={importMode===m?{background:'#f97316',color:'white'}:{color:t.muted}}>
                  {m==='url'?'🔗 URL del post':m==='paste'?'📋 Pegar texto':'📁 Archivo'}
                </button>
              ))}
            </div>

            {importMode==='url'&&(
              <div>
                <label className="block text-xs font-semibold mb-2" style={{color:t.muted}}>URL del post de Instagram</label>
                <div className="flex gap-2">
                  <input className="flex-1 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-orange-500 transition-colors"
                    style={inp} placeholder="https://www.instagram.com/p/..." value={postUrl}
                    onChange={e=>setPostUrl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadFromApi()}/>
                  <button onClick={loadFromApi} disabled={loadingApi}
                    className="px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                    style={{background:'#f97316',color:'white'}}>
                    {loadingApi?'⏳':'Cargar'}
                  </button>
                </div>
                {apiError&&(
                  <div className="mt-3 p-4 rounded-xl text-sm border"
                    style={{background:'rgba(248,113,113,0.08)',borderColor:'rgba(248,113,113,0.25)',color:'#f87171'}}>
                    ⚠️ {apiError}
                  </div>
                )}
                <p className="text-xs mt-3" style={{color:t.muted}}>
                  Función en desarrollo — requiere token de Instagram Business configurado.
                </p>
              </div>
            )}

            {importMode==='paste'&&(
              <div>
                <label className="block text-xs font-semibold mb-2" style={{color:t.muted}}>Pega los comentarios (uno por línea)</label>
                <textarea className="w-full rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-orange-500 transition-colors resize-y"
                  style={inp} rows={8} placeholder={"@usuario1 Participo! Menciono a @amiga1 y @amiga2\n@usuario2 Me apunto! @pedro @maria"}
                  value={rawText} onChange={e=>setRawText(e.target.value)}/>
                <p className="text-xs mt-1.5" style={{color:t.muted}}>Cada línea = un comentario. El primer @usuario es el participante.</p>
                <button onClick={loadFromPaste} className="mt-3 w-full py-3 rounded-xl text-sm font-bold"
                  style={{background:'#f97316',color:'white'}}>Cargar comentarios</button>
              </div>
            )}

            {importMode==='file'&&(
              <div>
                <input ref={fileRef} type="file" accept=".txt,.csv" className="hidden" onChange={loadFromFile}/>
                <button onClick={()=>fileRef.current?.click()}
                  className="w-full py-10 rounded-2xl border-2 border-dashed text-sm transition-colors"
                  style={{borderColor:t.border,color:t.muted}}>
                  <div className="text-4xl mb-3">📁</div>
                  <div className="font-bold text-base">Haz clic para seleccionar un archivo</div>
                  <div className="text-xs mt-1.5 opacity-60">TXT o CSV — un comentario por línea</div>
                </button>
              </div>
            )}

            {comments.length>0&&(
              <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.2)',color:'#4ade80'}}>
                ✓ <strong>{comments.length} comentarios cargados</strong>
                <button onClick={()=>{setComments([]);setPhase('setup')}} className="ml-auto text-xs opacity-60 hover:opacity-100">× borrar</button>
              </div>
            )}
          </section>

          {/* Step 2 — Filters */}
          <section className="rounded-2xl border mb-5 overflow-hidden" style={{background:t.surface,borderColor:t.border}}>
            <button onClick={()=>setShowFilters(v=>!v)}
              className="w-full px-6 py-5 flex items-center justify-between transition-colors"
              style={{color:t.text}}>
              <div className="text-xs font-bold tracking-widest uppercase" style={{color:'#f97316'}}>
                02 — Requisitos del sorteo
              </div>
              <span style={{color:t.muted}}>{showFilters?'▲':'▼'}</span>
            </button>
            {showFilters&&(
              <div className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{color:t.muted}}>Mínimo de menciones</label>
                    <input type="number" min={0} max={10}
                      className="w-full rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none"
                      style={inp} value={filters.minMentions}
                      onChange={e=>setFilters(f=>({...f,minMentions:+e.target.value}))}/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{color:t.muted}}>Tu usuario (para excluirte)</label>
                    <input type="text" className="w-full rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none"
                      style={inp} value={filters.organizerUsername} placeholder="sin @, opcional"
                      onChange={e=>setFilters(f=>({...f,organizerUsername:e.target.value}))}/>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold mb-1.5" style={{color:t.muted}}>Hashtags requeridos <span className="opacity-50">(Enter)</span></label>
                  <TagInput tags={filters.hashtags} theme={theme} prefix="#" placeholder="sorteazos"
                    onAdd={tag=>setFilters(f=>({...f,hashtags:[...f.hashtags,tag]}))}
                    onRemove={i=>setFilters(f=>({...f,hashtags:f.hashtags.filter((_,j)=>j!==i)}))}/>
                </div>
                <div className="mb-5">
                  <label className="block text-xs font-semibold mb-1.5" style={{color:t.muted}}>Palabras clave requeridas <span className="opacity-50">(Enter)</span></label>
                  <TagInput tags={filters.keywords} theme={theme} placeholder="quiero ganar"
                    onAdd={k=>setFilters(f=>({...f,keywords:[...f.keywords,k]}))}
                    onRemove={i=>setFilters(f=>({...f,keywords:f.keywords.filter((_,j)=>j!==i)}))}/>
                </div>

                <Toggle theme={theme} checked={filters.excludeDuplicates} onChange={v=>setFilters(f=>({...f,excludeDuplicates:v}))}
                  label="Excluir duplicados" desc="Un usuario con varios comentarios solo cuenta una vez"/>
                <Toggle theme={theme} checked={filters.excludeOrganizer} onChange={v=>setFilters(f=>({...f,excludeOrganizer:v}))}
                  label="Excluir al organizador" desc="Tu usuario no puede resultar ganador"/>
                <Toggle theme={theme} checked={filters.requireDistinctMentions} onChange={v=>setFilters(f=>({...f,requireDistinctMentions:v}))}
                  label="Menciones a usuarios distintos" desc="No vale mencionar al mismo usuario dos veces"/>

                {/* Manual-check requirements */}
                <Toggle theme={theme} checked={filters.requireFollow} onChange={v=>setFilters(f=>({...f,requireFollow:v}))}
                  label="Seguir una cuenta" desc="Se avisará al verificar el ganador — no es verificable por API">
                  <input type="text" className="w-full rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none"
                    style={inp} placeholder="cuenta a seguir (sin @)"
                    value={filters.followAccount}
                    onChange={e=>setFilters(f=>({...f,followAccount:e.target.value}))}/>
                </Toggle>

                <Toggle theme={theme} checked={filters.requireLike} onChange={v=>setFilters(f=>({...f,requireLike:v}))}
                  label="Dar like a la publicación" desc="Se avisará al verificar el ganador — no es verificable por API"/>

                {/* Info note about manual checks */}
                {(filters.requireFollow||filters.requireLike)&&(
                  <div className="mt-4 px-4 py-3 rounded-xl text-xs"
                    style={{background:isDark?'rgba(251,191,36,0.07)':'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.3)',color:'#fbbf24'}}>
                    ℹ️ <strong>Verificación manual:</strong> Instagram no permite comprobar follows ni likes por API. Estos requisitos aparecerán como checklist al mostrar el ganador para que los verifiques tú manualmente antes de entregar el premio.
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Sortear */}
          {comments.length>0&&(
            <button onClick={startSorteo}
              className="w-full py-6 rounded-2xl text-xl font-extrabold tracking-tight transition-all hover:-translate-y-1"
              style={{background:'linear-gradient(135deg,#f97316,#fbbf24)',color:'white',boxShadow:'0 6px 30px rgba(249,115,22,0.4)',letterSpacing:'-0.5px'}}>
              🎲 REALIZAR SORTEO
            </button>
          )}
        </>)}

        {/* ── ROLLING ── */}
        {phase==='rolling'&&(
          <div className="rounded-2xl border p-14 text-center" style={{background:t.surface,borderColor:t.border}}>
            <div className="text-5xl mb-5">🎰</div>
            <div className="animate-drum text-5xl font-extrabold font-mono" style={{color:'#fbbf24',letterSpacing:'-2px'}}>
              {drumName}
            </div>
            <div className="text-sm uppercase tracking-widest mt-5" style={{color:t.muted}}>
              ✨ sorteando entre {validParticipants.length} participantes...
            </div>
          </div>
        )}

        {/* ── WINNER ── */}
        {phase==='winner'&&winner&&(<>
          <div className="rounded-2xl border-2 p-10 text-center mb-5 relative overflow-hidden"
            style={{background:t.surface,borderColor:'#f97316'}}>
            <div className="absolute inset-0 pointer-events-none"
              style={{background:'radial-gradient(ellipse at 50% 0%,rgba(249,115,22,0.1) 0%,transparent 65%)'}}/>
            <div className="text-6xl mb-4">🏆</div>
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#f97316'}}>Ganador/a del sorteo</div>
            <div className="font-extrabold mb-3" style={{fontSize:'clamp(2rem,8vw,3rem)',color:'#fbbf24',letterSpacing:'-1.5px'}}>
              @{winner.username}
            </div>
            <div className="font-mono text-sm mx-auto max-w-sm italic mb-6" style={{color:t.muted}}>
              &ldquo;{winner.comment.text.substring(0,120)}{winner.comment.text.length>120?'…':''}&rdquo;
            </div>

            {/* Verification checklist */}
            <div className="rounded-xl px-5 py-4 text-left mb-5"
              style={{background:'rgba(249,115,22,0.08)',border:'1px solid rgba(249,115,22,0.25)'}}>
              <strong className="block mb-3" style={{color:'#fb923c'}}>✅ Antes de entregar el premio, verifica:</strong>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm" style={{color:t.muted}}>
                  <span className="mt-0.5 flex-shrink-0">📸</span>
                  <span>Que compartió el post en sus Stories (pide captura si la cuenta es privada)</span>
                </div>
                {filters.requireFollow && filters.followAccount && (
                  <div className="flex items-start gap-2 text-sm" style={{color:t.muted}}>
                    <span className="mt-0.5 flex-shrink-0">👤</span>
                    <span>Que sigue a <strong style={{color:t.text}}>@{filters.followAccount.replace(/^@/,'')}</strong> (pide captura de la lista de seguidos)</span>
                  </div>
                )}
                {filters.requireLike && (
                  <div className="flex items-start gap-2 text-sm" style={{color:t.muted}}>
                    <span className="mt-0.5 flex-shrink-0">❤️</span>
                    <span>Que dio like a la publicación del sorteo (pide captura de la publicación con su like)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-6 text-sm" style={{color:t.muted}}>
              <span>✅ {validParticipants.length} válidos</span>
              <span>🚫 {invalidParticipants.length} excluidos</span>
              {usedWinners.length>1&&<span>🔄 Reroll #{usedWinners.length}</span>}
            </div>
          </div>

          <div className="flex gap-3 mb-5">
            <button onClick={reroll}
              className="flex-1 py-4 rounded-2xl text-sm font-bold border transition-all hover:border-orange-500"
              style={{background:t.surface,borderColor:t.border,color:t.muted}}>
              🔄 Reroll — nuevo ganador
            </button>
            <button onClick={reset}
              className="flex-1 py-4 rounded-2xl text-sm font-bold border transition-all hover:border-orange-500"
              style={{background:t.surface,borderColor:t.border,color:t.muted}}>
              ↺ Nuevo sorteo
            </button>
          </div>

          {invalidParticipants.length>0&&(
            <div className="rounded-2xl border overflow-hidden" style={{background:t.surface,borderColor:t.border}}>
              <button onClick={()=>setShowInvalid(v=>!v)}
                className="w-full px-5 py-4 flex items-center justify-between text-sm" style={{color:t.muted}}>
                <span>Ver {invalidParticipants.length} comentarios excluidos</span>
                <span>{showInvalid?'▲':'▼'}</span>
              </button>
              {showInvalid&&(
                <div className="max-h-52 overflow-y-auto px-5 pb-4">
                  {invalidParticipants.map((p,i)=>(
                    <div key={i} className="flex gap-3 py-2 border-b font-mono text-xs last:border-0" style={{borderColor:t.border}}>
                      <span style={{color:'#f87171',flexShrink:0}}>[{p.reason}]</span>
                      <span style={{color:t.muted}}>@{p.username}: {p.comment.text.substring(0,50)}…</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>)}

        {/* ── TERMS ── */}
        <div className="mt-8">
          <button onClick={()=>setShowTerms(v=>!v)} className="text-xs underline underline-offset-2" style={{color:t.muted}}>
            {showTerms?'▲ Ocultar':'▼ Ver'} términos y condiciones
          </button>
          {showTerms&&(
            <div className="mt-3 rounded-2xl border p-6 text-xs leading-relaxed"
              style={{background:t.surface,borderColor:t.border,color:t.muted}}>
              <strong className="block mb-3 text-sm" style={{color:t.text}}>Términos y condiciones de uso</strong>
              <p className="mb-2"><strong>1. Naturaleza del servicio.</strong> Sorteazos es una herramienta gratuita de selección aleatoria. No está afiliada ni patrocinada por Instagram o Meta.</p>
              <p className="mb-2"><strong>2. Aleatoriedad.</strong> El ganador se selecciona de forma completamente aleatoria entre los participantes que cumplen los requisitos definidos por el organizador.</p>
              <p className="mb-2"><strong>3. Responsabilidad.</strong> Sorteazos no verifica la identidad de los participantes ni la veracidad de los comentarios. La responsabilidad de validar el cumplimiento de las bases recae íntegramente en el organizador.</p>
              <p className="mb-2"><strong>4. Privacidad.</strong> Sorteazos no almacena ningún dato personal. Los comentarios se procesan únicamente en el navegador del usuario.</p>
              <p><strong>5. Uso.</strong> El uso de esta herramienta implica la aceptación de estos términos. El servicio puede interrumpirse o modificarse en cualquier momento sin previo aviso.</p>
            </div>
          )}
        </div>

      </div>

      {/* ── FOOTER BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: isDark?'rgba(9,9,11,0.97)':'rgba(255,255,255,0.97)',
          backdropFilter:'blur(16px)',
          borderTop:`1px solid ${t.border}`,
        }}>
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          {/* Profiles */}
          <div className="flex items-center gap-4">
            {[
              {href:'https://www.instagram.com/jagarcia95',src:'/juan.jpeg',handle:'@jagarcia95'},
              {href:'https://www.instagram.com/la_nana_de_nala',src:'/nana.png',handle:'@la_nana_de_nala'},
            ].map(c=>(
              <a key={c.handle} href={c.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0" style={{border:'1.5px solid #f97316'}}>
                  <Image src={c.src} alt={c.handle} width={28} height={28} className="object-cover w-full h-full"/>
                </div>
                <span className="text-xs font-mono hidden sm:block" style={{color:'#f97316'}}>{c.handle}</span>
              </a>
            ))}
          </div>
          {/* Copyright */}
          <p className="text-xs text-center" style={{color:t.muted}}>
            © {new Date().getFullYear()} Sorteazos · MIT License
          </p>
        </div>
      </div>
    </div>
  )
}
