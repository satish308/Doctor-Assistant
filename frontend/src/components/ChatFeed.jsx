import { useEffect, useRef } from "react"
import "./ChatFeed.css"

export default function ChatFeed({ messages, onPlayAudio }) {
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])
  return (
    <div className="chat-feed">
      <div className="chat-inner">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} onPlayAudio={onPlayAudio} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function MessageBubble({ msg, onPlayAudio }) {
  const isUser = msg.role === "user"
  const time = msg.timestamp?.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })
  return (
    <div className={`msg-row ${isUser ? "user" : "ai"}`}>
      {!isUser && <div className="avatar av-ai">&#43;</div>}
      <div className="bwrap">
        <div className={`bubble ${isUser ? "b-user" : "b-ai"}`}><p>{msg.text}</p></div>
        <div className="bmeta">
          <span className="btime">{time}</span>
          {msg.audioUrl && !isUser && (
            <button className="replay-btn" onClick={() => onPlayAudio(msg.audioUrl)}>
              ▶ Replay
            </button>
          )}
        </div>
      </div>
      {isUser && <div className="avatar av-user">U</div>}
    </div>
  )
}
