import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import background from "../assets/front_landscape.jpg";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div
      className="home-wrapper"
      style={{ backgroundImage: `url(${background})` }}
    >
      <header className="home-header">
        <img src={logo} alt="Sea Merkado Logo" className="home-logo" />
      </header>

      <main className="home-main">
        <div className="home-content">
          <h1 className="home-title">e-Sea-Merkado</h1>
          <p className="home-subtitle">Bringing Fresh Fish to Your Fingertips!</p>
        </div>
        
        <button className="get-started-btn" onClick={() => navigate("/role")}>
          Get Started
        </button>
      </main>
    </div>
  );
};

export default Home;