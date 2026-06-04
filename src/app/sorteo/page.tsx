'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'

/* ─── Types ─────────────────────────────────────────────── */
interface Comment {
  username: string
  text: string
  timestamp?: string
}

interface Filters {
  minMentions: number
  requireDistinctMentions: boolean
  hashtags: string[]
  keywords: string[]
  excludeDuplicates: boolean
  excludeOrganizer: boolean
  organizerUsername: string
}

interface Participant {
  username: string
  comment: Comment
}

type Phase = 'setup' | 'ready' | 'rolling' | 'winner'
type Theme = 'dark' | 'light'

/* ─── Helpers ────────────────────────────────────────────── */
function parseComments(raw: string): Comment[] {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^@?([\w.]+)[:\s]+(.+)/)
      if (match) return { username: match[1].toLowerCase(), text: match[2] }
      const atMatch = line.match(/@([\w.]+)/)
      if (atMatch) return { username: atMatch[1].toLowerCase(), text: line }
      return null
    })
    .filter(Boolean) as Comment[]
}

function getMentions(text: string, self: string): string[] {
  return [...text.matchAll(/@([\w.]+)/g)]
    .map(m => m[1].toLowerCase())
    .filter(u => u !== self.toLowerCase())
}

function filterParticipants(comments: Comment[], filters: Filters): {
  valid: Participant[]
  invalid: Array<Participant & { reason: string }>
} {
  const valid: Participant[] = []
  const invalid: Array<Participant & { reason: string }> = []
  const seen = new Set<string>()

  for (const c of comments) {
    const p: Participant = { username: c.username, comment: c }
    let reason = ''

    if (filters.excludeOrganizer && filters.organizerUsername &&
      c.username === filters.organizerUsername.toLowerCase().replace(/^@/, '')) {
      reason = 'Es el organizador'
    } else if (filters.excludeDuplicates && seen.has(c.username)) {
      reason = 'Comentario duplicado'
    } else {
      const mentions = getMentions(c.text, c.username)
      const effectiveMentions = filters.requireDistinctMentions ? [...new Set(mentions)] : mentions

      if (effectiveMentions.length < filters.minMentions) {
        reason = `Solo ${effectiveMentions.length} mención(es) (mínimo ${filters.minMentions})`
      } else if (filters.hashtags.length > 0) {
        const lower = c.text.toLowerCase()
        const missing = filters.hashtags.find(h => !lower.includes('#' + h))
        if (missing) reason = `Falta hashtag: #${missing}`
      }

      if (!reason && filters.keywords.length > 0) {
        const lower = c.text.toLowerCase()
        const missing = filters.keywords.find(k => !lower.includes(k))
        if (missing) reason = `Falta palabra: "${missing}"`
      }
    }

    if (reason) {
      invalid.push({ ...p, reason })
    } else {
      valid.push(p)
      seen.add(c.username)
    }
  }

  return { valid, invalid }
}

/* ─── Confetti ───────────────────────────────────────────── */
function launchConfetti() {
  const colors = ['#f97316', '#fb923c', '#fbbf24', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa']
  for (let i = 0; i < 80; i++) {
    const d = document.createElement('div')
    const size = 6 + Math.random() * 8
    d.style.cssText = `
      position:fixed;width:${size}px;height:${size}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      background:${colors[Math.floor(Math.random() * colors.length)]};
      left:${Math.random() * 100}vw;top:-10px;z-index:9999;
      animation:fall ${1.8 + Math.random() * 2}s linear ${Math.random() * 0.6}s forwards;
    `
    document.body.appendChild(d)
    setTimeout(() => d.remove(), 5000)
  }
}

/* ─── Sub-components ─────────────────────────────────────── */
function TagInput({ tags, onAdd, onRemove, placeholder, prefix = '', theme }: {
  tags: string[]
  onAdd: (t: string) => void
  onRemove: (i: number) => void
  placeholder: string
  prefix?: string
  theme: Theme
}) {
  const [val, setVal] = useState('')
  const isDark = theme === 'dark'
  return (
    <div>
      <input
        className="w-full rounded-lg px-3 py-2 text-sm font-mono focus:outline-none transition-colors"
        style={{
          background: isDark ? '#18181b' : '#f4f4f5',
          border: `1px solid ${isDark ? '#3f3f46' : '#d4d4d8'}`,
          color: isDark ? '#fafafa' : '#18181b',
        }}
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const clean = val.trim().replace(/^[#@]/, '').toLowerCase()
            if (clean && !tags.includes(clean)) onAdd(clean)
            setVal('')
          }
        }}
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((t, i) => (
            <span key={t} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-mono"
              style={{
                background: isDark ? '#27272a' : '#e4e4e7',
                border: `1px solid ${isDark ? '#3f3f46' : '#d4d4d8'}`,
                color: '#f97316',
              }}>
              {prefix}{t}
              <button onClick={() => onRemove(i)} className="ml-1 text-sm leading-none"
                style={{ color: isDark ? '#71717a' : '#a1a1aa' }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Toggle({ checked, onChange, label, desc, theme }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  desc?: string
  theme: Theme
}) {
  const isDark = theme === 'dark'
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0"
      style={{ borderColor: isDark ? '#27272a' : '#e4e4e7' }}>
      <div>
        <div className="text-sm font-semibold" style={{ color: isDark ? '#e4e4e7' : '#27272a' }}>{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{ color: isDark ? '#71717a' : '#71717a' }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-4"
        style={{ background: checked ? '#f97316' : (isDark ? '#3f3f46' : '#d4d4d8') }}>
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */
export default function SorteoPage() {
  const [theme, setTheme] = useState<Theme>('dark')
  const isDark = theme === 'dark'

  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [rawText, setRawText] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [loadingApi, setLoadingApi] = useState(false)
  const [apiError, setApiError] = useState('')
  const [importMode, setImportMode] = useState<'url' | 'paste' | 'file'>('url')

  // Filters
  const [filters, setFilters] = useState<Filters>({
    minMentions: 2,
    requireDistinctMentions: true,
    hashtags: [],
    keywords: [],
    excludeDuplicates: true,
    excludeOrganizer: false,
    organizerUsername: '',
  })

  // Sorteo state
  const [phase, setPhase] = useState<Phase>('setup')
  const [validParticipants, setValidParticipants] = useState<Participant[]>([])
  const [invalidParticipants, setInvalidParticipants] = useState<Array<Participant & { reason: string }>>([])
  const [drumName, setDrumName] = useState('')
  const [winner, setWinner] = useState<Participant | null>(null)
  const [usedWinners, setUsedWinners] = useState<string[]>([])
  const [showInvalid, setShowInvalid] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // CSS vars per theme
  const t = {
    bg: isDark ? '#09090b' : '#fafafa',
    surface: isDark ? '#111113' : '#ffffff',
    surface2: isDark ? '#18181b' : '#f4f4f5',
    border: isDark ? '#27272a' : '#e4e4e7',
    text: isDark ? '#fafafa' : '#09090b',
    muted: isDark ? '#71717a' : '#71717a',
    inputBg: isDark ? '#18181b' : '#f4f4f5',
    inputBorder: isDark ? '#3f3f46' : '#d4d4d8',
  }

  /* ── Load via API ── */
  const loadFromApi = useCallback(async () => {
    if (!postUrl.trim()) { setApiError('Introduce la URL del post'); return }
    setLoadingApi(true)
    setApiError('')
    try {
      const res = await fetch(`/api/comments?url=${encodeURIComponent(postUrl)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')
      const parsed: Comment[] = data.comments.map((c: { username: string; text: string; timestamp?: string }) => ({
        username: c.username.toLowerCase(),
        text: c.text,
        timestamp: c.timestamp,
      }))
      setComments(parsed)
      setPhase('ready')
      setApiError('')
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : 'Error al cargar comentarios')
    } finally {
      setLoadingApi(false)
    }
  }, [postUrl])

  const loadFromPaste = useCallback(() => {
    const parsed = parseComments(rawText)
    if (parsed.length === 0) { setGlobalError('No se encontraron comentarios válidos en el texto'); return }
    setComments(parsed)
    setPhase('ready')
    setGlobalError('')
  }, [rawText])

  const loadFromFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const parsed = parseComments(text)
      if (parsed.length === 0) { setGlobalError('No se encontraron comentarios válidos en el archivo'); return }
      setComments(parsed)
      setPhase('ready')
      setGlobalError('')
    }
    reader.readAsText(file)
  }, [])

  const startSorteo = useCallback(() => {
    const { valid, invalid } = filterParticipants(comments, filters)
    if (valid.length === 0) { setGlobalError('No hay participantes válidos con los requisitos actuales'); return }
    setValidParticipants(valid)
    setInvalidParticipants(invalid)
    setUsedWinners([])
    setWinner(null)
    setGlobalError('')
    runDrum(valid, [])
  }, [comments, filters])

  const runDrum = useCallback((pool: Participant[], excluded: string[]) => {
    const available = pool.filter(p => !excluded.includes(p.username))
    if (available.length === 0) { setGlobalError('No quedan más participantes disponibles'); return }
    setPhase('rolling')
    setWinner(null)
    let ticks = 0
    const total = 45
    const interval = setInterval(() => {
      const r = available[Math.floor(Math.random() * available.length)]
      setDrumName('@' + r.username)
      ticks++
      if (ticks >= total) {
        clearInterval(interval)
        const picked = available[Math.floor(Math.random() * available.length)]
        setWinner(picked)
        setUsedWinners(prev => [...prev, picked.username])
        setPhase('winner')
        launchConfetti()
      }
    }, 65)
  }, [])

  const reroll = useCallback(() => {
    setPhase('rolling')
    setWinner(null)
    runDrum(validParticipants, usedWinners)
  }, [validParticipants, usedWinners, runDrum])

  const reset = useCallback(() => {
    setComments([])
    setRawText('')
    setPostUrl('')
    setPhase('setup')
    setWinner(null)
    setUsedWinners([])
    setValidParticipants([])
    setInvalidParticipants([])
    setGlobalError('')
  }, [])

  const inputStyle = {
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    color: t.text,
  }

  /* ─── RENDER ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: t.bg, color: t.text }}>
      <div className="max-w-2xl mx-auto px-4 py-10 pb-32">

        {/* ── Header ── */}
        <header className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>
            🎁
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Sorteazos</h1>
            <p className="text-xs font-mono mt-0.5" style={{ color: t.muted }}>sorteos de Instagram, gratis y sin registro</p>
          </div>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="ml-auto w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors"
            style={{ background: t.surface2, border: `1px solid ${t.border}` }}
            title="Cambiar tema">
            {isDark ? '☀️' : '🌙'}
          </button>
        </header>

        {/* ── Welcome card ── */}
        <section className="rounded-xl border p-6 mb-5" style={{ background: t.surface, borderColor: t.border }}>
          <div className="text-sm leading-relaxed mb-5" style={{ color: t.muted }}>
            <span className="font-bold" style={{ color: t.text }}>Sorteazos</span> es una herramienta gratuita y sin registro para hacer sorteos en Instagram de forma justa y transparente. Filtra comentarios por requisitos (menciones, hashtags…), elige un ganador aleatorio y haz reroll si es necesario. Sin límites, sin suscripción.
            <br /><br />
            Si te resulta útil, puedes apoyar el proyecto con una pequeña donación para cubrir el coste del dominio. ¡Gracias! 🙏
          </div>

          {/* Credits */}
          <div className="flex items-center gap-4 pt-4" style={{ borderTop: `1px solid ${t.border}` }}>
            <p className="text-xs mr-auto" style={{ color: t.muted }}>Una colaboración de:</p>
            <a href="https://www.instagram.com/jagarcia95" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-full overflow-hidden" style={{ border: '2px solid #f97316' }}>
                <Image src="/juan.jpeg" alt="Juan María" width={36} height={36} className="object-cover w-full h-full" />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: t.text }}>Juan María</div>
                <div className="text-xs font-mono" style={{ color: '#f97316' }}>@jagarcia95</div>
              </div>
            </a>
            <a href="https://www.instagram.com/la_nana_de_nala" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-full overflow-hidden" style={{ border: '2px solid #f97316' }}>
                <Image src="/nana.png" alt="La Ñañá de Nala" width={36} height={36} className="object-cover w-full h-full" />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: t.text }}>La Ñañá de Nala</div>
                <div className="text-xs font-mono" style={{ color: '#f97316' }}>@la_nana_de_nala</div>
              </div>
            </a>
          </div>
        </section>

        {/* ── Global error ── */}
        {globalError && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm border"
            style={{ background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.3)', color: '#f87171' }}>
            {globalError}
          </div>
        )}

        {/* ── SETUP / READY ── */}
        {(phase === 'setup' || phase === 'ready') && (
          <>
            {/* Step 1 — Load comments */}
            <section className="rounded-xl border p-6 mb-4" style={{ background: t.surface, borderColor: t.border }}>
              <div className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#f97316' }}>
                01 — Cargar comentarios
              </div>

              {/* Mode tabs */}
              <div className="flex gap-1 p-1 rounded-lg mb-5" style={{ background: t.surface2 }}>
                {(['url', 'paste', 'file'] as const).map(m => (
                  <button key={m} onClick={() => setImportMode(m)}
                    className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-all"
                    style={importMode === m
                      ? { background: '#f97316', color: 'white' }
                      : { color: t.muted }}>
                    {m === 'url' ? '🔗 URL del post' : m === 'paste' ? '📋 Pegar texto' : '📁 Archivo'}
                  </button>
                ))}
              </div>

              {/* URL mode */}
              {importMode === 'url' && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: t.muted }}>
                    URL del post de Instagram
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-orange-500 transition-colors"
                      style={inputStyle}
                      placeholder="https://www.instagram.com/p/..."
                      value={postUrl}
                      onChange={e => setPostUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && loadFromApi()}
                    />
                    <button onClick={loadFromApi} disabled={loadingApi}
                      className="px-4 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                      style={{ background: '#f97316', color: 'white' }}>
                      {loadingApi ? '⏳' : 'Cargar'}
                    </button>
                  </div>
                  {apiError && (
                    <div className="mt-3 p-3 rounded-lg text-xs border"
                      style={{ background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.25)', color: '#f87171' }}>
                      <strong>Error API:</strong> {apiError}
                      <div className="mt-1 opacity-70">Cambia a "Pegar texto" o "Archivo" como alternativa.</div>
                    </div>
                  )}
                  <p className="text-xs mt-3" style={{ color: t.muted }}>
                    Requiere cuenta de Instagram Business y token configurado.
                  </p>
                </div>
              )}

              {/* Paste mode */}
              {importMode === 'paste' && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: t.muted }}>
                    Pega los comentarios (uno por línea)
                  </label>
                  <textarea
                    className="w-full rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-orange-500 transition-colors resize-y"
                    style={inputStyle}
                    rows={8}
                    placeholder={"@usuario1 Participo! Menciono a @amiga1 y @amiga2\n@usuario2 Me apunto! @pedro @maria"}
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                  />
                  <p className="text-xs mt-1" style={{ color: t.muted }}>
                    Cada línea = un comentario. El primer @usuario es el participante.
                  </p>
                  <button onClick={loadFromPaste}
                    className="mt-3 w-full py-2.5 rounded-lg text-sm font-bold"
                    style={{ background: '#f97316', color: 'white' }}>
                    Cargar comentarios
                  </button>
                </div>
              )}

              {/* File mode */}
              {importMode === 'file' && (
                <div>
                  <input ref={fileRef} type="file" accept=".txt,.csv" className="hidden" onChange={loadFromFile} />
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full py-8 rounded-xl border-2 border-dashed text-sm transition-colors"
                    style={{ borderColor: t.border, color: t.muted }}>
                    <div className="text-3xl mb-2">📁</div>
                    <div className="font-semibold">Haz clic para seleccionar un archivo</div>
                    <div className="text-xs mt-1 opacity-60">TXT o CSV — un comentario por línea</div>
                  </button>
                </div>
              )}

              {comments.length > 0 && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}>
                  ✓ <strong>{comments.length} comentarios cargados</strong>
                  <button onClick={() => { setComments([]); setPhase('setup') }}
                    className="ml-auto text-xs opacity-60 hover:opacity-100">× borrar</button>
                </div>
              )}
            </section>

            {/* Step 2 — Filters */}
            <section className="rounded-xl border mb-4 overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
              <button onClick={() => setShowFilters(v => !v)}
                className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors"
                style={{ color: t.text }}>
                <div className="text-xs font-bold tracking-widest uppercase" style={{ color: '#f97316' }}>
                  02 — Requisitos del sorteo
                </div>
                <span style={{ color: t.muted }}>{showFilters ? '▲' : '▼'}</span>
              </button>

              {showFilters && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: t.muted }}>
                        Mínimo de menciones
                      </label>
                      <input type="number" min={0} max={10}
                        className="w-full rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-orange-500"
                        style={inputStyle}
                        value={filters.minMentions}
                        onChange={e => setFilters(f => ({ ...f, minMentions: +e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: t.muted }}>
                        Tu usuario (para excluirte)
                      </label>
                      <input type="text"
                        className="w-full rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-orange-500"
                        style={inputStyle}
                        value={filters.organizerUsername}
                        placeholder="sin @, opcional"
                        onChange={e => setFilters(f => ({ ...f, organizerUsername: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: t.muted }}>
                      Hashtags requeridos <span className="opacity-50">(Enter para añadir)</span>
                    </label>
                    <TagInput tags={filters.hashtags} theme={theme}
                      onAdd={t => setFilters(f => ({ ...f, hashtags: [...f.hashtags, t] }))}
                      onRemove={i => setFilters(f => ({ ...f, hashtags: f.hashtags.filter((_, j) => j !== i) }))}
                      placeholder="sorteazos" prefix="#" />
                  </div>

                  <div className="mb-5">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: t.muted }}>
                      Palabras clave requeridas <span className="opacity-50">(Enter para añadir)</span>
                    </label>
                    <TagInput tags={filters.keywords} theme={theme}
                      onAdd={k => setFilters(f => ({ ...f, keywords: [...f.keywords, k] }))}
                      onRemove={i => setFilters(f => ({ ...f, keywords: f.keywords.filter((_, j) => j !== i) }))}
                      placeholder="quiero ganar" />
                  </div>

                  <Toggle theme={theme} checked={filters.excludeDuplicates}
                    onChange={v => setFilters(f => ({ ...f, excludeDuplicates: v }))}
                    label="Excluir duplicados"
                    desc="Un usuario con varios comentarios solo cuenta una vez" />
                  <Toggle theme={theme} checked={filters.excludeOrganizer}
                    onChange={v => setFilters(f => ({ ...f, excludeOrganizer: v }))}
                    label="Excluir al organizador"
                    desc="Tu usuario no puede resultar ganador" />
                  <Toggle theme={theme} checked={filters.requireDistinctMentions}
                    onChange={v => setFilters(f => ({ ...f, requireDistinctMentions: v }))}
                    label="Menciones a usuarios distintos"
                    desc="No vale mencionar al mismo usuario dos veces" />
                </div>
              )}
            </section>

            {/* Sortear button */}
            {comments.length > 0 && (
              <button onClick={startSorteo}
                className="w-full py-5 rounded-xl text-lg font-extrabold tracking-tight transition-all hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #fbbf24)',
                  color: 'white',
                  boxShadow: '0 4px 24px rgba(249,115,22,0.3)',
                }}>
                🎲 REALIZAR SORTEO
              </button>
            )}
          </>
        )}

        {/* ── ROLLING ── */}
        {phase === 'rolling' && (
          <div className="rounded-xl border p-10 text-center"
            style={{ background: t.surface, borderColor: t.border }}>
            <div className="text-3xl mb-4">🎰</div>
            <div className="animate-drum text-4xl font-extrabold font-mono"
              style={{ color: '#fbbf24', letterSpacing: '-1px' }}>
              {drumName}
            </div>
            <div className="text-xs uppercase tracking-widest mt-4" style={{ color: t.muted }}>
              ✨ sorteando entre {validParticipants.length} participantes...
            </div>
          </div>
        )}

        {/* ── WINNER ── */}
        {phase === 'winner' && winner && (
          <>
            <div className="rounded-xl border-2 p-8 text-center mb-4 relative overflow-hidden"
              style={{ background: t.surface, borderColor: '#f97316' }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.08) 0%, transparent 65%)' }} />
              <div className="text-5xl mb-3">🏆</div>
              <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#f97316' }}>
                Ganador/a del sorteo
              </div>
              <div className="text-4xl font-extrabold mb-2" style={{ color: '#fbbf24', letterSpacing: '-1px' }}>
                @{winner.username}
              </div>
              <div className="font-mono text-sm mt-3 mx-auto max-w-sm italic" style={{ color: t.muted }}>
                &ldquo;{winner.comment.text.substring(0, 100)}{winner.comment.text.length > 100 ? '…' : ''}&rdquo;
              </div>
              <div className="mt-6 rounded-lg px-4 py-3 text-left text-sm"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
                <strong className="block mb-1" style={{ color: '#fb923c' }}>📸 Verificación de story</strong>
                <span style={{ color: t.muted }}>
                  Si la cuenta es privada, solicita captura de pantalla demostrando que compartió el post antes de entregar el premio.
                </span>
              </div>
              <div className="mt-4 flex justify-center gap-6 text-xs" style={{ color: t.muted }}>
                <span>✅ {validParticipants.length} participantes válidos</span>
                <span>🚫 {invalidParticipants.length} excluidos</span>
                {usedWinners.length > 1 && <span>🔄 Reroll #{usedWinners.length}</span>}
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button onClick={reroll}
                className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all hover:border-orange-500"
                style={{ background: t.surface, borderColor: t.border, color: t.muted }}>
                🔄 Reroll — nuevo ganador
              </button>
              <button onClick={reset}
                className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all hover:border-orange-500"
                style={{ background: t.surface, borderColor: t.border, color: t.muted }}>
                ↺ Nuevo sorteo
              </button>
            </div>

            {invalidParticipants.length > 0 && (
              <div className="rounded-xl border overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
                <button onClick={() => setShowInvalid(v => !v)}
                  className="w-full px-5 py-3 flex items-center justify-between text-sm transition-colors"
                  style={{ color: t.muted }}>
                  <span>Ver {invalidParticipants.length} comentarios excluidos</span>
                  <span>{showInvalid ? '▲' : '▼'}</span>
                </button>
                {showInvalid && (
                  <div className="max-h-48 overflow-y-auto px-5 pb-4">
                    {invalidParticipants.map((p, i) => (
                      <div key={i} className="flex gap-3 py-2 border-b font-mono text-xs last:border-0"
                        style={{ borderColor: t.border }}>
                        <span style={{ color: '#f87171', flexShrink: 0 }}>[{p.reason}]</span>
                        <span style={{ color: t.muted }}>@{p.username}: {p.comment.text.substring(0, 50)}…</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Terms ── */}
        <div className="mt-6">
          <button onClick={() => setShowTerms(v => !v)}
            className="text-xs underline underline-offset-2 transition-colors"
            style={{ color: t.muted }}>
            {showTerms ? '▲ Ocultar' : '▼ Ver'} términos y condiciones
          </button>
          {showTerms && (
            <div className="mt-3 rounded-xl border p-5 text-xs leading-relaxed"
              style={{ background: t.surface, borderColor: t.border, color: t.muted }}>
              <strong className="block mb-2" style={{ color: t.text }}>Términos y condiciones de uso</strong>
              <p className="mb-2"><strong>1. Naturaleza del servicio.</strong> Sorteazos es una herramienta gratuita de selección aleatoria. No está afiliada ni patrocinada por Instagram o Meta.</p>
              <p className="mb-2"><strong>2. Aleatoriedad.</strong> El ganador se selecciona de forma completamente aleatoria entre los participantes que cumplen los requisitos definidos por el organizador.</p>
              <p className="mb-2"><strong>3. Responsabilidad.</strong> Sorteazos no verifica la identidad de los participantes ni la veracidad de los comentarios. La responsabilidad de validar el cumplimiento de las bases del sorteo recae íntegramente en el organizador.</p>
              <p className="mb-2"><strong>4. Privacidad.</strong> Sorteazos no almacena ningún dato personal. Los comentarios introducidos se procesan únicamente en el navegador del usuario y no se envían a ningún servidor externo (salvo en el modo de carga por URL, que realiza una consulta a la API de Instagram).</p>
              <p><strong>5. Uso.</strong> El uso de esta herramienta implica la aceptación de estos términos. El servicio puede interrumpirse o modificarse en cualquier momento sin previo aviso.</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Donation banner (fixed bottom) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-5 py-3"
        style={{
          background: isDark ? 'rgba(9,9,11,0.92)' : 'rgba(250,250,250,0.92)',
          backdropFilter: 'blur(12px)',
          borderTop: `1px solid ${t.border}`,
        }}>
        <p className="text-xs" style={{ color: t.muted, lineHeight: '1.4' }}>
          <span className="font-semibold" style={{ color: t.text }}>Sorteazos es gratuito.</span>
          {' '}Si te ayuda, invítame a un café ☕ para mantener el dominio.
        </p>
        <a href="https://paypal.me/juanm95" target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:-translate-y-0.5"
          style={{ background: '#0070ba', color: 'white', textDecoration: 'none', boxShadow: '0 2px 12px rgba(0,112,186,0.3)' }}>
          <svg width="13" height="15" viewBox="0 0 24 28" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.5 3.5C18.3 1.9 15.9 1 13 1H5.5C4.7 1 4 1.6 3.9 2.4L1 21.6c-.1.6.4 1.2 1 1.2h5l1.3-8.1-.1.4C8.4 14.3 9.1 13.7 9.9 13.7h2c5.4 0 9.6-2.2 10.8-8.5.1-.3.1-.6.1-.9-.3-.3-.3-.5-.3-.8z"/>
            <path d="M19.8 5.7c-.1.5-.3 1-.5 1.5-1.4 7.2-6.3 9.7-12.5 9.7H4.5L3.1 26h4.5c.7 0 1.3-.5 1.4-1.2l.1-.3.9-5.4.1-.3c.1-.7.7-1.2 1.4-1.2h.9c5.7 0 10.1-2.3 11.4-9 .5-2.7.3-5-1-6.9z"/>
          </svg>
          Donar con PayPal
        </a>
      </div>
    </div>
  )
}
