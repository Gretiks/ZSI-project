// pages/api/quiz/[code]/submit.ts

import type { NextApiRequest, NextApiResponse } from "next";
import getConnection from "@/lib/db";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AnswerSubmission {
  question_id: number;
  answer_id: number;
}

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  score: number;
  total: number;
  otherScores: { username: string; score: number }[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metoda niedozwolona" });
  }

  // 1. Weryfikacja tokena autoryzacyjnego
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
        .json({ error: "Nieprawidłowy token - brak nazwy użytkownika" });
    }
  } catch (err) {
    console.error("Błąd weryfikacji tokena:", err);
    return res.status(401).json({ error: "Nieprawidłowy lub nieważny token" });
  }

  // 2. Walidacja danych wejściowych
  const { code } = req.query;
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Niepoprawny kod sesji" });
  }

  const { answers } = req.body;
  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: "Niepoprawny format danych odpowiedzi" });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction(); // Rozpocznij transakcję

    // 3. Pobranie quiz_id na podstawie kodu sesji
    const [sessionRows] = await connection.execute(
      "SELECT quiz_id FROM session WHERE code = ?",
      [code]
    );

    const sessions = sessionRows as any[];
    if (sessions.length === 0) {
      await connection.rollback(); // Wycofaj transakcję
      return res.status(404).json({ error: "Sesja o podanym kodzie nie została znaleziona" });
    }
    const { quiz_id } = sessions[0];

    // 4. Obliczenie wyniku
    if (answers.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: "Przesłano pustą listę odpowiedzi" });
    }
    const questionIds = answers.map((a: AnswerSubmission) => a.question_id);

    const [correctAnswersRows] = await connection.execute(
      `SELECT id, question_id FROM answers WHERE question_id IN (?) AND is_correct = 1`,
      [questionIds]
    );

    const correctAnswers = correctAnswersRows as { id: number; question_id: number }[];
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

    // 5. Pobranie ID użytkownika
    const [userRows] = await connection.execute(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    const users = userRows as any[];
    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Użytkownik powiązany z tokenem nie istnieje w bazie" });
    }
    const { id: user_id } = users[0];

    // ====================== KLUCZOWA ZMIANA ======================
    // 6. Sprawdź, czy wynik już istnieje, a następnie zaktualizuj lub wstaw nowy.
    
    // Krok 6a: Sprawdź, czy istnieje już wpis
    const [existingScoreRows] = await connection.execute(
        "SELECT id FROM scores WHERE user_id = ? AND quiz_id = ?",
        [user_id, quiz_id]
    );

    const existingScores = existingScoreRows as any[];

    if (existingScores.length > 0) {
        // Krok 6b: Jeśli wynik istnieje, zaktualizuj go
        await connection.execute(
            "UPDATE scores SET score = ?, created_at = NOW() WHERE user_id = ? AND quiz_id = ?",
            [score, user_id, quiz_id]
        );
    } else {
        // Krok 6c: Jeśli wynik nie istnieje, wstaw nowy
        await connection.execute(
            "INSERT INTO scores (score, user_id, quiz_id, created_at) VALUES (?, ?, ?, NOW())",
            [score, user_id, quiz_id]
        );
    }
    // ==============================================================

    // 7. Pobranie wszystkich wyników dla danego quizu
    const [allScoresRows] = await connection.execute(
      `SELECT s.score, u.username 
       FROM scores s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.quiz_id = ? 
       ORDER BY s.score DESC, s.created_at ASC`,
      [quiz_id]
    );

    await connection.commit(); // Zatwierdź transakcję

    // 8. Zwrócenie pełnej odpowiedzi
    return res.status(200).json({
      score,
      total: questionIds.length,
      otherScores: allScoresRows as { username: string; score: number }[],
    });

  } catch (error) {
    // Jeśli wystąpił błąd, wycofaj wszystkie zmiany w transakcji
    if (connection) {
        await connection.rollback();
    }
    console.error("Błąd serwera podczas zapisu wyniku:", error);
    return res.status(500).json({ error: "Wewnętrzny błąd serwera. Spróbuj ponownie później." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}