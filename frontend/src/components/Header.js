import { useState } from "react";
import { Menu, X } from "lucide-react"; // Install: npm install lucide-react
import { Link } from "react-router-dom";
import "./Header.css"; // Import the separate CSS file

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">Resume Builder</h1>

        {/* Desktop Menu */}
        <nav className="navbar">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/features">Features</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        {/* Mobile Menu Toggle */}
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="mobile-menu">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/features">Features</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      )}
    </header>
  );
};

export default Header;
