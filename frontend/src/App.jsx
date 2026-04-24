import { useState, useRef } from "react"
import Header from "./components/Header.jsx"
import ChatFeed from "./components/ChatFeed.jsx"
import StatusBar from "./components/StatusBar.jsx"
import VoiceButton from "./components/VoiceButton.jsx"
import Login from "./components/Login.jsx"
import "./App.css"

const API = "http://10.16.50.216:8000"

const LANGUAGES = [
  { label: "English", value: "english", flag: "🇬🇧" },
  { label: "Telugu", value: "telugu", flag: "🇮🇳" },
  { label: "Hindi", value: "hindi", flag: "🇮🇳" },
  { label: "Tamil", value: "tamil", flag: "🇮🇳" },
  { label: "Kannada", value: "kannada", flag: "🇮🇳" },
  { label: "Malayalam", value: "malayalam", flag: "🇮🇳" },
  { label: "Marathi", value: "marathi", flag: "🇮🇳" },
  { label: "Bengali", value: "bengali", flag: "🇮🇳" },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [language, setLanguage] = useState("english")
  const [messages, setMessages] = useState([{
    id: 0, role: "assistant", timestamp: new Date(), audioUrl: null,
    text: "Hello! I am Dr. Satish, your AI voice health assistant. Press the microphone button or type your symptoms below - I am here to help.",
  }])
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState(null)
  const [sessionId, setSessionId] = useState("")
  const [textInput, setTextInput] = useState("")
  const [isPaused, setIsPaused] = useState(false)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const audioRef = useRef(null)
  const streamingMsgIdRef = useRef(null)

  function handleLogin(loggedInUser) { setUser(loggedInUser) }

  function handleLogout() {
    setUser(null)
    setMessages([{
      id: 0, role: "assistant", timestamp: new Date(), audioUrl: null,
      text: "Hello! I am Dr. Satish, your AI voice health assistant. Press the microphone button or type your symptoms below - I am here to help.",
    }])
    setSessionId("")
    setStatus("idle")
    setError(null)
    setTextInput("")
    setLanguage("english")
    setIsPaused(false)
  }

  async function startRecording() {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        await sendAudio(new Blob(chunksRef.current, { type: "audio/webm" }))
      }
      recorder.start()
      recorderRef.current = recorder
      setStatus("recording")
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.")
      setStatus("error")
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop()
      setStatus("processing")
    }
  }

  async function sendAudio(blob) {
    const form = new FormData()
    form.append("audio", blob, "recording.webm")
    form.append("language", language)
    if (sessionId) form.append("session_id", sessionId)
    try {
      setStatus("processing")
      const res = await fetch(`${API}/api/voice/chat`, { method: "POST", body: form })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.detail || `Server error ${res.status}`)
      }
      const data = await res.json()
      if (data.session_id) setSessionId(data.session_id)
      const userMsg = {
        id: Date.now(), role: "user", timestamp: new Date(), audioUrl: null,
        text: data.transcript || "(audio message)"
      }
      const audioUrl = data.audio_base64 ? `data:audio/mpeg;base64,${data.audio_base64}` : null
      const aiMsg = {
        id: Date.now() + 1, role: "assistant", timestamp: new Date(), audioUrl,
        text: data.reply_text || ""
      }
      setMessages(prev => [...prev, userMsg, aiMsg])
      if (audioUrl) { setStatus("speaking"); setIsPaused(false); playAudio(audioUrl) }
      else setStatus("idle")
    } catch (err) {
      setError(err.message)
      setStatus("error")
    }
  }

  async function sendTextMessage() {
    const message = textInput.trim()
    if (!message || status === "processing" || status === "recording") return
    setTextInput("")
    setError(null)

    const userMsg = {
      id: Date.now(), role: "user", timestamp: new Date(), audioUrl: null,
      text: message
    }
    setMessages(prev => [...prev, userMsg])

    const aiMsgId = Date.now() + 1
    streamingMsgIdRef.current = aiMsgId
    setMessages(prev => [...prev, {
      id: aiMsgId, role: "assistant", timestamp: new Date(), audioUrl: null, text: ""
    }])

    try {
      setStatus("processing")
      const res = await fetch(`${API}/api/voice/stream-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id: sessionId || "", language })
      })

      if (!res.ok) throw new Error(`Server error ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") break
            try {
              const parsed = JSON.parse(data)
              if (parsed.session_id) setSessionId(parsed.session_id)
              if (parsed.token) {
                fullText += parsed.token
                setMessages(prev => prev.map(m =>
                  m.id === aiMsgId ? { ...m, text: fullText } : m
                ))
              }
            } catch {}
          }
        }
      }

      if (fullText) {
        const ttsRes = await fetch(`${API}/api/voice/synthesize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fullText, language })
        })
        if (ttsRes.ok) {
          const blob = await ttsRes.blob()
          const audioUrl = URL.createObjectURL(blob)
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId ? { ...m, audioUrl } : m
          ))
          setStatus("speaking")
          setIsPaused(false)
          playAudio(audioUrl)
        } else {
          setStatus("idle")
        }
      } else {
        setStatus("idle")
      }
    } catch (err) {
      setError(err.message)
      setStatus("error")
    }
  }

  function playAudio(url) {
    audioRef.current?.pause()
    const a = new Audio(url)
    audioRef.current = a
    a.play()
    a.onended = () => { setStatus("idle"); setIsPaused(false) }
    a.onerror = () => { setStatus("idle"); setIsPaused(false) }
  }

  function togglePause() {
    if (!audioRef.current) return
    if (isPaused) {
      audioRef.current.play()
      setIsPaused(false)
      setStatus("speaking")
    } else {
      audioRef.current.pause()
      setIsPaused(true)
      setStatus("paused")
    }
  }

  function stopAudio() {
    audioRef.current?.pause()
    setStatus("idle")
    setIsPaused(false)
  }

  function clearChat() {
    setMessages([{
      id: 0, role: "assistant", timestamp: new Date(), audioUrl: null,
      text: "Hello! I am Dr. Satish, your AI voice health assistant. Press the microphone button or type your symptoms below - I am here to help.",
    }])
    setSessionId("")
    setStatus("idle")
    setError(null)
    setTextInput("")
    setIsPaused(false)
  }

  if (!user) return <Login onLogin={handleLogin} />

  const currentLang = LANGUAGES.find(l => l.value === language)

  return (
    <div className="app">
      <Header onClear={clearChat} onLogout={handleLogout} user={user} />
      <main className="main"><ChatFeed messages={messages} onPlayAudio={playAudio} /></main>
      <footer className="footer">
        {error && (
          <div className="error-bar">
            <span>warning {error}</span>
            <button onClick={() => setError(null)}>X</button>
          </div>
        )}
        <StatusBar status={status} />

        <div style={{ padding: "0 16px", marginBottom: "8px" }}>
          <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "6px" }}>
            Select Language:
          </p>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => setLanguage(lang.value)}
                style={{
                  padding: "6px 14px", borderRadius: "20px",
                  fontSize: "13px", cursor: "pointer", fontWeight: "500",
                  background: language === lang.value ? "#2563eb" : "#1e2a3a",
                  color: language === lang.value ? "white" : "#94a3b8",
                  border: language === lang.value ? "2px solid #2563eb" : "2px solid #334155"
                }}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>
        </div>

        {(status === "speaking" || status === "paused") && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", gap: "8px" }}>
            <button
              onClick={togglePause}
              style={{
                padding: "10px 28px", borderRadius: "24px", border: "none",
                background: isPaused ? "#16a34a" : "#dc2626",
                color: "white", fontSize: "15px",
                cursor: "pointer", fontWeight: "600"
              }}
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={stopAudio}
              style={{
                padding: "10px 20px", borderRadius: "24px", border: "none",
                background: "#475569", color: "white", fontSize: "15px",
                cursor: "pointer", fontWeight: "600"
              }}
            >
              Stop
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", padding: "0 16px", marginBottom: "8px" }}>
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendTextMessage()}
            placeholder={`Type in ${currentLang?.label || "English"}...`}
            disabled={status === "processing" || status === "recording"}
            style={{
              flex: 1, padding: "12px 16px", borderRadius: "24px",
              border: "1px solid #444", fontSize: "15px", outline: "none",
              background: "#1e2a3a", color: "white"
            }}
          />
          <button
            onClick={sendTextMessage}
            disabled={!textInput.trim() || status === "processing" || status === "recording"}
            style={{
              padding: "12px 20px", borderRadius: "24px", border: "none",
              background: "#2563eb", color: "white", fontSize: "15px",
              cursor: "pointer", fontWeight: "600"
            }}
          >
            Send
          </button>
        </div>
        <VoiceButton status={status} onStart={startRecording} onStop={stopRecording} onStopAudio={stopAudio} />
        <p className="disclaimer">For informational purposes only - not a substitute for professional medical advice.</p>
      </footer>
    </div>
  )
}