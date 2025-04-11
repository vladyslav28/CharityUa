import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

function LoginForm({ onLogin, switchToRegister }) {
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
      localStorage.setItem("token", data.token);
      onLogin(data.user);
      setMessage("");
    } else {
      setMessage(`❌ ${data.message}`);
    }
  };

  return (
    <div>
      <h2>Вхід</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Увійти</button>
      </form>
      {message && <p>{message}</p>}
      <p>Не маєш акаунту? <button onClick={switchToRegister}>Реєстрація</button></p>
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
      setMessage("✅ Реєстрація успішна!");
    } else {
      setMessage(`❌ ${data.message}`);
    }
  };

  return (
    <div>
      <h2>Реєстрація</h2>
      <form onSubmit={handleRegister}>
        <input type="text" placeholder="Імʼя" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Зареєструватись</button>
      </form>
      {message && <p>{message}</p>}
      <p>Маєш акаунт? <button onClick={switchToLogin}>Увійти</button></p>
    </div>
  );
}


function AdminPanel({ onBack, currentUser }) {
  const [users, setUsers] = useState([]);
  const [editedRoles, setEditedRoles] = useState({});

  useEffect(() => {
    fetch("http://localhost:5000/users", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
      });
  }, []);

  const handleRoleChange = (userId, newRole) => {
    setEditedRoles(prev => ({ ...prev, [userId]: newRole }));
  };

  const saveAllChanges = async () => {
    for (const userId in editedRoles) {
      const newRole = editedRoles[userId];
      await fetch(`http://localhost:5000/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ role: newRole })
      });
    }
    setUsers(users.map(user =>
      editedRoles[user.user_id]
        ? { ...user, role: editedRoles[user.user_id] }
        : user
    ));
    setEditedRoles({});
  };

  const handleBack = async () => {
    if (Object.keys(editedRoles).length > 0) {
      const confirmSave = window.confirm("Зберегти зміни перед виходом?");
      if (confirmSave) await saveAllChanges();
    }
    onBack();
  };

  return (
    <div>
      <h2>Керування користувачами</h2>
      <button onClick={handleBack}>Назад</button>
      <ul>
        {users.map(user => (
          <li key={user.user_id}>
            {user.name} ({user.email}) — роль:{" "}
            {user.email === currentUser.email ? (
              <strong>{user.role}</strong>
            ) : (
              <select
                value={editedRoles[user.user_id] || user.role}
                onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
              >
                <option value="donator">donator</option>
                <option value="moderator">moderator</option>
                <option value="organizer">organizer</option>
                <option value="admin">admin</option>
              </select>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}


function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  if (showAdminPanel && user?.role === "admin") {
    return <AdminPanel onBack={() => setShowAdminPanel(false)} currentUser={user} />;
  }

  if (!user) {
    return isLogin ? (
      <LoginForm switchToRegister={() => setIsLogin(false)} onLogin={setUser} />
    ) : (
      <RegisterForm switchToLogin={() => setIsLogin(true)} />
    );
  }

  return (
    <div>
      <h2>Привіт, {user.name}!</h2>
      <p>Роль: {user.role}</p>
      {user.role === "admin" && (
        <button onClick={() => setShowAdminPanel(true)}>
          Керування користувачами
        </button>
      )}
      <button onClick={() => {
        localStorage.removeItem("token");
        setUser(null);
      }}>Вийти</button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);
