import Image from "next/image";
import Logo from "../../pages/assets/logo.svg";

const Footer = () => {
  return (
    <div className="footer">
      <div className="footer__left">
        <Image src={Logo} alt="logo Quizo" width={40} />
        <h2>Quizo</h2>
      </div>
      <div className="footer__right"></div>
    </div>
  );
};

export default Footer;
