import "./StatusBar.css"
const INFO = {
  idle:       { label:"Ready to listen",      cls:"s-idle" },
  recording:  { label:"Recording…",           cls:"s-rec",  dots:true },
  processing: { label:"Analysing your query", cls:"s-proc", dots:true },
  speaking:   { label:"Dr. Satish speaking",  cls:"s-speak",dots:true },
  error:      { label:"Something went wrong", cls:"s-err" },
}
export default function StatusBar({ status }) {
  const { label, cls, dots } = INFO[status] || INFO.idle
  return (
    <div className={`status-pill ${cls}`}>
      <span className="slabel">{label}</span>
      {dots && <span className="sdots"><span/><span/><span/></span>}
    </div>
  )
}
