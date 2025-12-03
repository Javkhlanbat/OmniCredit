import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/wallet-history.css';
import { WalletAPI } from '../services/api';
import TokenManager from '../services/auth';

export default function WalletHistory() {
  const navigate = useNavigate();

  const [walletBalance, setWalletBalance] = useState(0);
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!TokenManager.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadWalletData();
  }, [navigate]);

  useEffect(() => {
    filterTransactions();
  }, [activeFilter, allTransactions]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const response = await WalletAPI.getMyWallet();
      setWalletBalance(parseFloat(response.wallet.balance) || 0);
      setAllTransactions(response.wallet.transactions || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading wallet:', error);
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    if (activeFilter === 'all') {
      setFilteredTransactions(allTransactions);
    } else if (activeFilter === 'deposit') {
      setFilteredTransactions(allTransactions.filter(t => t.type === 'deposit' || t.amount > 0));
    } else if (activeFilter === 'withdrawal') {
      setFilteredTransactions(allTransactions.filter(t => t.type === 'withdrawal' || t.type === 'payment' || t.amount < 0));
    }
  };

  const getTransactionIcon = (transaction) => {
    if (transaction.type === 'deposit' || transaction.amount > 0) {
      return { icon: '', class: 'deposit' };
    } else if (transaction.type === 'payment') {
      return { icon: '', class: 'payment' };
    } else {
      return { icon: '', class: 'withdrawal' };
    }
  };

  const getTransactionTitle = (transaction) => {
    if (transaction.type === 'deposit') return 'Данс цэнэглэх';
    if (transaction.type === 'payment') return 'Зээлийн төлбөр';
    if (transaction.type === 'withdrawal') return 'Мөнгө зарцуулах';
    return transaction.description || 'Гүйлгээ';
  };

  if (loading) {
    return (
      <div className="container">
        <div className="wallet-history-container">
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="wallet-history-container">
        <h1 style={{ marginBottom: '32px' }}>Wallet түүх</h1>

        {/* Wallet Balance */}
        <div className="wallet-balance-card">
          <p style={{ opacity: 0.9, fontSize: '14px' }}>Wallet үлдэгдэл</p>
          <h2>₮{walletBalance.toLocaleString()}</h2>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Бүгд
          </button>
          <button
            className={`filter-tab ${activeFilter === 'deposit' ? 'active' : ''}`}
            onClick={() => setActiveFilter('deposit')}
          >
            Орлого
          </button>
          <button
            className={`filter-tab ${activeFilter === 'withdrawal' ? 'active' : ''}`}
            onClick={() => setActiveFilter('withdrawal')}
          >
            Зарлага
          </button>
        </div>

        {/* Transactions */}
        <div className="card">
          <div className="card-body">
            {filteredTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                <h3>Гүйлгээ байхгүй байна</h3>
                <p>Wallet-д гүйлгээ хийгдээгүй байна</p>
              </div>
            ) : (
              filteredTransactions.map((transaction, index) => {
                const iconInfo = getTransactionIcon(transaction);
                const amount = Math.abs(transaction.amount);
                const isPositive = transaction.type === 'deposit' || transaction.amount > 0;
                const date = new Date(transaction.created_at || transaction.date);
                const formattedDate = date.toLocaleDateString('mn-MN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={index} className="transaction-item">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className={`transaction-icon ${iconInfo.class}`}>
                        {iconInfo.icon}
                      </div>
                      <div className="transaction-details">
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {getTransactionTitle(transaction)}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {formattedDate}
                        </div>
                        {transaction.description && (
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {transaction.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`transaction-amount ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? '+' : '-'}₮{amount.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
