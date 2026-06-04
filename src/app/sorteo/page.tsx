'use client'

import { useState, useRef, useCallback } from 'react'

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

function filterParticipants(comments: Comment[], filters: Filters): { valid: Participant[]; invalid: Array<Participant & { reason: string }> } {
  const valid: Participant[] = []
  const invalid: Array<Participant & { reason: string }> = []
  const seen = new Set<string>()

  for (const c of comments) {
    const p: Participant = { username: c.username, comment: c }
    let reason = ''

    if (filters.excludeOrganizer && c.username === filters.organizerUsername.toLowerCase().replace(/^@/, '')) {
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

/* ─── Sub-components ─────────────────────────────────────── */
function TagInput({ tags, onAdd, onRemove, placeholder, prefix = '' }: {
  tags: string[]
  onAdd: (t: string) => void
  onRemove: (i: number) => void
  placeholder: string
  prefix?: string
}) {
  const [val, setVal] = useState('')
  return (
    <div>
      <input
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
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
            <span key={t} className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs font-mono text-amber-400">
              {prefix}{t}
              <button onClick={() => onRemove(i)} className="text-zinc-500 hover:text-red-400 ml-1 text-sm leading-none">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
      <div>
        <div className="text-sm font-semibold text-zinc-200">{label}</div>
        {desc && <div className="text-xs text-zinc-500 mt-0.5">{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-4 ${checked ? 'bg-orange-500' : 'bg-zinc-700'}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

/* ─── Confetti ───────────────────────────────────────────── */
function launchConfetti() {
  const colors = ['#f97316', '#fb923c', '#fbbf24', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa']
  for (let i = 0; i < 80; i++) {
    const d = document.createElement('div')
    const size = 6 + Math.random() * 8
    d.style.cssText = `
      position:fixed;width:${size}px;height:${size}px;border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      background:${colors[Math.floor(Math.random() * colors.length)]};
      left:${Math.random() * 100}vw;top:-10px;z-index:9999;
      animation:fall ${1.8 + Math.random() * 2}s linear ${Math.random() * 0.6}s forwards;
    `
    document.body.appendChild(d)
    setTimeout(() => d.remove(), 5000)
  }
}

/* ─── Main component ─────────────────────────────────────── */
export default function SorteoPage() {
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
    excludeOrganizer: true,
    organizerUsername: 'la_nana_de_nala',
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
  const [globalError, setGlobalError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

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

  /* ── Load from pasted text ── */
  const loadFromPaste = useCallback(() => {
    const parsed = parseComments(rawText)
    if (parsed.length === 0) { setGlobalError('No se encontraron comentarios válidos en el texto'); return }
    setComments(parsed)
    setPhase('ready')
    setGlobalError('')
  }, [rawText])

  /* ── Load from file ── */
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

  /* ── Start sorteo ── */
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

  /* ── Drum roll ── */
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

  /* ── Reroll ── */
  const reroll = useCallback(() => {
    setPhase('rolling')
    setWinner(null)
    runDrum(validParticipants, usedWinners)
  }, [validParticipants, usedWinners, runDrum])

  /* ── Reset ── */
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

  /* ─── RENDER ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <header className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>
            🎁
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight" style={{ letterSpacing: '-0.5px' }}>
              Sorteo Instagram
            </h1>
            <p className="text-xs mono mt-0.5" style={{ color: 'var(--muted)' }}>@la_nana_de_nala</p>
          </div>
          {phase !== 'setup' && (
            <button onClick={reset}
              className="ml-auto text-xs px-3 py-2 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              ↺ Nuevo sorteo
            </button>
          )}
        </header>

        {/* Global error */}
        {globalError && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm border animate-slide-up"
            style={{ background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.3)', color: 'var(--red)' }}>
            {globalError}
          </div>
        )}

        {/* ── PHASE: SETUP ── */}
        {(phase === 'setup' || phase === 'ready') && (
          <>
            {/* Step 1 — Load comments */}
            <section className="rounded-xl border p-6 mb-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--accent)' }}>
                01 — Cargar comentarios
              </div>

              {/* Mode tabs */}
              <div className="flex gap-1 p-1 rounded-lg mb-5" style={{ background: 'var(--surface2)' }}>
                {(['url', 'paste', 'file'] as const).map(m => (
                  <button key={m} onClick={() => setImportMode(m)}
                    className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-all"
                    style={importMode === m
                      ? { background: 'var(--accent)', color: 'white' }
                      : { color: 'var(--muted)' }}>
                    {m === 'url' ? '🔗 URL del post' : m === 'paste' ? '📋 Pegar texto' : '📁 Archivo'}
                  </button>
                ))}
              </div>

              {/* URL mode */}
              {importMode === 'url' && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                    URL del post de Instagram
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="https://www.instagram.com/p/..."
                      value={postUrl}
                      onChange={e => setPostUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && loadFromApi()}
                    />
                    <button
                      onClick={loadFromApi}
                      disabled={loadingApi}
                      className="px-4 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                      style={{ background: 'var(--accent)', color: 'white' }}>
                      {loadingApi ? '⏳' : 'Cargar'}
                    </button>
                  </div>
                  {apiError && (
                    <div className="mt-3 p-3 rounded-lg text-xs border"
                      style={{ background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.25)', color: 'var(--red)' }}>
                      <strong>Error API:</strong> {apiError}
                      <div className="mt-1 opacity-70">Cambia a "Pegar texto" o "Archivo" como alternativa.</div>
                    </div>
                  )}
                  <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
                    Requiere <code className="text-orange-400">INSTAGRAM_TOKEN</code> e <code className="text-orange-400">INSTAGRAM_USER_ID</code> en las variables de entorno de Vercel.
                  </p>
                </div>
              )}

              {/* Paste mode */}
              {importMode === 'paste' && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                    Pega los comentarios (uno por línea)
                  </label>
                  <textarea
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-orange-500 transition-colors resize-y"
                    rows={8}
                    placeholder={"@usuario1 Participo! Menciono a @amiga1 y @amiga2\n@usuario2 Me apunto! @pedro @maria"}
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    Formato: cada línea es un comentario. El primer @usuario es el participante.
                  </p>
                  <button onClick={loadFromPaste}
                    className="mt-3 w-full py-2.5 rounded-lg text-sm font-bold transition-all"
                    style={{ background: 'var(--accent)', color: 'white' }}>
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
                    style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                    <div className="text-3xl mb-2">📁</div>
                    <div className="font-semibold">Haz clic para seleccionar un archivo</div>
                    <div className="text-xs mt-1 opacity-60">TXT o CSV — un comentario por línea</div>
                  </button>
                </div>
              )}

              {/* Loaded confirmation */}
              {comments.length > 0 && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: 'var(--green)' }}>
                  ✓ <strong>{comments.length} comentarios cargados</strong>
                  <button onClick={() => setComments([])} className="ml-auto text-xs opacity-60 hover:opacity-100">× borrar</button>
                </div>
              )}
            </section>

            {/* Step 2 — Filters */}
            <section className="rounded-xl border mb-4 overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <button
                onClick={() => setShowFilters(v => !v)}
                className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-zinc-800/50">
                <div className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
                  02 — Requisitos del sorteo
                </div>
                <span style={{ color: 'var(--muted)' }}>{showFilters ? '▲' : '▼'}</span>
              </button>

              {showFilters && (
                <div className="px-6 pb-6 animate-slide-up">

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                        Mínimo de menciones
                      </label>
                      <input type="number" min={0} max={10}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-orange-500"
                        value={filters.minMentions}
                        onChange={e => setFilters(f => ({ ...f, minMentions: +e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                        Tu usuario (excluir)
                      </label>
                      <input type="text"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-orange-500"
                        value={filters.organizerUsername}
                        placeholder="sin @"
                        onChange={e => setFilters(f => ({ ...f, organizerUsername: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                      Hashtags requeridos <span className="opacity-50">(Enter para añadir)</span>
                    </label>
                    <TagInput
                      tags={filters.hashtags}
                      onAdd={t => setFilters(f => ({ ...f, hashtags: [...f.hashtags, t] }))}
                      onRemove={i => setFilters(f => ({ ...f, hashtags: f.hashtags.filter((_, j) => j !== i) }))}
                      placeholder="sorteolananana"
                      prefix="#"
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                      Palabras clave requeridas <span className="opacity-50">(Enter para añadir)</span>
                    </label>
                    <TagInput
                      tags={filters.keywords}
                      onAdd={t => setFilters(f => ({ ...f, keywords: [...f.keywords, t] }))}
                      onRemove={i => setFilters(f => ({ ...f, keywords: f.keywords.filter((_, j) => j !== i) }))}
                      placeholder="quiero ganar"
                    />
                  </div>

                  <Toggle checked={filters.excludeDuplicates} onChange={v => setFilters(f => ({ ...f, excludeDuplicates: v }))}
                    label="Excluir duplicados" desc="Un usuario con varios comentarios solo cuenta una vez" />
                  <Toggle checked={filters.excludeOrganizer} onChange={v => setFilters(f => ({ ...f, excludeOrganizer: v }))}
                    label="Excluir al organizador" desc="Tu usuario no puede resultar ganador" />
                  <Toggle checked={filters.requireDistinctMentions} onChange={v => setFilters(f => ({ ...f, requireDistinctMentions: v }))}
                    label="Menciones a usuarios distintos" desc="No vale mencionar al mismo usuario dos veces" />
                </div>
              )}
            </section>

            {/* Sortear button */}
            {comments.length > 0 && (
              <button
                onClick={startSorteo}
                className="w-full py-5 rounded-xl text-lg font-extrabold tracking-tight transition-all hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #fbbf24)',
                  color: 'white',
                  boxShadow: '0 4px 24px rgba(249,115,22,0.3)',
                  letterSpacing: '-0.3px',
                }}>
                🎲 REALIZAR SORTEO
              </button>
            )}
          </>
        )}

        {/* ── PHASE: ROLLING ── */}
        {phase === 'rolling' && (
          <div className="rounded-xl border p-10 text-center animate-slide-up"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="text-3xl mb-4">🎰</div>
            <div className="animate-drum text-4xl font-extrabold mono" style={{ color: 'var(--gold)', letterSpacing: '-1px' }}>
              {drumName}
            </div>
            <div className="text-xs uppercase tracking-widest mt-4" style={{ color: 'var(--muted)' }}>
              ✨ sorteando entre {validParticipants.length} participantes...
            </div>
          </div>
        )}

        {/* ── PHASE: WINNER ── */}
        {phase === 'winner' && winner && (
          <>
            <div className="rounded-xl border-2 p-8 text-center animate-winner mb-4 relative overflow-hidden"
              style={{ background: 'var(--surface)', borderColor: 'var(--accent)' }}>
              {/* Glow */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.1) 0%, transparent 65%)' }} />

              <div className="text-5xl mb-3">🏆</div>
              <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--accent)' }}>
                Ganador/a del sorteo
              </div>
              <div className="text-4xl font-extrabold mb-2 animate-pulse-ring rounded-full inline-block px-4 py-1"
                style={{ color: 'var(--gold)', letterSpacing: '-1px' }}>
                @{winner.username}
              </div>
              <div className="mono text-sm mt-3 mx-auto max-w-sm opacity-70 italic">
                "{winner.comment.text.substring(0, 100)}{winner.comment.text.length > 100 ? '…' : ''}"
              </div>

              {/* Story notice */}
              <div className="mt-6 rounded-lg px-4 py-3 text-left text-sm"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
                <strong className="block mb-1" style={{ color: 'var(--accent2)' }}>📸 Verificación de story</strong>
                <span className="text-zinc-400">Si la cuenta es privada, solicita captura de pantalla demostrando que compartió el post antes de entregar el premio.</span>
              </div>

              {/* Stats */}
              <div className="mt-4 flex justify-center gap-6 text-xs" style={{ color: 'var(--muted)' }}>
                <span>✅ {validParticipants.length} participantes válidos</span>
                <span>🚫 {invalidParticipants.length} excluidos</span>
                {usedWinners.length > 1 && <span>🔄 Reroll #{usedWinners.length}</span>}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-4">
              <button onClick={reroll}
                className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all hover:border-orange-500"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                🔄 Reroll — nuevo ganador
              </button>
              <button onClick={reset}
                className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all hover:border-orange-500"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                ↺ Nuevo sorteo
              </button>
            </div>

            {/* Invalid list */}
            {invalidParticipants.length > 0 && (
              <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <button
                  onClick={() => setShowInvalid(v => !v)}
                  className="w-full px-5 py-3 flex items-center justify-between text-sm hover:bg-zinc-800/50 transition-colors">
                  <span style={{ color: 'var(--muted)' }}>Ver {invalidParticipants.length} comentarios excluidos</span>
                  <span style={{ color: 'var(--muted)' }}>{showInvalid ? '▲' : '▼'}</span>
                </button>
                {showInvalid && (
                  <div className="max-h-48 overflow-y-auto px-5 pb-4">
                    {invalidParticipants.map((p, i) => (
                      <div key={i} className="flex gap-3 py-2 border-b mono text-xs last:border-0"
                        style={{ borderColor: 'var(--border)' }}>
                        <span style={{ color: 'var(--red)', flexShrink: 0 }}>[{p.reason}]</span>
                        <span style={{ color: 'var(--muted)' }}>@{p.username}: {p.comment.text.substring(0, 50)}…</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
