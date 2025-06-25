import Image from "next/image";
import imageLeft from "../../pages/assets/boxleft.svg";
import imageRight from "../../pages/assets/boxright.svg";

import Box from "../Reusable/box";

const Content = () => {
  return (
    <div className="content">
      <div className="content__text">
        <h2>Gotowy na quizową rewolucję?</h2>
        <p>
          Dołącz do tysięcy użytkowników, którzy uczą się i bawią razem z Quizo!
        </p>
      </div>
      <div className="content__container">
        <Box
          headline="Nauka przez zabawę"
          text="Zdobywaj wiedzę w angażujący sposób dzięki interaktywnym quizom."
          img={imageLeft}
          alt={undefined}
        />
        <Box
          headline="Graj kiedy chcesz"
          text="Rozpoczynaj quizy w klasie, online lub ze znajomymi bez ograniczeń."
          img={imageRight}
          alt={undefined}
        />
      </div>
    </div>
  );
};

export default Content;
