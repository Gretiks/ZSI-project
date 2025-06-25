import { useState } from "react";
import { useRouter } from "next/router";
import Button from "../Reusable/Button";

export default function LoginForm() {
  const [login, setlogin] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem("token", token);
      router.push("/dashboard");
    }
  };

  return (
    <form onSubmit={handleLogin} className="login-form">
      <input
        value={login}
        onChange={(e) => setlogin(e.target.value)}
        placeholder="login"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Hasło"
      />
      <Button text="Zaloguj się" />

      {/* <button>Zaloguj się</button> */}
    </form>
  );
}
