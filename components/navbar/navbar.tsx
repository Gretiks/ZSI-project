import { useEffect, useState } from "react";
import Image from "next/image";
import Logo from "../../pages/assets/logo.svg";
import Button from "../Reusable/Button";
import Link from "next/link";

const NavBar = () => {
  const [log, setLog] = useState<Boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setLog(true);
    }
  }, []);

  return (
    <div className="navbar">
      <div className="navbar__left">
        <div className="navbar__left--logo">
          <Image src={Logo} alt="logo Quizo" width={40} />
          <h2>Quizo</h2>
        </div>
        <ul>
          <Link href="/">
            <li>Strona główna</li>
          </Link>
          <li>O nas</li>
          <li>Kontakt</li>
        </ul>
      </div>
      <div className="navbar__right">
        <ul>
          <Link href="/dashboard">
            <li>{log && "Dashboard"}</li>
          </Link>
          <span />
          <Link href="/auth">
            <li
              onClick={() =>
                log &&
                (() => {
                  localStorage.removeItem("token");
                  setLog(false);
                })()
              }
            >
              {log ? "Wyloguj się" : "Zaloguj się"}
            </li>
          </Link>
        </ul>
      </div>
    </div>
  );
};

export default NavBar;
