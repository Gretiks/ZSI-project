import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Footer from "@/components/footer";
import NavBar from "@/components/navbar/navbar";
import Button from "@/components/Reusable/Button";

interface Answer {
  id: number;
  text: string;
  is_correct: boolean;
  question_id: number;
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

const GamePage: React.FC = () => {
  const router = useRouter();
  const { code } = router.query;

  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [result, setResult] = useState<{ score: number; total: number } | null>(
    null
  );
  const [sendingResult, setSendingResult] = useState(false);

  const timeStringToSeconds = (timeStr: string | null) => {
    if (!timeStr) return 30;
    const parts = timeStr.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 1) return parts[0];
    return 30;
  };

  useEffect(() => {
    if (!code) return;

    const fetchGameByCode = async () => {
      try {
        const response = await fetch(`/api/quiz/${code}`);
        if (!response.ok) throw new Error("Nie znaleziono gry");
        const data: GameData = await response.json();
        setGame(data);
      } catch {
        setError("Nie udało się załadować gry.");
      } finally {
        setLoading(false);
      }
    };

    fetchGameByCode();
  }, [code]);

  useEffect(() => {
    if (!game) return;
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
  }, [game, currentQuestionIndex]);

  const handleAnswerSelect = (answerId: number) => {
    if (!game) return;
    const questionId = game.questions[currentQuestionIndex].id;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleNext = () => {
    if (!game) return;
    if (currentQuestionIndex < game.questions.length - 1) {
      setCurrentQuestionIndex((idx) => idx + 1);
    } else {
      sendResults();
    }
  };

  const sendResults = async () => {
    if (!game) return;

    setSendingResult(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Brak tokena");

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

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Brak autoryzacji. Zaloguj się ponownie.");
        }
        throw new Error("Błąd podczas wysyłania odpowiedzi");
      }

      const data = await response.json();
      setResult({ score: data.score, total: game.questions.length });
    } catch (err: any) {
      setError(err.message || "Błąd podczas wysyłania wyników.");
    } finally {
      setSendingResult(false);
    }
  };

  if (loading) return <p>Ładowanie gry...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!game) return <p>Brak danych gry</p>;

  if (result) {
    return (
      <div className="bg-gradient">
        <div className="width">
          <NavBar />
          <div className="result">
            <h1>Wynik</h1>
            <p>
              Twój wynik: {result.score} / {result.total}
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              text="Powrót do listy gier"
            />
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  if (currentQuestionIndex >= game.questions.length) {
    return <p>Trwa wysyłanie wyników...</p>;
  }

  const currentQuestion = game.questions[currentQuestionIndex];
  const selectedAnswerId = userAnswers[currentQuestion.id];

  return (
    <div className="bg-gradient">
      <div className="width">
        <NavBar />
        <div className="game">
          <h1>{game.quiz.title}</h1>
          <div>
            <p>{currentQuestion.text}</p>
            <p>Czas do końca: {timeLeft}s</p>
            <h3>
              Pytanie {currentQuestionIndex + 1} / {game.questions.length}
            </h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {currentQuestion.answers.map((answer) => (
                <li
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer.id)}
                  style={{
                    backgroundColor:
                      selectedAnswerId === answer.id ? "#18471f" : "",

                    color: selectedAnswerId === answer.id ? "white" : "",
                  }}
                >
                  {answer.text}
                </li>
              ))}
            </ul>

            <Button
              text={
                currentQuestionIndex === game.questions.length - 1
                  ? "Zakończ"
                  : "Następne"
              }
              margin="10px 0 0 0"
              bgColor={
                selectedAnswerId === undefined || sendingResult
                  ? "#ccc"
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                if (selectedAnswerId !== undefined && !sendingResult) {
                  handleNext();
                }
              }}
            />
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default GamePage;
