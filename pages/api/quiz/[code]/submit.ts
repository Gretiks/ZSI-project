import type { NextApiRequest, NextApiResponse } from "next";
import getConnection from "@/lib/db";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AnswerSubmission {
  question_id: number;
  answer_id: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metoda niedozwolona" });
  }

  // Odczytaj token z nagłówka Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Brak tokena autoryzacyjnego" });
  }

  const token = authHeader.split(" ")[1];

  let username: string | undefined;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    username = decoded.username;

    if (!username) {
      return res
        .status(400)
        .json({ error: "Nieprawidłowy token - brak użytkownika" });
    }
  } catch (err) {
    console.error("Błąd weryfikacji tokena:", err);
    return res.status(401).json({ error: "Nieprawidłowy token" });
  }

  const { code } = req.query;
  if (!code || Array.isArray(code)) {
    return res.status(400).json({ error: "Niepoprawny kod sesji" });
  }

  const { answers } = req.body;
  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: "Niepoprawne dane odpowiedzi" });
  }

  try {
    const connection = await getConnection();

    const [sessionRows] = await connection.query(
      "SELECT quiz_id FROM session WHERE code = ?",
      [code]
    );

    if ((sessionRows as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ error: "Sesja nie znaleziona" });
    }

    const { quiz_id } = (sessionRows as any[])[0];

    const questionIds = answers.map((a: AnswerSubmission) => a.question_id);
    if (questionIds.length === 0) {
      connection.release();
      return res.status(400).json({ error: "Brak odpowiedzi" });
    }

    const [correctAnswersRows] = await connection.query(
      `SELECT id, question_id FROM answers WHERE question_id IN (?) AND is_correct = 1`,
      [questionIds]
    );

    const correctAnswers = correctAnswersRows as {
      id: number;
      question_id: number;
    }[];

    let score = 0;
    answers.forEach((userAnswer: AnswerSubmission) => {
      if (
        correctAnswers.some(
          (correct) =>
            correct.question_id === userAnswer.question_id &&
            correct.id === userAnswer.answer_id
        )
      ) {
        score++;
      }
    });

    const [userRows] = await connection.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if ((userRows as any[]).length === 0) {
      connection.release();
      return res
        .status(404)
        .json({ error: "Użytkownik nie znaleziony w bazie" });
    }

    const user_id = (userRows as any[])[0].id;

    await connection.query(
      `INSERT INTO scores (score, user_id, quiz_id) VALUES (?, ?, ?)`,
      [score, user_id, quiz_id]
    );

    connection.release();

    return res.status(200).json({
      score,
      total: questionIds.length,
    });
  } catch (error) {
    console.error("Błąd zapisu wyniku:", error);
    return res.status(500).json({ error: "Błąd serwera" });
  }
}
