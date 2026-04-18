import "./VoiceButton.css"
export default function VoiceButton({ status, onStart, onStop, onStopAudio }) {
  const isRec  = status === "recording"
  const isProc = status === "processing"
  const isSpk  = status === "speaking"
  const isIdle = status === "idle" || status === "error"
  function handleClick() {
    if (isRec) onStop()
    else if (isSpk) onStopAudio()
    else if (isIdle) onStart()
  }
  return (
    <div className="vwrap">
      <WaveBars active={isRec} />
      {isRec && <><div className="pring p1"/><div className="pring p2"/></>}
      <button className={`vbtn ${status}`} onClick={handleClick} disabled={isProc}>
        {isProc ? <SpinIcon /> : isRec ? <StopIcon /> : isSpk ? <SpeakIcon /> : <MicIcon />}
      </button>
      <WaveBars active={isRec} flip />
    </div>
  )
}
function WaveBars({ active, flip }) {
  const delays = flip ? [0.48,0.36,0.24,0.12,0] : [0,0.12,0.24,0.36,0.48]
  return (
    <div className="wbars" style={flip ? { transform:"scaleX(-1)" } : {}}>
      {delays.map((d,i) => (
        <div key={i} className={`bar ${active?"active":""}`} style={{ animationDelay:`${d}s` }} />
      ))}
    </div>
  )
}
function MicIcon()   { return <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg> }
function StopIcon()  { return <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg> }
function SpeakIcon() { return <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg> }
function SpinIcon()  { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" style={{animation:"spin 0.8s linear infinite"}}/></svg> }
