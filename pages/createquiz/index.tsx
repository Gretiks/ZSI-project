import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import NavBar from "@/components/navbar/navbar";
import Footer from "@/components/footer";
import Button from "@/components/Reusable/Button";

type Answer = {
  text: string;
  is_correct: boolean;
};

type QuestionType = "one" | "multi" | "t/f";

type Question = {
  text: string;
  type: QuestionType;
  time_limit: number | null; // liczba sekund lub null
  answers: Answer[];
};

const defaultAnswers = [
  { text: "", is_correct: false },
  { text: "", is_correct: false },
  { text: "", is_correct: false },
  { text: "", is_correct: false },
];

const secondsToHHMMSS = (secs: number) => {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
};

const CreateQuiz = () => {
  const router = useRouter();

  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth");
  }, [router]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        text: "",
        type: "one",
        time_limit: null,
        answers: JSON.parse(JSON.stringify(defaultAnswers)),
      },
    ]);
  };

  const updateQuestion = (qIdx: number, field: keyof Question, value: any) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[qIdx] = { ...newQuestions[qIdx], [field]: value };

      if (field === "type" && value === "t/f") {
        newQuestions[qIdx].answers = [
          { text: "Prawda", is_correct: false },
          { text: "Fałsz", is_correct: false },
        ];
      } else if (
        field === "type" &&
        (value === "one" || value === "multi") &&
        newQuestions[qIdx].answers.length < 4
      ) {
        newQuestions[qIdx].answers = JSON.parse(JSON.stringify(defaultAnswers));
      }

      return newQuestions;
    });
  };

  const updateAnswer = (
    qIdx: number,
    aIdx: number,
    field: keyof Answer,
    value: any
  ) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      const answers = [...newQuestions[qIdx].answers];

      if (field === "is_correct") {
        if (
          newQuestions[qIdx].type === "one" ||
          newQuestions[qIdx].type === "t/f"
        ) {
          answers.forEach((a, i) => (answers[i].is_correct = false));
          answers[aIdx].is_correct = value;
        } else if (newQuestions[qIdx].type === "multi") {
          answers[aIdx].is_correct = value;
        }
      } else {
        answers[aIdx][field] = value;
      }

      newQuestions[qIdx].answers = answers;
      return newQuestions;
    });
  };

  const removeQuestion = (qIdx: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIdx));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setMessage("Podaj tytuł quizu");
      return;
    }

    if (questions.length === 0) {
      setMessage("Dodaj przynajmniej jedno pytanie");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Brak tokena. Zaloguj się ponownie.");
        setLoading(false);
        return;
      }

      // Mapujemy pytania i konwertujemy time_limit z sekund do HH:MM:SS lub "00:00:00"
      const mappedQuestions = questions.map((q) => ({
        text: q.text,
        type: q.type,
        time_limit:
          q.time_limit === null || q.time_limit < 0
            ? "00:00:00"
            : secondsToHHMMSS(q.time_limit),
        answers: q.answers,
      }));

      const response = await fetch("/api/createquiz/createquiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          category,
          description,
          access: "public",
          questions: mappedQuestions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessage(errorData.error || "Coś poszło nie tak podczas zapisu");
      } else {
        setMessage("Quiz został zapisany pomyślnie");
        setTitle("");
        setCategory("");
        setDescription("");
        setQuestions([]);
      }
    } catch (error) {
      setMessage("Coś poszło nie tak podczas zapisu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient">
      <div className="width">
        <NavBar />
        <div className="createquiz">
          <h1>Stwórz nowy quiz</h1>
          <input
            type="text"
            placeholder="Tytuł quizu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />

          <input
            type="text"
            placeholder="Kategoria quizu"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          />

          <textarea
            placeholder="Opis quizu"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />

          <Button onClick={addQuestion} text="Dodaj pytanie" margin="auto" />
        </div>
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="createquiz__question">
            <div className="createquiz__question--box">
              <input
                type="text"
                placeholder="Treść pytania"
                className="w-full p-2 mb-2 rounded border text-black"
                value={q.text}
                onChange={(e) => updateQuestion(qIdx, "text", e.target.value)}
                disabled={loading}
              />

              <select
                value={q.type}
                onChange={(e) =>
                  updateQuestion(qIdx, "type", e.target.value as QuestionType)
                }
                className="w-full p-2 mb-4 rounded border text-black"
                disabled={loading}
              >
                <option value="one">Odpowiedź pojedyncza</option>
                <option value="multi">Wielokrotny wybór</option>
                <option value="t/f">Prawda / Fałsz</option>
              </select>
            </div>
            {/* Pole time_limit */}
            <div className="mb-4 flex items-center space-x-2">
              <label
                className="text-sm font-medium text-gray-700"
                htmlFor={`time_limit-${qIdx}`}
              >
                Limit czasu (sekundy):
              </label>
              <input
                id={`time_limit-${qIdx}`}
                type="number"
                min={0}
                placeholder="np. 30"
                value={q.time_limit ?? ""}
                onChange={(e) =>
                  updateQuestion(
                    qIdx,
                    "time_limit",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                className="w-24 p-2 border rounded text-black"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              {q.answers.map((a, aIdx) => (
                <div key={aIdx} className="flex items-center space-x-2">
                  {q.type === "one" || q.type === "t/f" ? (
                    <input
                      type="radio"
                      name={`question-${qIdx}`}
                      checked={a.is_correct}
                      onChange={() =>
                        updateAnswer(qIdx, aIdx, "is_correct", true)
                      }
                      disabled={loading}
                    />
                  ) : (
                    <input
                      type="checkbox"
                      checked={a.is_correct}
                      onChange={(e) =>
                        updateAnswer(qIdx, aIdx, "is_correct", e.target.checked)
                      }
                      disabled={loading}
                    />
                  )}

                  <input
                    type="text"
                    placeholder={`Odpowiedź ${aIdx + 1}`}
                    value={a.text}
                    onChange={(e) =>
                      updateAnswer(qIdx, aIdx, "text", e.target.value)
                    }
                    className="flex-grow p-1 border rounded text-black"
                    disabled={loading || q.type === "t/f"}
                  />
                </div>
              ))}
            </div>
            <Button
              onClick={() => removeQuestion(qIdx)}
              text="Usuń pytanie"
              bgColor="#FF9999"
            />
          </div>
        ))}

        {message && (
          <p className="mt-6 text-center text-sm text-gray-700">{message}</p>
        )}

        <div className="mt-6 flex justify-center">
          <Button
            // margin="0"
            onClick={handleSubmit}
            text={loading ? "Zapisywanie..." : "Zapisz quiz"}
          />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default CreateQuiz;
