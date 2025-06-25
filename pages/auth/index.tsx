import { useState, useEffect } from "react";
import LoginForm from "../../components/auth/loginForm";
import RegisterForm from "../../components/auth/registerForm";
import Footer from "@/components/footer";
import NavBar from "@/components/navbar/navbar";
import Button from "@/components/Reusable/Button";
import router from "next/router";

const AuthPage = () => {
  const [isLogin, setIsLog] = useState<boolean>(true);
  const [isRegister, setIsRegister] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, []);

  return (
    <div className="bg-gradient">
      <div className="width">
        <div className="auth">
          <NavBar />
          <div className="auth__box">
            <div>
              <h1>{isLogin ? "Logowanie" : "Rejestracja"}</h1>
              {isLogin ? <LoginForm /> : <RegisterForm />}
              <Button
                bgColor="#F8F5FA"
                text={isLogin ? "Rejestracja" : "Logowanie"}
                onClick={() => {
                  setIsLog(!isLogin);
                  setIsRegister(!isRegister);
                }}
              />
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
