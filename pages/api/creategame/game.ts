import { NextApiRequest, NextApiResponse } from "next";
import getConnection from "@/lib/db";
import jwt, { JwtPayload } from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Brak tokena w nagłówku" });
  }

  const token = authHeader.split(" ")[1];
  const { code, gameId } = req.body;

  if (!gameId) {
    return res.status(400).json({ error: "Brak gameId w body" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    const username = decoded.username;

    if (!username) {
      return res.status(400).json({ error: "Token nie zawiera użytkownika" });
    }

    const connection = await getConnection();

    // O - owner , g - guest
    const [result] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    const user = result[0];
    if (!user) {
      throw new Error("Użytkownik nie istnieje");
    }

    const userId = user.id;

    await connection.query(
      "INSERT INTO session (`code`, `player_type`, `score`, `user_id`, `quiz_id`) VALUES (?, 'o', '0', ?, ?)",
      [code, userId, gameId]
    );

    connection.release();

    return res.status(200).json({ id: gameId }); // lub np. id nowej sesji
  } catch (error) {
    console.error("Błąd:", error);
    return res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
}
