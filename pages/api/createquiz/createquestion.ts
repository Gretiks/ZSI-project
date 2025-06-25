// /pages/api/createquiz/createquestion.ts
import { NextApiRequest, NextApiResponse } from "next";
import getConnection from "@/lib/db"; // dostosuj ścieżkę jeśli inna

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { text, type, time_limit = "00:01:00", quiz_id = 1 } = req.body;

  if (!text || !type) return res.status(400).json({ message: "Brakuje wymaganych pól." });

  try {
    const conn = await getConnection();
    const [result]: any = await conn.execute(
      `INSERT INTO questions (text, type, time_limit, quiz_id)
       VALUES (?, ?, ?, ?)`,
      [text, type, time_limit, quiz_id]
    );
    conn.release();

    return res.status(200).json({ questionId: result.insertId });
  } catch (error) {
    console.error("Błąd zapisu pytania:", error);
    return res.status(500).json({ message: "Błąd serwera przy zapisie pytania." });
  }
}
