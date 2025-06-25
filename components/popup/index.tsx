import React, { useState } from "react";
import Button from "../Reusable/Button";

interface PopUpProps {
  onClose: () => void;
  onSubmit: (code: string) => void;
}

const PopUp: React.FC<PopUpProps> = ({ onClose, onSubmit }) => {
  const [gameCode, setGameCode] = useState("");

  const handleSubmit = () => {
    if (gameCode.trim()) {
      onSubmit(gameCode.trim());
    }
  };

  return (
    <div className="quizzes__popup">
      <h2>Wprowadź kod gry</h2>
      <input
        type="text"
        value={gameCode}
        onChange={(e) => setGameCode(e.target.value)}
        placeholder="np. ABC123"
      />
      <div className="popup__buttons">
        <Button text="Dołącz" onClick={handleSubmit} font="14px" />
        <Button text="Anuluj" onClick={onClose} font="14px" bgColor="#eee" />
      </div>
    </div>
  );
};

export default PopUp;
