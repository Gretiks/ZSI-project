import Image from "next/image";

const Box = ({ headline, text, img, alt }) => {
  return (
    <div className="box">
      <h3>{headline}</h3>
      <p>{text}</p>
      <div className="box__img">
        <Image src={img} alt={alt} />
      </div>
    </div>
  );
};

export default Box;
