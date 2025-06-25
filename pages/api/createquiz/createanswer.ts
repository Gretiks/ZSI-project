// /pages/api/createquiz/createanswer.ts
import { NextApiRequest, NextApiResponse } from "next";
import getConnection from "@/lib/db"; // dostosuj ścieżkę jeśli inna

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { text, is_correct, question_id } = req.body;

  if (!text || typeof is_correct === "undefined" || !question_id)
    return res.status(400).json({ message: "Brakuje wymaganych pól." });

  try {
    const conn = await getConnection();
    await conn.execute(
      `INSERT INTO answers (text, is_correct, question_id)
       VALUES (?, ?, ?)`,
      [text, is_correct, question_id]
    );
    conn.release();

    return res.status(200).json({ message: "Dodano odpowiedź." });
  } catch (error) {
    console.error("Błąd zapisu odpowiedzi:", error);
    return res.status(500).json({ message: "Błąd serwera przy zapisie odpowiedzi." });
  }
}
