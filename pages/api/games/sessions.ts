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
    if (!username)
      return res.status(400).json({ error: "Token nie zawiera użytkownika" });

    const connection = await getConnection();

    const [rows] = await connection.query(
      `
  SELECT 
    s.code, 
    s.id as session_id,
    q.title, 
    q.category,
    q.description,
    q.created_at,
    q.updated_at,
    q.access,
    u.username AS author -- autor sesji zamiast autora quizu
  FROM session s
  JOIN quizzes q ON s.quiz_id = q.id
  JOIN users u ON s.user_id = u.id
  `,
      [username]
    );

    connection.release();
    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
}
