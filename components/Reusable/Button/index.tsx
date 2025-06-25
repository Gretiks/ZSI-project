import React from "react";

interface ButtonProps {
  text: string;
  margin?: string;
  href?: string;
  font?: string;
  bgColor?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const Button: React.FC<ButtonProps> = ({
  text,
  margin,
  href,
  font,
  bgColor,
  onClick,
}) => {
  const buttonStyle = {
    margin: margin,
    fontSize: font,
  };

  const buttonColor = {
    backgroundColor: bgColor === undefined ? "#51FF6B" : bgColor,
  };

  return (
    <a
      className="custom-link"
      href={href}
      rel="noreferrer"
      style={buttonStyle}
      onClick={onClick}
    >
      <button className="custom-button" style={buttonColor}>
        {text}
      </button>
    </a>
  );
};

export default Button;
