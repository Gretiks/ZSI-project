import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Button from "../Reusable/Button";
import PopUp from "../popup";

interface Game {
  id?: number; // Quiz ID
  session_id?: string; // Session ID
  code?: string;
  title: string;
  description: string;
  access: string;
  author: string;
}

interface QuizzesProps {
  status?: boolean; // true -> sesje, false -> quizy
}

const Quizzes: React.FC<QuizzesProps> = ({ status }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const endpoint = status ? "/api/games/sessions" : "/api/games/games";

      try {
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Błąd HTTP: ${response.status}`);
        }

        const data: Game[] = await response.json();
        setGames(data);
      } catch (err) {
        setError("Nie udało się pobrać gier. Zaloguj się ponownie.");
        localStorage.removeItem("token");

        setTimeout(() => {
          router.push("/auth");
        }, 5000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status]);
  const handleDeleteGame = async (game: Game, isSession: boolean) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Musisz się zalogować");
      return;
    }

    const gameId = game.code || game.id;
    console.log(gameId);
    if (!gameId) {
      alert("Nieprawidłowe ID gry");
      return;
    }

    if (
      !confirm(`Czy na pewno chcesz usunąć tę ${isSession ? "sesję" : "grę"}?`)
    ) {
      return;
    }

    try {
      const response = await fetch("/api/games/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gameId, isSession }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Błąd podczas usuwania");
      }

      // Po usunięciu odśwież listę gier/sesji
      setGames((prevGames) =>
        prevGames.filter((g) => (g.code || g.id) !== gameId)
      );
    } catch (error: any) {
      alert(`Nie udało się usunąć: ${error.message}`);
    }
  };

  const handleSubmitCode = async (code: string) => {
    const token = localStorage.getItem("token");

    if (!selectedGame) return;

    const gameId = selectedGame.session_id || selectedGame.id;

    try {
      const response = await fetch("/api/creategame/game", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, gameId }),
      });

      if (!response.ok) {
        throw new Error("Nieprawidłowy kod lub błąd serwera");
      }

      router.push(`/game/${code}`);
    } catch (err) {
      console.error(err);
      alert("Nie udało się rozpocząć gry.");
    }
  };

  const handleJoinGame = (code?: string) => {
    if (!code) {
      alert("Brak kodu gry.");
      return;
    }
    router.push(`/game/${code}`);
  };

  if (loading) return <p>Ładowanie gier...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="quizzes">
      <h1>{status ? "Aktywne sesje" : "Dostępne quizy"}</h1>

      {selectedGame && !status && (
        <PopUp
          onClose={() => setSelectedGame(null)}
          onSubmit={(code) => handleSubmitCode(code)}
        />
      )}

      <div className="quizzes__boxes">
        {games.length > 0 ? (
          games.map((game) => (
            <div
              className="quizzes__boxes--box"
              key={game.id || game.session_id}
            >
              {/* {status ? game.session_id : game.id} */}
              <h2>{game.title}</h2>
              {status && game.code && <h3>Kod gry: {game.code}</h3>}
              <p>{game.description}</p>
              <h4>Dostęp: {game.access}</h4>
              <h4>Autor: {game.author}</h4>

              {status ? (
                <>
                  <Button
                    text="Dołącz do gry"
                    font="15px"
                    onClick={() => handleJoinGame(game.code)}
                    bgColor="#FAF5F5"
                  />
                  <Button
                    text="Usuń grę"
                    font="15px"
                    onClick={() => handleDeleteGame(game, true)} // usuwanie sesji
                    bgColor="#FAF5F5"
                  />
                </>
              ) : (
                <>
                  <Button
                    text="Rozpocznij grę"
                    font="15px"
                    onClick={() => setSelectedGame(game)}
                    bgColor="#FAF5F5"
                  />
                  <Button
                    text="Usuń quizz"
                    font="15px"
                    onClick={() => {
                      handleDeleteGame(game, false), console.log(game);
                    }} // usuwanie quizu
                    bgColor="#FAF5F5"
                  />
                </>
              )}
            </div>
          ))
        ) : (
          <p>Brak dostępnych gier.</p>
        )}
      </div>
    </div>
  );
};

export default Quizzes;
