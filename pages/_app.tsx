import "./global.sass";
import type { AppProps } from "next/app";
// import "./styles/box_style.sass";
import "./styles/auth_style.sass";
import "./styles/homepage_style.sass";
import "./styles/navbar_style.sass";
import "./styles/button_style.sass";
import "./styles/content_style.sass";
import "./styles/box_style.sass";
import "./styles/footer_style.sass";
import "./styles/login_style.sass";
import "./styles/quizzes_style.sass";
import "./styles/game_style.sass";
import "./styles/createquiz_style.sass";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
