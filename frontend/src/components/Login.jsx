import { useState } from "react"
import "./Login.css"

const USERS = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "doctor1", password: "doc123", role: "user" },
  { username: "doctor2", password: "doc456", role: "user" },
  { username: "satish",password: "Thub@123",role:"user"},
]

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function handleLogin() {
    const user = USERS.find(
      u => u.username === username && u.password === password
    )
    if (user) {
      onLogin(user)
    } else {
      setError("Invalid username or password. Please try again.")
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-icon">🏥</div>
        <h1 className="login-title">Dr. Satish</h1>
        <p className="login-subtitle">AI Voice Health Assistant</p>

        {error && <div className="login-error">{error}</div>}

        <div className="login-field">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="Enter username"
          />
        </div>

        <div className="login-field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="Enter password"
          />
        </div>

        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>

        <p className="login-note">
          Contact admin to get your login credentials.
        </p>
      </div>
    </div>
  )
}