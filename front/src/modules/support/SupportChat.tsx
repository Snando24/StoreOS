import { useState } from 'react'

type Message = {
  id: number
  author: 'assistant' | 'user'
  text: string
}

const starterMessages: Message[] = [
  {
    id: 1,
    author: 'assistant',
    text: 'Hola, soy el asistente de StoreOS. Te ayudo a crear y administrar tu tienda. No compartas contraseñas, códigos ni datos de pago por este chat.',
  },
]

const quickQuestions = [
  'No llega mi correo',
  '¿Cómo creo mi tienda?',
  '¿Qué es la tienda demo?',
]

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function answerFor(question: string): string {
  const value = normalize(question)
  if (value.includes('correo') || value.includes('email') || value.includes('confirm')) {
    return 'Revisa Spam y Promociones. El correo predeterminado de Supabase tiene límites de prueba; si ves “email rate limit exceeded”, espera una hora antes de reenviar. Para clientes reales se debe configurar SMTP propio.'
  }
  if (value.includes('crear') || value.includes('tienda') || value.includes('subdominio')) {
    return 'Pulsa “Crear mi tienda”, registra tu cuenta, confirma el correo, inicia sesión y define el nombre y subdominio. Tu cuenta se asigna automáticamente como propietaria del tenant.'
  }
  if (value.includes('demo') || value.includes('anime')) {
    return 'AnimeGeek es una tienda demo. Sirve para probar catálogo, carrito y checkout sin convertir a StoreOS en una plataforma exclusiva para productos geek.'
  }
  if (value.includes('producto') || value.includes('catalogo') || value.includes('catálogo')) {
    return 'El catálogo demo ya funciona. El siguiente avance habilitará que cada propietario cree, publique y vea productos dentro de su propio tenant.'
  }
  if (value.includes('seguridad') || value.includes('contraseña') || value.includes('clave')) {
    return 'Nunca compartas contraseñas, códigos de verificación, claves API ni datos de pago. StoreOS usa autenticación y aislamiento por tenant; las claves privadas no deben ir al navegador.'
  }
  return 'Puedo ayudarte con registro, confirmación de correo, creación de tienda, demo, catálogo y seguridad. Describe el paso en el que estás para darte una guía concreta.'
}

export default function SupportChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>(starterMessages)

  const send = (question: string) => {
    const text = question.trim()
    if (!text) return
    setMessages((current) => [
      ...current,
      { id: Date.now(), author: 'user', text },
      { id: Date.now() + 1, author: 'assistant', text: answerFor(text) },
    ])
    setInput('')
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section id="storeos-support-chat" className="mb-3 flex w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-brand/30 bg-panel shadow-2xl shadow-black/40" aria-label="Asistente de soporte StoreOS">
          <header className="flex items-center justify-between border-b border-white/8 bg-brand/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/brand/storeos-mark-dark.png" alt="" className="h-8 w-8 rounded-lg object-cover" />
              <div><p className="text-sm font-bold text-ink">Asistente StoreOS</p><p className="text-[10px] text-ink-secondary">Soporte guiado · beta</p></div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-sm text-ink-muted transition hover:bg-elevated hover:text-ink" aria-label="Cerrar asistente">×</button>
          </header>
          <div className="max-h-72 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message) => (
              <p key={message.id} className={message.author === 'assistant' ? 'mr-6 rounded-xl bg-elevated px-3 py-2 text-sm leading-relaxed text-ink-secondary' : 'ml-6 rounded-xl bg-brand px-3 py-2 text-sm leading-relaxed text-white'}>{message.text}</p>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-white/8 px-4 py-3">
            {quickQuestions.map((question) => <button key={question} onClick={() => send(question)} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-ink-secondary transition hover:border-brand/50 hover:text-ink">{question}</button>)}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); send(input) }} className="flex gap-2 border-t border-white/8 p-3">
            <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={500} placeholder="Escribe tu consulta" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-elevated px-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-brand" />
            <button className="rounded-xl bg-brand px-3 text-sm font-semibold text-white transition hover:bg-brand-light" aria-label="Enviar consulta">Enviar</button>
          </form>
        </section>
      )}
      <button onClick={() => setOpen((current) => !current)} className="flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-expanded={open} aria-controls="storeos-support-chat">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">?</span>
        {open ? 'Cerrar ayuda' : '¿Necesitas ayuda?'}
      </button>
    </div>
  )
}
