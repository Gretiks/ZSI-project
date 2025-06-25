import type { NextApiRequest, NextApiResponse } from "next";
import getConnection from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { code } = req.query;

  if (!code || Array.isArray(code)) {
    return res.status(400).json({ error: "Niepoprawny kod sesji" });
  }

  try {
    const connection = await getConnection();

    // 1. Szukamy sesji po kodzie, by dostać quiz_id
    const [sessionRows] = await connection.query(
      "SELECT quiz_id FROM session WHERE code = ?",
      [code]
    );

    if ((sessionRows as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ error: "Sesja nie znaleziona" });
    }

    const { quiz_id } = (sessionRows as any[])[0];

    // 2. Pobieramy quiz po quiz_id
    const [quizRows] = await connection.query(
      "SELECT id, title, description FROM quizzes WHERE id = ?",
      [quiz_id]
    );

    if ((quizRows as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ error: "Quiz nie znaleziony" });
    }

    const quiz = (quizRows as any[])[0];

    // 3. Pobieramy pytania do quizu
    const [questions] = await connection.query(
      "SELECT id, text, type, time_limit FROM questions WHERE quiz_id = ?",
      [quiz_id]
    );

    // 4. Pobieramy odpowiedzi do każdego pytania
    const questionIds = (questions as any[]).map((q) => q.id);
    let answers: any[] = [];

    if (questionIds.length > 0) {
      const [answersRows] = await connection.query(
        `SELECT id, text, is_correct, question_id FROM answers WHERE question_id IN (?)`,
        [questionIds]
      );
      answers = answersRows as any[];
    }

    connection.release();

    // 5. Składamy odpowiedź — łączymy pytania z odpowiedziami
    const questionsWithAnswers = (questions as any[]).map((q) => ({
      ...q,
      answers: answers.filter((a) => a.question_id === q.id),
    }));

    return res.status(200).json({
      quiz,
      questions: questionsWithAnswers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Błąd serwera" });
  }
}
