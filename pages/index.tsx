import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import HomePage from "./homepage";

export default function Main() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="bg-gradient">
      <div className="width">
        <HomePage />
      </div>
    </div>
  );
}
