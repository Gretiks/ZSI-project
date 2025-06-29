import React, { useState } from "react";
import { useRouter } from "next/router";
import Button from "../Reusable/Button";

const RegisterForm = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login, password, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsSuccess(true);
        setLogin("");
        setPassword("");
        setEmail(" ");
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        setMessage(data.error || "Wystąpił błąd podczas rejestracji.");
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Błąd podczas wysyłania żądania rejestracji:", error);
      setMessage("Wystąpił nieoczekiwany błąd.");
      setIsSuccess(false);
    }
  };

  return (
    <div>
      {message && <p className={isSuccess ? "success" : "error"}>{message}</p>}
      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text"
          id="login"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="Login"
          required
        />
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Hasło"
          required
        />
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Imię"
          required
        />
        <Button text="Zarejestruj się" />
      </form>
    </div>
  );
};

export default RegisterForm;
