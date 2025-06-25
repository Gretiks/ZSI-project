import { useRouter } from "next/router";
import NavBar from "@/components/navbar/navbar";
import Hero from "@/components/hero/index";
import Content from "@/components/content";
import Footer from "@/components/footer";

const HomePage = () => {
  const router = useRouter();

  return (
    <div className="hero">
      <NavBar />
      <Hero />
      <Content />
      <Footer />
    </div>
  );
};
export default HomePage;
