import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">OmniCredit</div>
            <p>Монголын хамгийн хялбар бөгөөд найдвартай зээлийн үйлчилгээ.</p>
          </div>
          <div className="footer-section">
            <h4>Үйлчилгээ</h4>
            <ul className="footer-links">
              <li><Link to="/zeelhuudas">Зээл авах</Link></li>
              <li><Link to="/purchase-loan">Худалдан авалтын зээл</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Тусламж</h4>
            <ul className="footer-links">
              <li><Link to="/aboutus">Бидний тухай</Link></li>
              <li><Link to="/faq">Түгээмэл асуулт</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copyright">
            <span>© 2025 OmniCredit. Бүх эрх хуулиар хамгаалагдсан.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
