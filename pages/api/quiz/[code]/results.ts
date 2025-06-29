import type { NextApiRequest, NextApiResponse } from "next";
import getConnection from "@/lib/db";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Metoda niedozwolona" });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Brak tokena autoryzacyjnego" });
  }
  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return res.status(401).json({ error: "Nieprawidłowy token" });
  }

  const sessionCode = req.query.code as string;
  if (!sessionCode) return res.status(400).json({ error: "Brak kodu sesji" });

  const conn = await getConnection();

  try {
    // Pobierz quiz_id na podstawie kodu sesji
    const [sessionRows]: any = await conn.execute(
      `SELECT quiz_id FROM session WHERE code = ? LIMIT 1`,
      [sessionCode]
    );

    if (sessionRows.length === 0) {
      conn.release();
      return res.status(404).json({ error: "Sesja nie znaleziona" });
    }

    const quizId = sessionRows[0].quiz_id;

    // Pobierz wyniki dla quizu tylko dla użytkowników z sesji o danym kodzie
    const [results]: any = await conn.execute(
      `SELECT u.username, s.score, s.created_at
       FROM scores s
       JOIN users u ON s.user_id = u.id
       WHERE s.quiz_id = ?
         AND s.user_id IN (SELECT user_id FROM session WHERE code = ?)
       ORDER BY s.score DESC, s.created_at ASC`,
      [quizId, sessionCode]
    );

    conn.release();
    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    conn.release();
    return res.status(500).json({ error: "Błąd serwera" });
  }
}
