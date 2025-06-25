import getConnection from "@/lib/db";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { login, password, email } = req.body;

  if (!login || !password || !email) {
    return res.status(400).json({ error: "Wszystkie pola są wymagane." });
  }

  try {
    const connection = await getConnection();

    const [existingLogin] = await connection.query(
      "SELECT * FROM users WHERE username = ? LIMIT 1",
      [login]
    );

    if (Array.isArray(existingLogin) && existingLogin.length > 0) {
      connection.release();
      return res
        .status(400)
        .json({ error: "Użytkownik z tym loginem już istnieje." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [loginResult] = await connection.query(
      "INSERT INTO users (username, password, email, last_login, created_at) VALUES (?, ?, ?, NOW(), NOW())",
      [login, hashedPassword, email]
    );

    const insertedId = (loginResult as any).insertId;

    connection.release();

    res.status(201).json({ message: "Zarejestrowano pomyślnie." });
  } catch (error) {
    console.error("Błąd rejestracji:", error);
    res.status(500).json({ error: `Wewnętrzny błąd serwera: ${error}` });
  }
}
