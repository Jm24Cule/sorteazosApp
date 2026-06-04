'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

/* ─── Types ─────────────────────────────────────────────── */
interface Comment { username: string; text: string; timestamp?: string }
interface Filters {
  minMentions: number; requireDistinctMentions: boolean
  hashtags: string[]; keywords: string[]
  excludeDuplicates: boolean; excludeOrganizer: boolean; organizerUsername: string
  requireFollow: boolean; followAccount: string
  requireLike: boolean
}
interface Participant { username: string; comment: Comment }
interface IGProfile { username: string; name: string; avatar: string }
type Phase = 'welcome' | 'setup' | 'rolling' | 'winner'
type Theme = 'dark' | 'light'

/* ─── Mock data ──────────────────────────────────────────── */
const MOCK_PROFILE: IGProfile = {
  username: 'la_nana_de_nala',
  name: 'La Ñañá de Nala',
  avatar: '/nana.png',
}

const MOCK_COMMENTS: Comment[] = [
  { username: 'maria_garcia', text: '¡Participo! Menciono a @laura_perez y @ana_martin 😍 #sorteazos' },
  { username: 'carlos_ruiz', text: 'Me apunto! @pedro_sanchez y @jose_lopez quiero ganar' },
  { username: 'lucia_fernandez', text: '@sofia_gomez @elena_diaz participamos juntas! ❤️' },
  { username: 'david_moreno', text: 'Quiero ganar! @marta_jimenez @pablo_hernandez' },
  { username: 'sara_lopez', text: '@carmen_torres y @pilar_ramirez os menciono para participar!' },
  { username: 'miguel_gonzalez', text: 'Participooo @rosa_martinez @jorge_alvarez 🎉' },
  { username: 'isabel_romero', text: '@beatriz_navarro @cristina_molina me gustaría ganar!' },
  { username: 'antonio_gutierrez', text: 'A ver si hay suerte @francisco_ramos @teresa_iglesias' },
  { username: 'raquel_santos', text: '@victoria_castillo @alicia_ortega participamos!' },
  { username: 'pablo_vargas', text: 'Menciono a @roberto_morales solo él 🙈' }, // will be excluded (1 mention)
  { username: 'maria_garcia', text: 'Doble comentario de maria, debe ser excluido' }, // duplicate
  { username: 'nuria_campos', text: '@diego_reyes @adriana_vega apuntadas!' },
  { username: 'fernando_rueda', text: '@monica_sierra @rafael_cano vamos a ver!' },
  { username: 'patricia_vidal', text: '@alejandro_mora @silvia_delgado participamos 🌟' },
]

/* ─── Helpers ────────────────────────────────────────────── */
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
  for (let i = 0; i < 100; i++) {
    const d = document.createElement('div')
    const size = 6 + Math.random() * 10
    d.style.cssText = `position:fixed;width:${size}px;height:${size}px;border-radius:${Math.random()>.5?'50%':'2px'};background:${colors[Math.floor(Math.random()*colors.length)]};left:${Math.random()*100}vw;top:-10px;z-index:9999;animation:fall ${1.8+Math.random()*2}s linear ${Math.random()*.8}s forwards;`
    document.body.appendChild(d)
    setTimeout(() => d.remove(), 5000)
  }
}

/* ─── Sub-components ─────────────────────────────────────── */
function TagInput({ tags, onAdd, onRemove, placeholder, prefix='', theme }: {
  tags: string[]; onAdd:(t:string)=>void; onRemove:(i:number)=>void
  placeholder:string; prefix?:string; theme:Theme
}) {
  const [val, setVal] = useState('')
  const isDark = theme === 'dark'
  return (
    <div>
      <input
        className="w-full rounded-xl px-4 py-3 text-sm font-mono focus:outline-none transition-colors"
        style={{ background:isDark?'#18181b':'#f4f4f5', border:`1px solid ${isDark?'#3f3f46':'#d4d4d8'}`, color:isDark?'#fafafa':'#18181b' }}
        value={val} onChange={e=>setVal(e.target.value)} placeholder={placeholder}
        onKeyDown={e=>{
          if(e.key==='Enter'){
            e.preventDefault()
            const c=val.trim().replace(/^[#@]/,'').toLowerCase()
            if(c&&!tags.includes(c))onAdd(c)
            setVal('')
          }
        }}
      />
      {tags.length>0&&(
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag,i)=>(
            <span key={tag} className="flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-mono"
              style={{background:isDark?'#27272a':'#e4e4e7',border:`1px solid ${isDark?'#3f3f46':'#d4d4d8'}`,color:'#f97316'}}>
              {prefix}{tag}
              <button onClick={()=>onRemove(i)} className="ml-1" style={{color:isDark?'#71717a':'#a1a1aa'}}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Toggle({ checked, onChange, label, desc, theme, children }: {
  checked:boolean; onChange:(v:boolean)=>void; label:string; desc?:string; theme:Theme; children?:React.ReactNode
}) {
  const isDark = theme === 'dark'
  return (
    <div className="py-4 border-b last:border-0" style={{borderColor:isDark?'#27272a':'#e4e4e7'}}>
      <div className="flex items-center justify-between">
        <div className="pr-4">
          <div className="text-sm font-semibold" style={{color:isDark?'#e4e4e7':'#27272a'}}>{label}</div>
          {desc&&<div className="text-xs mt-0.5" style={{color:'#71717a'}}>{desc}</div>}
        </div>
        <button onClick={()=>onChange(!checked)}
          className="relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0"
          style={{background:checked?'#f97316':(isDark?'#3f3f46':'#d4d4d8')}}>
          <span className={`absolute top-1.5 left-1.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked?'translate-x-5':''}`}/>
        </button>
      </div>
      {checked&&children&&<div className="mt-3">{children}</div>}
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */
export default function SorteoPage() {
  const [theme, setTheme] = useState<Theme>('dark')
  const isDark = theme === 'dark'

  const [phase, setPhase] = useState<Phase>('welcome')
  const [profile, setProfile] = useState<IGProfile | null>(null)
  const [connecting, setConnecting] = useState(false)

  const [comments, setComments] = useState<Comment[]>([])
  const [rawText, setRawText] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [loadingApi, setLoadingApi] = useState(false)
  const [apiError, setApiError] = useState('')
  const [importMode, setImportMode] = useState<'url'|'paste'|'file'>('url')

  const [filters, setFilters] = useState<Filters>({
    minMentions:2, requireDistinctMentions:true,
    hashtags:[], keywords:[],
    excludeDuplicates:true, excludeOrganizer:false, organizerUsername:'',
    requireFollow:false, followAccount:'',
    requireLike:false,
  })

  const [sorteoPhase, setSorteoPhase] = useState<'idle'|'rolling'|'winner'>('idle')
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
    bg: isDark?'#1c1c1e':'#f7f7f8',
    surface: isDark?'#111113':'#ffffff',
    surface2: isDark?'#18181b':'#f0f0f2',
    border: isDark?'#27272a':'#e4e4e7',
    text: isDark?'#fafafa':'#09090b',
    muted: isDark?'#71717a':'#71717a',
    inputBg: isDark?'#18181b':'#f4f4f5',
    inputBorder: isDark?'#3f3f46':'#d4d4d8',
    // Accent palette: dark=orange/gold, light=purple/teal
    accent: isDark?'#f97316':'#7c3aed',
    accent2: isDark?'#fb923c':'#6d28d9',
    gold: isDark?'#fbbf24':'#0891b2',
    gradStart: isDark?'#f97316':'#7c3aed',
    gradEnd: isDark?'#fbbf24':'#0891b2',
    grad: isDark
      ? 'linear-gradient(135deg,#f97316 0%,#fbbf24 50%,#f97316 100%)'
      : 'linear-gradient(135deg,#7c3aed 0%,#0891b2 50%,#7c3aed 100%)',
    donateGlow: isDark?'rgba(249,115,22,0.4)':'rgba(124,58,237,0.4)',
    accentBg: isDark?'rgba(249,115,22,0.08)':'rgba(124,58,237,0.07)',
    accentBorder: isDark?'rgba(249,115,22,0.3)':'rgba(124,58,237,0.3)',
    winnerColor: isDark?'#fbbf24':'#0891b2',
  }
  const inp = { background:t.inputBg, border:`1px solid ${t.inputBorder}`, color:t.text }

  /* ── Simulate Instagram connect ── */
  const connectInstagram = useCallback(() => {
    setConnecting(true)
    setTimeout(() => {
      setProfile(MOCK_PROFILE)
      setComments(MOCK_COMMENTS)
      setConnecting(false)
      setPhase('setup')
    }, 1800)
  }, [])

  const disconnect = useCallback(() => {
    setProfile(null)
    setComments([])
    setPhase('welcome')
    setSorteoPhase('idle')
    setWinner(null)
    setUsedWinners([])
    setGlobalError('')
  }, [])

  /* ── Load comments ── */
  const loadFromApi = useCallback(async () => {
    if (!postUrl.trim()) { setApiError('Introduce la URL del post'); return }
    setLoadingApi(true); setApiError('')
    try {
      const res = await fetch(`/api/comments?url=${encodeURIComponent(postUrl)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')
      setComments(data.comments.map((c:{username:string;text:string;timestamp?:string})=>({...c,username:c.username.toLowerCase()})))
      setApiError('')
    } catch(e:unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar'
      if (msg.toLowerCase().includes('oauth')||msg.toLowerCase().includes('token')||msg.toLowerCase().includes('access')) {
        setApiError('Token no configurado o expirado. Usa "Pegar texto" o "Archivo".')
      } else { setApiError(msg) }
    }
    finally { setLoadingApi(false) }
  }, [postUrl])

  const loadFromPaste = useCallback(() => {
    const p = parseComments(rawText)
    if(!p.length){setGlobalError('No se encontraron comentarios válidos');return}
    setComments(p); setGlobalError('')
  }, [rawText])

  const loadFromFile = useCallback((e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file)return
    const reader = new FileReader()
    reader.onload = ev => {
      const p = parseComments(ev.target?.result as string)
      if(!p.length){setGlobalError('No se encontraron comentarios válidos');return}
      setComments(p); setGlobalError('')
    }
    reader.readAsText(file)
  }, [])

  /* ── Sorteo ── */
  const runDrum = useCallback((pool:Participant[], excluded:string[]) => {
    const available = pool.filter(p=>!excluded.includes(p.username))
    if(!available.length){setGlobalError('No quedan más participantes disponibles');return}
    setSorteoPhase('rolling'); setWinner(null)
    let ticks=0
    const iv = setInterval(()=>{
      setDrumName('@'+available[Math.floor(Math.random()*available.length)].username)
      if(++ticks>=50){
        clearInterval(iv)
        const picked = available[Math.floor(Math.random()*available.length)]
        setWinner(picked)
        setUsedWinners(prev=>[...prev,picked.username])
        setSorteoPhase('winner')
        launchConfetti()
      }
    },60)
  },[])

  const startSorteo = useCallback(()=>{
    const {valid,invalid}=filterParticipants(comments,filters)
    if(!valid.length){setGlobalError('No hay participantes válidos con los requisitos actuales');return}
    setValidParticipants(valid); setInvalidParticipants(invalid)
    setUsedWinners([]); setWinner(null); setGlobalError('')
    runDrum(valid,[])
  },[comments,filters,runDrum])

  const reroll = useCallback(()=>{
    setSorteoPhase('rolling'); setWinner(null)
    runDrum(validParticipants,usedWinners)
  },[validParticipants,usedWinners,runDrum])

  const resetSorteo = useCallback(()=>{
    setSorteoPhase('idle'); setWinner(null)
    setUsedWinners([]); setValidParticipants([]); setInvalidParticipants([])
    setGlobalError('')
  },[])

  /* ─── RENDER ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen transition-colors duration-300" style={{background:t.bg,color:t.text}}>



      <div className="max-w-2xl mx-auto px-5 py-8 pb-32">

        {/* ══════════════════════════════════════════════ */}
        {/* PANTALLA 1 — BIENVENIDA                       */}
        {/* ══════════════════════════════════════════════ */}
        {phase==='welcome'&&(
          <div style={{animation:'slideUp 0.4s ease forwards'}}>

            {/* Hero */}
            <div className="text-center mb-10 pt-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <img src="/logo.svg" alt="Sorteazos" className="w-16 h-16 sm:w-20 sm:h-20"/>
                <h2 className="font-extrabold leading-none"
                  key={theme} style={{fontFamily:"'Outfit', sans-serif",fontSize:'clamp(2.8rem,12vw,5rem)',letterSpacing:'-3px',background:t.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                  Sorteazos
                </h2>
              </div>
              <p className="text-lg" style={{color:t.muted}}>
                Sorteos de Instagram —{' '}
                <span style={{color:t.text,fontWeight:700}}>gratis, sin registro, sin límites.</span>
              </p>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {['✅ 100% Gratuito','🚫 Sin registro','♾️ Sin límites','🔒 Sin almacenamiento'].map(b=>(
                <span key={b} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{background:t.surface2,border:`1px solid ${t.border}`,color:t.text}}>{b}</span>
              ))}
            </div>

            {/* Info card */}
            <div className="rounded-2xl border p-6 mb-6" style={{background:t.surface,borderColor:t.border}}>
              <p className="text-base leading-relaxed mb-5" style={{color:t.muted}}>
                Crea sorteos en Instagram de forma <span style={{color:t.text,fontWeight:600}}>justa y transparente</span>. Filtra participantes por menciones, hashtags y más. Si el ganador no cumple las bases, haz <span style={{color:'#f97316',fontWeight:700}}>Reroll</span> al instante.
              </p>
              {/* Donation */}
              <div className="rounded-xl p-4 flex items-center gap-4"
                style={{background:t.accentBg,border:`1.5px solid ${t.accentBorder}`}}>
                <span className="text-3xl flex-shrink-0">☕</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm mb-0.5" style={{color:t.text}}>¿Te resulta útil? ¡Invítame a un café!</div>
                  <div className="text-xs" style={{color:t.muted}}>Tu donación ayuda a mantener el dominio activo. ¡Gracias! 🙏</div>
                </div>
                <a href="https://paypal.me/juanm95" target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                  style={{background:'#0070ba',color:'white',textDecoration:'none',boxShadow:'0 4px 14px rgba(0,112,186,0.35)'}}>
                  Donar 🤍
                </a>
              </div>
            </div>

            {/* Connect button */}
            <button onClick={connectInstagram} disabled={connecting}
              className="w-full py-5 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all hover:-translate-y-1 disabled:opacity-70 disabled:translate-y-0"
              style={{background:t.grad,color:'white',boxShadow:`0 6px 30px ${t.donateGlow}`,letterSpacing:'-0.3px'}}>
              {connecting?(
                <>
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10"/>
                  </svg>
                  Conectando...
                </>
              ):(
                <>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Conectar con Instagram
                </>
              )}
            </button>
            <p className="text-center text-xs mt-6 px-4" style={{color:t.muted}}>
              Necesario para recuperar los comentarios de tu publicación automáticamente
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* PANTALLA 2 — SETUP + SORTEO                   */}
        {/* ══════════════════════════════════════════════ */}
        {phase==='setup'&&(
          <div style={{animation:'slideUp 0.4s ease forwards'}}>

            {/* Subtitle */}
            <div className="flex items-start justify-between mb-6 pt-4">
              <h1 className="font-extrabold leading-none"
                key={theme} style={{fontSize:'clamp(2.8rem,11vw,4.5rem)',letterSpacing:'-3px',background:t.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                Sorteazos
              </h1>
              <button onClick={disconnect} className="mt-2 text-xs px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0"
                style={{borderColor:t.border,color:t.muted}}>
                Desconectar
              </button>
            </div>

            {/* Profile card */}
            {profile&&(
              <div className="rounded-2xl border p-4 mb-6 flex items-center gap-4"
                style={{background:t.surface,borderColor:t.border}}>
                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0" style={{border:`2.5px solid ${t.accent}`}}>
                  <Image src={profile.avatar} alt={profile.name} width={56} height={56} className="object-cover w-full h-full"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base" style={{color:t.text}}>{profile.name}</div>
                  <div className="text-sm font-mono" style={{color:t.accent}}>@{profile.username}</div>
                  <div className="text-xs mt-0.5" style={{color:t.muted}}>Cuenta conectada ✓</div>
                </div>
                {comments.length>0&&(
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-lg" style={{color:isDark?'#4ade80':t.accent}}>{comments.length}</div>
                    <div className="text-xs" style={{color:t.muted}}>comentarios</div>
                  </div>
                )}
              </div>
            )}

            {/* Global error */}
            {globalError&&(
              <div className="mb-5 px-4 py-3 rounded-xl text-sm border"
                style={{background:'rgba(248,113,113,0.08)',borderColor:'rgba(248,113,113,0.3)',color:'#f87171'}}>
                ⚠️ {globalError}
              </div>
            )}

            {/* ── LOAD COMMENTS ── */}
            {sorteoPhase==='idle'&&(
              <>
                <section className="rounded-2xl border p-5 mb-4" style={{background:t.surface,borderColor:t.border}}>
                  <label className="block text-xs font-semibold mb-3" style={{color:t.muted}}>🔗 URL DEL POST CON EL SORTEO</label>
                  <div className="flex gap-2">
                    <input className="flex-1 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none transition-colors"
                      style={inp} placeholder="https://www.instagram.com/p/..." value={postUrl}
                      onChange={e=>setPostUrl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadFromApi()}/>
                    <button onClick={loadFromApi} disabled={loadingApi}
                      className="px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex-shrink-0"
                      style={{background:t.accent,color:'white'}}>
                      {loadingApi?'⏳':'Cargar'}
                    </button>
                  </div>
                  {apiError&&(
                    <div className="mt-3 p-3 rounded-xl text-sm border"
                      style={{background:'rgba(248,113,113,0.08)',borderColor:'rgba(248,113,113,0.25)',color:'#f87171'}}>
                      ⚠️ {apiError}
                    </div>
                  )}
                  {comments.length>0&&(
                    <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                      style={{
                        background: isDark ? 'rgba(74,222,128,0.08)' : `${t.accentBg}`,
                        border: isDark ? '1px solid rgba(74,222,128,0.2)' : `1px solid ${t.accentBorder}`,
                        color: isDark ? '#4ade80' : t.accent,
                      }}>
                      ✓ <strong>{comments.length} comentarios listos</strong>
                      <button onClick={()=>setComments([])} className="ml-auto text-xs opacity-60 hover:opacity-100">× borrar</button>
                    </div>
                  )}
                </section>

                {/* ── FILTERS ── */}
                <section className="rounded-2xl border mb-5 overflow-hidden" style={{background:t.surface,borderColor:t.border}}>
                  <button onClick={()=>setShowFilters(v=>!v)}
                    className="w-full px-5 py-4 flex items-center justify-between transition-colors"
                    style={{color:t.text}}>
                    <span className="text-sm font-bold" style={{color:t.accent}}>⚙️ Requisitos del sorteo</span>
                    <span style={{color:t.muted,fontSize:12}}>{showFilters?'▲':'▼'}</span>
                  </button>
                  {showFilters&&(
                    <div className="px-5 pb-5">
                      <div className="mb-5">
                        <label className="block text-xs font-semibold mb-1.5" style={{color:t.muted}}>Mínimo de menciones requeridas</label>
                        <input type="number" min={0} max={10}
                          className="w-full rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none"
                          style={inp} value={filters.minMentions}
                          onChange={e=>setFilters(f=>({...f,minMentions:+e.target.value}))}/>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs font-semibold mb-1.5" style={{color:t.muted}}>Hashtags requeridos <span className="opacity-50">(Enter)</span></label>
                        <TagInput tags={filters.hashtags} theme={theme} prefix="#" placeholder="sorteazos"
                          onAdd={tag=>setFilters(f=>({...f,hashtags:[...f.hashtags,tag]}))}
                          onRemove={i=>setFilters(f=>({...f,hashtags:f.hashtags.filter((_,j)=>j!==i)}))}/>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs font-semibold mb-1.5" style={{color:t.muted}}>Palabras clave <span className="opacity-50">(Enter)</span></label>
                        <TagInput tags={filters.keywords} theme={theme} placeholder="quiero ganar"
                          onAdd={k=>setFilters(f=>({...f,keywords:[...f.keywords,k]}))}
                          onRemove={i=>setFilters(f=>({...f,keywords:f.keywords.filter((_,j)=>j!==i)}))}/>
                      </div>
                      <Toggle theme={theme} checked={filters.excludeDuplicates} onChange={v=>setFilters(f=>({...f,excludeDuplicates:v}))}
                        label="Excluir duplicados" desc="Solo cuenta el primer comentario por usuario"/>

                      <Toggle theme={theme} checked={filters.requireDistinctMentions} onChange={v=>setFilters(f=>({...f,requireDistinctMentions:v}))}
                        label="Menciones distintas" desc="No vale mencionar al mismo usuario dos veces"/>
                      <Toggle theme={theme} checked={filters.requireFollow} onChange={v=>setFilters(f=>({...f,requireFollow:v}))}
                        label="Seguir una cuenta" desc="Verificación manual al mostrar ganador">
                        <input type="text" className="w-full rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none"
                          style={inp} placeholder="cuenta a seguir (sin @)" value={filters.followAccount}
                          onChange={e=>setFilters(f=>({...f,followAccount:e.target.value}))}/>
                      </Toggle>
                      <Toggle theme={theme} checked={filters.requireLike} onChange={v=>setFilters(f=>({...f,requireLike:v}))}
                        label="Dar like a la publicación" desc="Verificación manual al mostrar ganador"/>
                      {(filters.requireFollow||filters.requireLike)&&(
                        <div className="mt-3 px-4 py-3 rounded-xl text-xs"
                          style={{background:isDark?'rgba(251,191,36,0.07)':'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.3)',color:'#fbbf24'}}>
                          ℹ️ Instagram no permite verificar follows ni likes por API. Aparecerán como checklist al mostrar el ganador.
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Sortear button */}
                {comments.length>0&&(
                  <button onClick={startSorteo}
                    className="w-full py-6 rounded-2xl text-xl font-extrabold tracking-tight transition-all hover:-translate-y-1 active:translate-y-0"
                    style={{background:t.grad,color:'white',boxShadow:`0 6px 30px ${t.donateGlow}`,letterSpacing:'-0.5px'}}>
                    🎲 REALIZAR SORTEO
                  </button>
                )}
              </>
            )}

            {/* ── ROLLING ── */}
            {sorteoPhase==='rolling'&&(
              <div className="rounded-2xl border p-12 text-center" style={{background:t.surface,borderColor:t.accent,animation:'slideUp 0.3s ease'}}>
                <div className="text-5xl mb-6">🎰</div>
                <div className="animate-drum w-full px-4 overflow-hidden" style={{
                  color:t.winnerColor,
                  fontFamily:'"Space Grotesk", sans-serif',
                  fontSize:'clamp(1.5rem, 7vw, 3.5rem)',
                  letterSpacing:'-1px',
                  whiteSpace:'nowrap',
                  textOverflow:'ellipsis',
                  textAlign:'center',
                  maxWidth:'100%',
                }}>
                  {drumName}
                </div>
                <div className="text-sm uppercase tracking-widest mt-5" style={{color:t.muted}}>
                  ✨ sorteando entre {validParticipants.length} participantes...
                </div>
              </div>
            )}

            {/* ── WINNER ── */}
            {sorteoPhase==='winner'&&winner&&(
              <>
                <div className="rounded-2xl border-2 p-8 text-center mb-5 relative overflow-hidden"
                  style={{background:t.surface,borderColor:t.accent,animation:'winnerReveal 0.6s cubic-bezier(0.34,1.56,0.64,1)'}}>
                  <div className="absolute inset-0 pointer-events-none"
                    style={{background:'radial-gradient(ellipse at 50% 0%,rgba(249,115,22,0.1) 0%,transparent 65%)'}}/>
                  <div className="text-6xl mb-4">🏆</div>
                  <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{color:t.accent}}>Ganador/a</div>
                  <div className="w-full px-4 overflow-hidden" style={{
                    color:t.winnerColor,
                    fontFamily:'"Space Grotesk", sans-serif',
                    fontWeight: 400,
                    fontSize:'clamp(1.8rem, 7vw, 3.2rem)',
                    letterSpacing:'-0.5px',
                    whiteSpace:'nowrap',
                    textOverflow:'ellipsis',
                    textAlign:'center',
                    maxWidth:'100%',
                    marginBottom:'0.75rem',
                    animation:'winnerBounce 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards',
                  }}>
                    @{winner.username}
                  </div>
                  <div className="font-mono text-sm mx-auto max-w-sm italic mb-6" style={{color:t.muted}}>
                    &ldquo;{winner.comment.text.substring(0,100)}{winner.comment.text.length>100?'…':''}&rdquo;
                  </div>
                  <div className="rounded-xl px-5 py-4 text-left mb-4"
                    style={{background:t.accentBg,border:`1px solid ${t.accentBorder}`}}>
                    <strong className="block mb-2" style={{color:t.accent2}}>✅ Antes de entregar el premio verifica:</strong>
                    <div className="space-y-2">
                      <div className="flex gap-2 text-sm" style={{color:t.muted}}>
                        <span>📸</span><span>Compartió el post en Stories (pide captura si cuenta privada)</span>
                      </div>
                      {filters.requireFollow&&filters.followAccount&&(
                        <div className="flex gap-2 text-sm" style={{color:t.muted}}>
                          <span>👤</span><span>Sigue a <strong style={{color:t.text}}>@{filters.followAccount.replace(/^@/,'')}</strong> (pide captura)</span>
                        </div>
                      )}
                      {filters.requireLike&&(
                        <div className="flex gap-2 text-sm" style={{color:t.muted}}>
                          <span>❤️</span><span>Dio like a la publicación (pide captura)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center gap-5 text-sm" style={{color:t.muted}}>
                    <span>✅ {validParticipants.length} válidos</span>
                    <span>🚫 {invalidParticipants.length} excluidos</span>
                    {usedWinners.length>1&&<span>🔄 Reroll #{usedWinners.length}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button onClick={reroll}
                    className="py-4 rounded-2xl text-sm font-bold border transition-all hover:border-orange-500 active:scale-95"
                    style={{background:t.surface,borderColor:t.border,color:t.muted}}>
                    🔄 Reroll
                  </button>
                  <button onClick={resetSorteo}
                    className="py-4 rounded-2xl text-sm font-bold border transition-all hover:border-orange-500 active:scale-95"
                    style={{background:t.surface,borderColor:t.border,color:t.muted}}>
                    ↺ Nuevo sorteo
                  </button>
                </div>

                {invalidParticipants.length>0&&(
                  <div className="rounded-2xl border overflow-hidden" style={{background:t.surface,borderColor:t.border}}>
                    <button onClick={()=>setShowInvalid(v=>!v)}
                      className="w-full px-5 py-4 flex items-center justify-between text-sm"
                      style={{color:t.muted}}>
                      <span>Ver {invalidParticipants.length} comentarios excluidos</span>
                      <span style={{fontSize:12}}>{showInvalid?'▲':'▼'}</span>
                    </button>
                    {showInvalid&&(
                      <div className="max-h-48 overflow-y-auto px-5 pb-4">
                        {invalidParticipants.map((p,i)=>(
                          <div key={i} className="flex gap-3 py-2 border-b font-mono text-xs last:border-0" style={{borderColor:t.border}}>
                            <span style={{color:'#f87171',flexShrink:0}}>[{p.reason}]</span>
                            <span style={{color:t.muted}}>@{p.username}: {p.comment.text.substring(0,45)}…</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>

      {/* ── FOOTER ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40"
        style={{background:isDark?'rgba(28,28,30,0.97)':'rgba(255,255,255,0.97)',backdropFilter:'blur(16px)',borderTop:`1px solid ${t.border}`}}>
        <div className="max-w-2xl mx-auto px-5 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            {/* Left — Profiles */}
            <div className="flex items-center gap-3 sm:gap-5">
              {[
                {href:'https://www.instagram.com/jagarcia95',src:'/juan.jpeg',handle:'@jagarcia95'},
                {href:'https://www.instagram.com/la_nana_de_nala',src:'/nana.png',handle:'@la_nana_de_nala'},
              ].map(c=>(
                <a key={c.handle} href={c.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 sm:gap-3 transition-opacity hover:opacity-75">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden flex-shrink-0" style={{border:`2px solid ${t.accent}`}}>
                    <Image src={c.src} alt={c.handle} width={44} height={44} className="object-cover w-full h-full"/>
                  </div>
                  <span className="text-xs sm:text-sm font-mono hidden sm:block" style={{color:t.accent}}>{c.handle}</span>
                </a>
              ))}
            </div>
            {/* Right — T&C + copyright + theme */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <button onClick={()=>setShowTerms(v=>!v)}
                className="text-xs sm:text-sm underline underline-offset-2 transition-colors hover:opacity-80"
                style={{color:t.muted}}>
                T&amp;C
              </button>
              <span className="text-xs sm:text-sm" style={{color:t.muted}}>© {new Date().getFullYear()} Sorteazos</span>
              <button onClick={()=>setTheme(isDark?'light':'dark')}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-110"
                style={{background:t.surface2,border:`1px solid ${t.border}`}}>
                {isDark?'☀️':'🌙'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TERMS MODAL ── */}
      {showTerms&&(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)'}}
          onClick={()=>setShowTerms(false)}>
          <div className="w-full max-w-lg rounded-2xl border p-6 max-h-[80vh] overflow-y-auto"
            style={{background:t.surface,borderColor:t.border}}
            onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <strong className="text-base" style={{color:t.text}}>Términos y condiciones</strong>
              <button onClick={()=>setShowTerms(false)} className="text-xl" style={{color:t.muted}}>×</button>
            </div>
            <div className="text-xs leading-relaxed space-y-3" style={{color:t.muted}}>
              <p><strong style={{color:t.text}}>1. Naturaleza.</strong> Sorteazos es una herramienta gratuita de selección aleatoria. No está afiliada ni patrocinada por Instagram o Meta.</p>
              <p><strong style={{color:t.text}}>2. Aleatoriedad.</strong> El ganador se selecciona de forma completamente aleatoria entre los participantes que cumplen los requisitos.</p>
              <p><strong style={{color:t.text}}>3. Responsabilidad.</strong> Sorteazos no verifica la identidad ni la veracidad de los comentarios. La validación recae en el organizador.</p>
              <p><strong style={{color:t.text}}>4. Privacidad.</strong> No almacenamos datos personales. Todo se procesa en tu navegador.</p>
              <p><strong style={{color:t.text}}>5. Uso.</strong> El uso implica la aceptación de estos términos. El servicio puede cambiar sin previo aviso.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
