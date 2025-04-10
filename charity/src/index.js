import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

function LoginForm({ switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(`✅ Вітаємо, ${data.user.name} (${data.user.role})`);

    } else {
      setMessage(`❌ ${data.message}`);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "2rem" }}>
      <h2>Вхід до CharityUA</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Увійти</button>
      </form>
      {message && <p>{message}</p>}
      <p>
        Не маєш акаунту? <button onClick={switchToRegister}>Реєстрація</button>
      </p>
    </div>
  );
}

function RegisterForm({ switchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Реєстрація успішна! Можна входити");
    } else {
      setMessage(`❌ ${data.message}`);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "2rem" }}>
      <h2>Реєстрація</h2>
      <form onSubmit={handleRegister}>
        <input type="text" placeholder="Імʼя" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Зареєструватись</button>
      </form>
      {message && <p>{message}</p>}
      <p>
        Маєш акаунт? <button onClick={switchToLogin}>Увійти</button>
      </p>
    </div>
  );
}

function App() {
  const [isLogin, setIsLogin] = useState(true);
  return isLogin ? (
    <LoginForm switchToRegister={() => setIsLogin(false)} />
  ) : (
    <RegisterForm switchToLogin={() => setIsLogin(true)} />
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
