import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TokenManager, LoansAPI } from '../services/api';
import { showToast } from '../services/utils';
import '../styles/loan-calculator.css';

const LoanCalculator = () => {
  const navigate = useNavigate();

  const [amount, setAmount] = useState(1500000);
  const [rate, setRate] = useState(3);
  const [term, setTerm] = useState(12);

  const [activeTab, setActiveTab] = useState('conditions');
  const [activeChartTab, setActiveChartTab] = useState('payment');

  const [schedule, setSchedule] = useState([]);
  const [kpis, setKpis] = useState({ payment: 0, interest: 0, total: 0 });
  const [geomPay, setGeomPay] = useState(null);
  const [geomBal, setGeomBal] = useState(null);

  const paymentsCanvasRef = useRef(null);
  const balanceCanvasRef = useRef(null);
  const tipRef = useRef(null);

  const fmt = new Intl.NumberFormat('mn-MN');
  const money = (n) => '₮' + fmt.format(Math.round(n || 0));
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  const computeSchedule = (P, ratePct, n) => {
    P = Math.max(10000, +P || 0);
    n = Math.max(1, Math.floor(+n || 0));
    const r = (+ratePct || 0) / 100;
    let payment, bal = P, sch = [];

    if (r === 0) {
      payment = P / n;
      for (let m = 1; m <= n; m++) {
        const interest = 0, principal = payment;
        bal = Math.max(0, bal - principal);
        sch.push({ m, interest, principal, payment, bal });
      }
    } else {
      payment = P * r / (1 - Math.pow(1 + r, -n));
      for (let m = 1; m <= n; m++) {
        const interest = bal * r;
        const principal = Math.min(payment - interest, bal);
        bal = Math.max(0, bal - principal);
        sch.push({ m, interest, principal, payment, bal });
      }
    }

    return {
      payment,
      totalInterest: sch.reduce((s, x) => s + x.interest, 0),
      totalPay: sch.reduce((s, x) => s + x.payment, 0),
      schedule: sch
    };
  };

  const clearCanvas = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const drawPayments = (schedule, hover = -1) => {
    const canvas = paymentsCanvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    clearCanvas(ctx);

    const W = canvas.width, H = canvas.height;
    const margin = 40, innerW = W - margin * 2, innerH = H - margin * 2;

    ctx.strokeStyle = '#e5e7eb';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(margin, margin, innerW, innerH);
    ctx.setLineDash([]);

    const bars = Math.min(12, schedule.length);
    const maxPay = Math.max(...schedule.map(s => s.payment));
    const slot = innerW / bars, bw = slot * 0.72, gap = slot * 0.28;

    ctx.font = '12px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < bars; i++) {
      const s = schedule[i];
      const x = margin + i * slot + gap / 2;
      const yB = H - margin;
      const totalH = innerH * (s.payment / maxPay);
      const intH = innerH * (s.interest / maxPay);
      const prinH = Math.max(0, totalH - intH);

      if (i === hover) {
        ctx.fillStyle = 'rgba(148,163,184,.35)';
        ctx.fillRect(x - gap / 2, margin, bw + gap, innerH);
      }

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x, yB - intH, bw, intH);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x, yB - intH - prinH, bw, prinH);
      ctx.fillStyle = '#4b5563';
      ctx.fillText(`${i + 1}-р сар`, x + bw / 2, yB + 6);
    }

    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '16px Inter, system-ui';
    ctx.fillText('Зээл төлөлтийн график', W / 2, 24);

    ctx.font = '12px Inter, system-ui';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(margin, margin - 14, 10, 10);
    ctx.fillStyle = '#111827';
    ctx.fillText('Бодогдсон хүү', margin + 16, margin - 6);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(margin + 120, margin - 14, 10, 10);
    ctx.fillStyle = '#111827';
    ctx.fillText('Үндсэн зээл', margin + 136, margin - 6);

    return { margin, slot, bars, innerW, innerH, bw, gap };
  };

  const drawBalance = (schedule, P, hover = -1) => {
    const canvas = balanceCanvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    clearCanvas(ctx);

    const W = canvas.width, H = canvas.height;
    const margin = 40, innerW = W - margin * 2, innerH = H - margin * 2;
    const n = schedule.length;

    ctx.strokeStyle = '#e5e7eb';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(margin, margin, innerW, innerH);
    ctx.setLineDash([]);

    const pts = [];
    for (let i = 0; i < n; i++) {
      const x = margin + innerW * (i / (n - 1));
      const bal = P * (1 - i / (n - 1));
      const y = H - margin - innerH * (bal / P);
      pts.push([x, y, bal]);
    }

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineTo(margin + innerW, H - margin);
    ctx.lineTo(margin, H - margin);
    ctx.closePath();
    ctx.fillStyle = 'rgba(59,130,246,0.25)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (hover >= 0 && hover < pts.length) {
      const [x, y] = pts[hover];
      ctx.strokeStyle = 'rgba(100,116,139,.7)';
      ctx.beginPath();
      ctx.moveTo(x, margin);
      ctx.lineTo(x, H - margin);
      ctx.stroke();
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = '12px Inter, system-ui';
    ctx.fillStyle = '#4b5563';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      const x = margin + innerW * (i / (n - 1));
      ctx.fillText(`${i + 1}-р сар`, x, H - margin + 6);
    }

    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.font = '16px Inter, system-ui';
    ctx.fillText('Зээлийн үлдэгдлийн график', W / 2, 24);

    return { margin, innerW, pts };
  };

  const showTip = (html, x, y) => {
    const tip = tipRef.current;
    if (tip) {
      tip.innerHTML = html;
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
      tip.style.display = 'block';
    }
  };

  const hideTip = () => {
    const tip = tipRef.current;
    if (tip) {
      tip.style.display = 'none';
    }
  };

  const recalc = () => {
    const res = computeSchedule(amount, rate, term);
    setSchedule(res.schedule);
    setKpis({
      payment: res.payment,
      interest: res.totalInterest,
      total: res.totalPay
    });
  };

  useEffect(() => {
    recalc();
  }, [amount, rate, term]);

  useEffect(() => {
    if (schedule.length > 0) {
      const payGeom = drawPayments(schedule, -1);
      const balGeom = drawBalance(schedule, Math.max(amount, 1), -1);
      setGeomPay(payGeom);
      setGeomBal(balGeom);
    }
  }, [schedule, activeChartTab]);

  const handlePaymentsMouseMove = (e) => {
    if (!geomPay || !paymentsCanvasRef.current) return;

    const rect = paymentsCanvasRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (paymentsCanvasRef.current.width / rect.width);
    const { margin, slot, bars } = geomPay;

    if (cx < margin || cx > (paymentsCanvasRef.current.width - margin)) {
      hideTip();
      drawPayments(schedule, -1);
      return;
    }

    let idx = Math.floor((cx - margin) / slot);
    idx = Math.max(0, Math.min(bars - 1, idx));
    drawPayments(schedule, idx);

    const s = schedule[idx];
    showTip(
      `<b>${idx + 1}-р сар</b>
      <div class="row"><span>Үндсэн зээл:</span><span class="v">${money(s.principal)}</span></div>
      <div class="row"><span>Бодогдсон хүү:</span><span class="v">${money(s.interest)}</span></div>
      <div class="row"><span>Нийт төлбөр:</span><span class="v">${money(s.payment)}</span></div>`,
      e.clientX,
      e.clientY
    );
  };

  const handlePaymentsMouseLeave = () => {
    hideTip();
    drawPayments(schedule, -1);
  };

  const handleBalanceMouseMove = (e) => {
    if (!geomBal || !balanceCanvasRef.current) return;

    const rect = balanceCanvasRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (balanceCanvasRef.current.width / rect.width);
    const { margin, innerW, pts } = geomBal;

    if (cx < margin || cx > (balanceCanvasRef.current.width - margin)) {
      hideTip();
      drawBalance(schedule, Math.max(amount, 1), -1);
      return;
    }

    let idx = Math.round(((cx - margin) / innerW) * (pts.length - 1));
    idx = Math.max(0, Math.min(pts.length - 1, idx));
    drawBalance(schedule, Math.max(amount, 1), idx);

    const bal = pts[idx][2];
    showTip(
      `<b>${idx + 1}-р сар</b><div class="row"><span>Үлдэгдэл:</span><span class="v">${money(bal)}</span></div>`,
      e.clientX,
      e.clientY
    );
  };

  const handleBalanceMouseLeave = () => {
    hideTip();
    drawBalance(schedule, Math.max(amount, 1), -1);
  };

  const handleApply = async () => {
    if (!TokenManager.isAuthenticated()) {
      if (window.confirm('Зээл авахын тулд нэвтрэх хэрэгтэй. Нэвтрэх хуудас руу шилжих үү?')) {
        navigate('/login');
      }
      return;
    }

    if (amount < 10000 || amount > 3000000) {
      showToast('Зээлийн дүн ₮10,000 - ₮3,000,000 хооронд байх ёстой', 'error');
      return;
    }

    if (term < 1 || term > 24) {
      showToast('Хугацаа 1-24 сарын хооронд байх ёстой', 'error');
      return;
    }

    const confirmMsg = `₮${fmt.format(amount)} зээлийн хүсэлт илгээх үү?\nХугацаа: ${term} сар\nХүү: ${rate}%`;

    if (window.confirm(confirmMsg)) {
      try {
        await LoansAPI.applyForLoan({
          amount: amount,
          duration_months: term,
          purpose: 'Хэрэглээний зээл - тооцоолуураас',
          monthly_income: 500000,
          occupation: 'Хэрэглэгч'
        });

        showToast('Амжилттай илгээлээ!', 'success');

        setTimeout(() => {
          navigate('/my-loans');
        }, 1500);
      } catch (error) {
        console.error('Loan application error:', error);
        showToast(error.message || 'Хүсэлт илгээхэд алдаа гарлаа', 'error');
      }
    }
  };

  const handlePDF = () => {
    window.print();
  };

  return (
    <div className="container">
      <div style={{ background: 'linear-gradient(135deg, #E0F7FA 0%, #E8F5E9 100%)', padding: '24px', borderRadius: '16px', marginTop: '16px', marginBottom: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.7)', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#0d9488', letterSpacing: '0.5px' }}>
            ТООЦООЛУУР
          </span>
        </div>
        <h2 style={{ margin: 0, textAlign: 'center', fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, #0d9488, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Зээлийн нөхцөл харах ба баталгаажуулах
        </h2>
      </div>

      {/* Loan Type Buttons */}
      <div className="loan-type-buttons" style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary loan-type-btn active">
          Хэрэглээний зээл
        </button>
        <Link to="/purchase-loan" className="btn btn-secondary loan-type-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Худалдан авалтын зээл
        </Link>
      </div>

      <div className="info-tabs">
        <div className={`tab-label ${activeTab === 'conditions' ? 'active' : ''}`} onClick={() => setActiveTab('conditions')}>
          Үйлчилгээний нөхцөл
        </div>
        <div className={`tab-label ${activeTab === 'requirements' ? 'active' : ''}`} onClick={() => setActiveTab('requirements')}>
          Тавигдах шаардлага
        </div>
        <div className={`tab-label ${activeTab === 'faq' ? 'active' : ''}`} onClick={() => setActiveTab('faq')}>
          Түгээмэл асуулт
        </div>
      </div>

      <div className="card pad info-pane-wrap">
        <div className={`pane ${activeTab === 'conditions' ? 'active' : ''}`}>
          <h3>Ерөнхий нөхцөл</h3>
          <table>
            <tbody>
              <tr>
                <th>Зорилго</th>
                <td>Хэрэглээний зээл</td>
                <th>Хугацаа</th>
                <td>1–24 сар</td>
              </tr>
              <tr>
                <th>Хүү</th>
                <td>Сард 2% – 5%</td>
                <th>Барьцаа</th>
                <td>Шаардлагагүй</td>
              </tr>
              <tr>
                <th>Хязгаар</th>
                <td>₮10,000 – ₮3,000,000</td>
                <th>Хураамж</th>
                <td>0–1%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={`pane ${activeTab === 'requirements' ? 'active' : ''}`}>
          <h3>Тавигдах шаардлага</h3>
          <ul>
            <li>Монгол Улсын иргэн</li>
            <li>Тогтмол орлоготой</li>
            <li>Идэвхтэй банкны данстай</li>
          </ul>
        </div>
        <div className={`pane ${activeTab === 'faq' ? 'active' : ''}`}>
          <h3>Түгээмэл асуулт</h3>
          <details>
            <summary>Урьдчилан төлбөл торгуультай юу?</summary>
            <div>Үгүй, хугацаанаас өмнө төлсөн тохиолдолд нэмэлт шимтгэлгүй.</div>
          </details>
          <details>
            <summary>Шийдвэр хэдий хугацаанд гарах вэ?</summary>
            <div>Урьдчилсан шийдвэр минутын дотор гарна.</div>
          </details>
        </div>
      </div>

      <section className="calculator-grid">
        <div className="card pad">
          <h3>Тохиргоо</h3>

          <div className="control">
            <label>Зээлийн дүн</label>
            <div className="display">
              <span>₮</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(clamp(+e.target.value, 10000, 3000000))}
                min="10000"
                max="3000000"
                step="10000"
              />
            </div>
            <input
              type="range"
              min="10000"
              max="3000000"
              step="10000"
              value={amount}
              onChange={(e) => setAmount(+e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
              <span>₮10,000</span><span>₮3,000,000</span>
            </div>
          </div>

          <div className="control">
            <label>Сарын хүү (%)</label>
            <div className="display">
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(clamp(+e.target.value, 2, 5))}
                min="2"
                max="5"
                step="0.1"
              />
              <span>%</span>
            </div>
            <input
              type="range"
              min="2"
              max="5"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(+e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
              <span>2%</span><span>5%</span>
            </div>
          </div>

          <div className="control">
            <label>Зээлийн хугацаа (сар)</label>
            <div className="display">
              <input
                type="number"
                value={term}
                onChange={(e) => setTerm(clamp(+e.target.value, 1, 24))}
                min="1"
                max="24"
                step="1"
              />
              <span>сар</span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              step="1"
              value={term}
              onChange={(e) => setTerm(+e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
              <span>1 сар</span><span>24 сар</span>
            </div>
          </div>

          <div className="cta">
            <button className="btn btn-primary" onClick={() => navigate('/application-new')}>Хүсэлт илгээх</button>
            <button className="btn btn-ghost" onClick={handlePDF}>PDF хадгалах</button>
          </div>
        </div>

        <div className="card pad">
          <div className="chart-tabs">
            <div className={`chart-tab-label ${activeChartTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveChartTab('payment')}>
              Төлөлтийн график
            </div>
            <div className={`chart-tab-label ${activeChartTab === 'balance' ? 'active' : ''}`} onClick={() => setActiveChartTab('balance')}>
              Үлдэгдлийн график
            </div>
          </div>
          <div className="panels">
            <div className={`panel ${activeChartTab === 'payment' ? 'active' : ''}`}>
              <canvas
                ref={paymentsCanvasRef}
                width="800"
                height="360"
                onMouseMove={handlePaymentsMouseMove}
                onMouseLeave={handlePaymentsMouseLeave}
              ></canvas>
            </div>
            <div className={`panel ${activeChartTab === 'balance' ? 'active' : ''}`}>
              <canvas
                ref={balanceCanvasRef}
                width="800"
                height="360"
                onMouseMove={handleBalanceMouseMove}
                onMouseLeave={handleBalanceMouseLeave}
              ></canvas>
            </div>
          </div>
        </div>
      </section>

      <section className="kpis-wide">
        <div className="kpi">Сарын төлбөр<b>{money(kpis.payment)}</b></div>
        <div className="kpi">Нийт хүү<b>{money(kpis.interest)}</b></div>
        <div className="kpi">Нийт төлөх<b>{money(kpis.total)}</b></div>
      </section>

      <div ref={tipRef} className="chart-tip"></div>
    </div>
  );
};

export default LoanCalculator;
