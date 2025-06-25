// pages/game/[code].tsx

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Footer from "@/components/footer";
import NavBar from "@/components/navbar/navbar";
import Button from "@/components/Reusable/Button";

// Interfejsy opisujące strukturę danych
interface Answer {
  id: number;
  text: string;
}

interface Question {
  id: number;
  text: string;
  type: string;
  time_limit: string | null;
  answers: Answer[];
}

interface Quiz {
  id: number;
  title: string;
  description: string;
}

interface GameData {
  quiz: Quiz;
  questions: Question[];
}

interface UserAnswers {
  [questionId: number]: number;
}

interface PlayerScore {
  username: string;
  score: number;
}

interface ResultData {
  score: number;
  total: number;
  otherScores: PlayerScore[];
}

const GamePage: React.FC = () => {
  const router = useRouter();
  const { code } = router.query;

  // Stany komponentu
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [result, setResult] = useState<ResultData | null>(null);
  const [sendingResult, setSendingResult] = useState(false);

  // Funkcja pomocnicza do konwersji czasu
  const timeStringToSeconds = (timeStr: string | null): number => {
    if (!timeStr) return 30; // Domyślny czas
    const parts = timeStr.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 30;
  };

  // Efekt do pobierania danych gry
  useEffect(() => {
    if (!code || typeof code !== 'string') return;

    const fetchGameByCode = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/quiz/${code}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Nie znaleziono gry o podanym kodzie.");
        }
        const data: GameData = await response.json();
        if (!data.questions || data.questions.length === 0) {
          throw new Error("Ten quiz nie ma żadnych pytań.");
        }
        setGame(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGameByCode();
  }, [code]);

  // Efekt do zarządzania timerem pytania
  useEffect(() => {
    if (!game || result) return; // Nie uruchamiaj timera, jeśli gra się skończyła
    if (currentQuestionIndex >= game.questions.length) return;

    const currentQuestion = game.questions[currentQuestionIndex];
    const seconds = timeStringToSeconds(currentQuestion.time_limit);
    setTimeLeft(seconds);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [game, currentQuestionIndex, result]);

  const handleAnswerSelect = (answerId: number) => {
    if (!game || result) return;
    const questionId = game.questions[currentQuestionIndex].id;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleNext = () => {
    if (!game || result) return;
    if (currentQuestionIndex < game.questions.length - 1) {
      setCurrentQuestionIndex((idx) => idx + 1);
    } else {
      if (!sendingResult) {
        sendResults();
      }
    }
  };

  const sendResults = async () => {
    if (!game || sendingResult) return;

    setSendingResult(true);
    if (timerRef.current) clearInterval(timerRef.current); // Zatrzymaj timer po zakończeniu

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Brak autoryzacji. Zaloguj się, aby zapisać wynik.");

      const answersArray = Object.entries(userAnswers).map(
        ([questionId, answerId]) => ({
          question_id: Number(questionId),
          answer_id: answerId,
        })
      );

      const response = await fetch(`/api/quiz/${code}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: answersArray }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Wystąpił nieznany błąd podczas wysyłania odpowiedzi.");
      }

      setResult({
        score: data.score,
        total: game.questions.length,
        otherScores: data.otherScores || [],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingResult(false);
    }
  };

  // Widok ładowania
  if (loading) {
    return <div className="centered-message">Ładowanie gry...</div>;
  }
  
  // Widok błędu
  if (error) {
    return (
      <div className="bg-gradient">
        <div className="width">
          <NavBar />
          <div className="result">
            <h1>Wystąpił błąd</h1>
            <p className="error-message">{error}</p>
            <Button onClick={() => router.push("/dashboard")} text="Powrót do panelu" />
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  // Widok pustej gry
  if (!game) {
    return <div className="centered-message">Nie udało się załadować danych gry.</div>;
  }

  // Widok wyników
  if (result) {
    return (
      <div className="bg-gradient">
        <div className="width">
          <NavBar />
          <div className="result">
            <h1>Quiz zakończony!</h1>
            <h2 className="your-score">
              Twój wynik: {result.score} / {result.total}
            </h2>

            <div className="leaderboard">
              <h3>Tabela wyników</h3>
              {result.otherScores.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Miejsce</th>
                      <th>Gracz</th>
                      <th>Wynik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.otherScores.map((player, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{player.username}</td>
                        <td>{player.score} / {result.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Jesteś pierwszym graczem, który ukończył ten quiz!</p>
              )}
            </div>
            
            <Button
              onClick={() => router.push("/dashboard")}
              text="Powrót do panelu"
              margin="20px 0 0 0"
            />
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  // Widok wysyłania wyników
  if (sendingResult) {
    return <div className="centered-message">Zapisywanie wyniku...</div>;
  }
  
  const currentQuestion = game.questions[currentQuestionIndex];
  const selectedAnswerId = userAnswers[currentQuestion.id];

  // Główny widok gry
  return (
    <div className="bg-gradient">
      <div className="width">
        <NavBar />
        <div className="game">
          <div className="game-header">
            <h1>{game.quiz.title}</h1>
            <div className="game-info">
              <span>Pytanie {currentQuestionIndex + 1} / {game.questions.length}</span>
              <span className="timer">Pozostały czas: {timeLeft}s</span>
            </div>
          </div>
          
          <div className="question-container">
            <p className="question-text">{currentQuestion.text}</p>
            <ul className="answers-list">
              {currentQuestion.answers.map((answer) => (
                <li
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer.id)}
                  className={selectedAnswerId === answer.id ? "selected" : ""}
                >
                  {answer.text}
                </li>
              ))}
            </ul>
          </div>

          <Button
            text={
              currentQuestionIndex === game.questions.length - 1
                ? "Zakończ i zobacz wyniki"
                : "Następne pytanie"
            }
            onClick={handleNext}
          />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default GamePage;