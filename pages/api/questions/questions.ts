// pages/api/questions.ts
import type { NextApiRequest, NextApiResponse } from "next";
import getConnection from "@/lib/db"; // Upewnij się, że ścieżka jest poprawna

type QuestionType = "one" | "multi" | "t/f";

interface QuestionRequest {
  question: string;
  type: QuestionType;
  quiz_id: number;
  correct?: boolean; // tylko dla t/f
  answers?: { text: string; isCorrect: boolean }[]; // tylko dla one, multi
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { question, type, quiz_id, correct, answers }: QuestionRequest = req.body;

  if (!question || !type || !quiz_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const time_limit = "00:01:00"; // 1 minuta

  let conn;
  try {
    conn = await getConnection();
    await conn.beginTransaction();

    // Insert into questions
    const [questionResult]: any = await conn.execute(
      `INSERT INTO questions (text, type, time_limit, quiz_id) VALUES (?, ?, ?, ?)`,
      [question, type, time_limit, quiz_id]
    );

    const questionId = questionResult.insertId;

    if (type === "one" || type === "multi") {
      if (!answers || answers.length === 0) {
        throw new Error("Brak odpowiedzi dla pytania typu 'one' lub 'multi'");
      }

      const insertPromises = answers.map((answer) =>
        conn.execute(
          `INSERT INTO answers (text, is_correct, question_id) VALUES (?, ?, ?)`,
          [answer.text, answer.isCorrect ? 1 : 0, questionId]
        )
      );

      await Promise.all(insertPromises);
    }

    if (type === "t/f") {
      if (correct === undefined) {
        throw new Error("Brak wartości 'correct' dla pytania typu 't/f'");
      }

      const trueText = "Prawda";
      const falseText = "Fałsz";

      await conn.execute(
        `INSERT INTO answers (text, is_correct, question_id) VALUES (?, ?, ?)`,
        [trueText, correct ? 1 : 0, questionId]
      );

      await conn.execute(
        `INSERT INTO answers (text, is_correct, question_id) VALUES (?, ?, ?)`,
        [falseText, correct ? 0 : 1, questionId]
      );
    }

    await conn.commit();
    res.status(200).json({ message: "Pytanie i odpowiedzi zostały zapisane." });
  } catch (error: any) {
    if (conn) await conn.rollback();
    console.error("Błąd:", error);
    res.status(500).json({ message: "Błąd serwera", error: error.message });
  } finally {
    if (conn) conn.release();
  }
}
