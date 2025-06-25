import getConnection from "@/lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";
import jwt from "jsonwebtoken";

interface User extends RowDataPacket {
  id: number;
  login: string;
  password: string;
  priviliges: string;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { login, password } = req.body;

  try {
    const connection = await getConnection();
    const [results] = await connection.query<User[]>(
      "SELECT users.* FROM users WHERE users.username = ? LIMIT 1",
      [login]
    );
    connection.release();

    const user = results.length > 0 ? results[0] : null;

    if (!user) {
      return res.status(401).json({ error: `Nieprawidłowy login lub hasło` });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: `Nieprawidłowy login lub hasło` });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.status(200).json({ token });
  } catch (error) {
    console.error("Błąd logowania:", error);
    res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
}
