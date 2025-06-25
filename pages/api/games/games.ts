import { NextApiRequest, NextApiResponse } from "next";
import getConnection from "@/lib/db";
import jwt, { JwtPayload } from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") return res.status(405).end();

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Brak tokena w nagłówku" });
  }

  const token = authHeader.split(" ")[1];

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

    const [games] = await connection.query(
      "SELECT * FROM quizzes WHERE access = 'public' OR author = ?",
      [username]
    );

    connection.release();

    return res.status(200).json(games);
  } catch (error) {
    console.error("Błąd autoryzacji lub pobierania gier:", error);
    return res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
}
