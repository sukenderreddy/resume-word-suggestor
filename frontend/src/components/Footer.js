import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"; // Install using npm install lucide-react
import "./Footer.css"; // Import the separate CSS file

const Footer = () => {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} Resume Builder. All rights reserved.</p>

      {/* Social Icons */}
      <div className="social-icons">
        <a href="#"><Facebook size={24} /></a>
        <a href="#"><Twitter size={24} /></a>
        <a href="#"><Instagram size={24} /></a>
        <a href="#"><Linkedin size={24} /></a>
      </div>
    </footer>
  );
};

export default Footer;
