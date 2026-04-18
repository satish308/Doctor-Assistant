import { useState, useRef } from "react"
import Header from "./components/Header.jsx"
import ChatFeed from "./components/ChatFeed.jsx"
import StatusBar from "./components/StatusBar.jsx"
import VoiceButton from "./components/VoiceButton.jsx"
import Login from "./components/Login.jsx"
import "./App.css"

const API = "http://10.16.50.216:8000"

export default function App() {
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([{
    id: 0, role: "assistant", timestamp: new Date(), audioUrl: null,
    text: "Hello! I am Dr. Satish, your AI voice health assistant. Press the microphone button or type your symptoms below - I am here to help.",
  }])
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState(null)
  const [sessionId, setSessionId] = useState("")
  const [textInput, setTextInput] = useState("")
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const audioRef = useRef(null)

  function handleLogin(loggedInUser) {
    setUser(loggedInUser)
  }

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
      const audioUrl = data.audio_base64 ? `data:audio/wav;base64,${data.audio_base64}` : null
      const aiMsg = {
        id: Date.now() + 1, role: "assistant", timestamp: new Date(), audioUrl,
        text: data.reply_text || ""
      }
      setMessages(prev => [...prev, userMsg, aiMsg])
      if (audioUrl) { setStatus("speaking"); playAudio(audioUrl) }
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
    try {
      setStatus("processing")
      const res = await fetch(`${API}/api/voice/chat-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id: sessionId || "" })
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.detail || `Server error ${res.status}`)
      }
      const data = await res.json()
      if (data.session_id) setSessionId(data.session_id)
      const audioUrl = data.audio_base64 ? `data:audio/wav;base64,${data.audio_base64}` : null
      const aiMsg = {
        id: Date.now() + 1, role: "assistant", timestamp: new Date(), audioUrl,
        text: data.reply_text || ""
      }
      setMessages(prev => [...prev, aiMsg])
      if (audioUrl) { setStatus("speaking"); playAudio(audioUrl) }
      else setStatus("idle")
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
    a.onended = () => setStatus("idle")
    a.onerror = () => setStatus("idle")
  }

  function stopAudio() {
    audioRef.current?.pause()
    setStatus("idle")
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
  }

  if (!user) return <Login onLogin={handleLogin} />

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
        <div style={{ display: "flex", gap: "8px", padding: "0 16px", marginBottom: "8px" }}>
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendTextMessage()}
            placeholder="Type your symptoms here..."
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