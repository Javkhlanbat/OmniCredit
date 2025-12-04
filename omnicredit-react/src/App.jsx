import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/common/Navigation';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import FAQ from './pages/FAQ';
import AboutUs from './pages/AboutUs';
import LoanCalculator from './pages/LoanCalculator';
import Profile from './pages/Profile';
import PaymentHistory from './pages/PaymentHistory';
import MyLoans from './pages/MyLoans';
import PurchaseLoan from './pages/PurchaseLoan';
import Payment from './pages/Payment';
import LoanApplication from './pages/LoanApplication';
import Admin from './pages/Admin';
import WalletHistory from './pages/WalletHistory';

// Import CSS
import './styles/variables.css';
import './styles/base.css';
import './styles/navigation.css';
import './styles/buttons.css';
import './styles/cards.css';
import './styles/forms.css';
import './styles/footer.css';

// Import Analytics (automatically initializes tracking)
import './services/analytics';

function App() {
  return (
    <Router>
      <div className="app">
        <div className="container">
          <Navigation />
        </div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Placeholder routes - to be implemented */}
          <Route path="/zeelhuudas" element={<LoanCalculator />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/my-loans" element={<MyLoans />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/purchase-loan" element={<PurchaseLoan />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/paymenthistory" element={<PaymentHistory />} />
          <Route path="/application" element={<LoanApplication />} />
          <Route path="/application-new" element={<LoanApplication />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/wallet-history" element={<WalletHistory />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
