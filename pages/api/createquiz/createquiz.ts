import type { NextApiRequest, NextApiResponse } from "next";
import getConnection from "@/lib/db";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AnswerInput {
  text: string;
  is_correct: boolean;
}

interface QuestionInput {
  text: string;
  type: string; // "one", "multi", "t/f"
  time_limit: string; // "HH:MM:SS"
  answers: AnswerInput[];
}

interface CreateQuizBody {
  title: string;
  category: string;
  description: string;
  access: string; // "public" | "private"
  questions: QuestionInput[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metoda niedozwolona" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Brak tokena autoryzacyjnego" });
  }
  const token = authHeader.split(" ")[1];

  let username: string;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    username = decoded.username!;
    if (!username) {
      return res
        .status(400)
        .json({ error: "Nieprawidłowy token – brak username" });
    }
  } catch (err) {
    console.error("Błąd weryfikacji tokena:", err);
    return res.status(401).json({ error: "Nieprawidłowy token" });
  }

  const { title, category, description, access, questions } =
    req.body as CreateQuizBody;

  if (
    !title ||
    !category ||
    !description ||
    !access ||
    !Array.isArray(questions) ||
    questions.length === 0
  ) {
    return res.status(400).json({ error: "Brak wymaganych danych" });
  }

  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // 1. Wstaw quiz
    const [quizResult]: any = await connection.execute(
      `INSERT INTO quizzes (title, category, description, access, author, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [title, category, description, access, username]
    );

    const quizId = quizResult.insertId;

    // 2. Wstaw pytania i odpowiedzi
    for (const question of questions) {
      const [questionResult]: any = await connection.execute(
        `INSERT INTO questions (text, type, time_limit, quiz_id)
         VALUES (?, ?, ?, ?)`,
        [question.text, question.type, question.time_limit, quizId]
      );

      const questionId = questionResult.insertId;

      for (const answer of question.answers) {
        await connection.execute(
          `INSERT INTO answers (text, is_correct, question_id)
           VALUES (?, ?, ?)`,
          [answer.text, answer.is_correct ? 1 : 0, questionId]
        );
      }
    }

    await connection.commit();
    connection.release();

    return res.status(200).json({ quizId });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Błąd zapisu quizu:", error);
    return res.status(500).json({ error: "Błąd serwera" });
  }
}
