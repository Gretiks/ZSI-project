import Button from "../Reusable/Button";
import Image from "next/image";
import image from "../../pages/assets/herobg.svg";

const Hero = () => {
  return (
    <div className="heroContent">
      <div className="heroContent__text">
        <h1>Witamy w Quizo, najlepszym doświadczeniu quizowym!</h1>
        <Button
          text={"Dołącz do społeczności"}
          margin={undefined}
          href="/auth"
          font="40px"
          bgColor={undefined}
        />
      </div>
      <Image src={image} alt="hero desktop UI image" />
    </div>
  );
};

export default Hero;
