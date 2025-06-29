// pages/api/games/delete.ts

import type { NextApiRequest, NextApiResponse } from "next";
import getConnection from "@/lib/db";
import jwt, { JwtPayload } from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Metoda niedozwolona" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Brak tokena autoryzacyjnego" });
  }

  const token = authHeader.split(" ")[1];
  let username: string;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    username = decoded.username!;
    if (!username) throw new Error("Brak użytkownika w tokenie");
  } catch {
    return res.status(401).json({ error: "Nieprawidłowy token" });
  }

  const { gameId, isSession } = req.body;
  if (!gameId) return res.status(400).json({ error: "Brak ID gry" });

  const connection = await getConnection();

  try {
    if (isSession) {
      // ✅ Sprawdź, czy użytkownik jest autorem quizu przypisanego do tej sesji
      console.log(gameId, username);
      const [sessionRows] = await connection.query(
        `SELECT session.id
          FROM session
          JOIN users ON session.user_id = users.id
          WHERE session.code = ? AND users.username = ?;
          `,
        [gameId, username]
      );

      if ((sessionRows as any[]).length === 0) {
        connection.release();
        console.log("Tutaj #1");
        return res
          .status(403)
          .json({ error: "Brak uprawnień do usunięcia sesji" });
      }
      console.log(gameId);
      // Usuń sesję
      await connection.query("DELETE FROM session WHERE code = ?", [gameId]);
    } else {
      // Sprawdź, czy użytkownik jest autorem quizu
      const [quizRows] = await connection.query(
        "SELECT id FROM quizzes WHERE id = ? AND author = ?",
        [gameId, username]
      );

      if ((quizRows as any[]).length === 0) {
        connection.release();
        return res
          .status(403)
          .json({ error: "Brak uprawnień do usunięcia quizu" });
      }

      // Usuń quiz
      await connection.query("DELETE FROM quizzes WHERE id = ?", [gameId]);
    }

    connection.release();
    return res.status(200).json({ message: "Usunięto pomyślnie" });
  } catch (error) {
    connection.release();
    console.error(error);
    return res.status(500).json({ error: "Błąd serwera" });
  }
}
