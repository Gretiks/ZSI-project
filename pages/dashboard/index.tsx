import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Footer from "@/components/footer";
import NavBar from "@/components/navbar/navbar";
import Button from "@/components/Reusable/Button";
import Quizzes from "@/components/quizzes";

const DashboardPage = () => {
  const router = useRouter();
  const [toggleDashboard, setToggleDashboard] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
    }
  }, []);

  return (
    <div className="bg-gradient">
      <div className="width">
        <NavBar />
        <Quizzes status={toggleDashboard} />
        <div className="dashboardButtons">
          <Button
            text={toggleDashboard ? "Dostępne quizy" : "Aktualne gry"}
            onClick={() => {
              setToggleDashboard((t) => !t);
            }}
            bgColor="#FAF5F5"
          />
          <Button
            text="Dodaj grę"
            onClick={() => {
              router.push("/createquiz");
            }}
            bgColor="#FAF5F5"
          />
        </div>
        <Footer />
      </div>
    </div>
  );
};
export default DashboardPage;
