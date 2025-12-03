import { useState } from 'react';
import '../styles/faq.css';

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openItems, setOpenItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'general', label: 'Ерөнхий', icon: '' },
    { id: 'loan', label: 'Зээлийн тухай', icon: '' },
    { id: 'payment', label: 'Төлбөр', icon: '' },
    { id: 'account', label: 'Данс', icon: '' }
  ];

  const faqData = {
    general: [
      {
        id: 'g1',
        question: 'OmniCredit гэж юу вэ?',
        answer: 'OmniCredit бол Монголд үйл ажиллагаа явуулдаг онлайн зээлийн платформ юм. Бид хэрэглэгчдэд хурдан, хялбар, ил тод зээлийн үйлчилгээ үзүүлдэг. Та өөрийн гар утас эсвэл компьютероос зээлийн хүсэлт илгээж, минутын дотор шийдвэр авах боломжтой.'
      },
      {
        id: 'g2',
        question: 'Та нарын үйлчилгээ аюулгүй юу?',
        answer: 'Тийм ээ, бид таны мэдээллийн аюулгүй байдлыг хамгийн чухал зүйл гэж үздэг. Бүх мэдээллийг SSL шифрлэлтээр хамгаалж, олон улсын стандартын дагуу хадгалдаг. Мөн Санхүүгийн зохицуулах хорооноос бүрэн эрхтэй.'
      },
      {
        id: 'g3',
        question: 'Хэрхэн холбоо барих вэ?',
        answer: 'Та 24/7 ажилладаг дэмжлэгийн багтай холбогдож болно:\n• Утас: 7777-7777\n• Имэйл: support@omnicredit.mn\n• Чат: Веб сайтын баруун доод буланд байрлах чат'
      },
      {
        id: 'g4',
        question: 'Ажлын цаг хэд вэ?',
        answer: 'Манай онлайн систем 24/7 ажилладаг. Та хүссэн үедээ зээлийн хүсэлт илгээж, төлбөр төлж болно. Харин хэрэв танд туслах хэрэгтэй бол, манай дэмжлэгийн баг өдрийн 9:00-21:00 цагт бэлэн байдаг.'
      }
    ],
    loan: [
      {
        id: 'l1',
        question: 'Зээл авахын тулд юу хэрэгтэй вэ?',
        answer: 'Зээл авахад дараах шаардлага хангасан байх хэрэгтэй:\n• 18-65 насны Монгол иргэн\n• Тогтвортой орлоготой\n• Иргэний үнэмлэх\n• Утасны дугаар болон имэйл хаяг\n• Банкны дансны мэдээлэл'
      },
      {
        id: 'l2',
        question: 'Хамгийн их хэдий зээл авч болох вэ?',
        answer: 'Анхны зээл авагчид хамгийн ихдээ ₮1,000,000 хүртэл авах боломжтой. Зээлийн түүх сайтай бол энэ дээд хязгаарыг ₮3,000,000 хүртэл нэмэгдүүлэх боломжтой.'
      },
      {
        id: 'l3',
        question: 'Хүү хэд вэ?',
        answer: 'Манай сарын хүү 2.0%-3.3% хооронд байдаг. Хүүгийн хэмжээ таны зээлийн түүх, орлого, зээлийн хугацаанаас хамаарна. Нэмэлт нууц төлбөр, хураамж байхгүй.'
      },
      {
        id: 'l4',
        question: 'Шийдвэр хэдий хугацаанд гарах вэ?',
        answer: 'Урьдчилсан шийдвэр 5 минутын дотор гарна. Баталсны дараа зээлийн мөнгө таны данс руу 24 цагийн дотор шилжинэ.'
      },
      {
        id: 'l5',
        question: 'Зээлийн хугацааг сунгаж болох уу?',
        answer: 'Тийм, та зээлээ сунгах хүсэлт илгээж болно. Гэхдээ энэ нь нэмэлт хүү бодогдох тул төлбөрийн дүн нэмэгдэнэ. Зээлээ цагтаа төлөхийг зөвлөж байна.'
      }
    ],
    payment: [
      {
        id: 'p1',
        question: 'Хэрхэн төлбөр төлөх вэ?',
        answer: 'Та дараах аргуудаар төлбөр төлж болно:\n• Дансаас шууд шилжүүлэг\n• Карт (Visa/MasterCard)\n• QPay, SocialPay\n• Банкны салбар'
      },
      {
        id: 'p2',
        question: 'Төлбөрийн хугацаа хэтэрвэл яах вэ?',
        answer: 'Төлбөр хугацаа хэтрүүлбэл алданги төлбөр бодогдоно. Хэрэв төлбөрт хүндрэлтэй байгаа бол манай дэмжлэгийн багтай холбогдож, төлбөрийн төлөвлөгөө дахин зохицуулах хүсэлт илгээнэ үү.'
      },
      {
        id: 'p3',
        question: 'Эртнээ төлвөл хөнгөлөлттэй юу?',
        answer: 'Тийм, та зээлээ эрт төлбөл үлдсэн хүүг төлөх шаардлагагүй. Зөвхөн үндсэн зээл болон тухайн үед бодогдсон хүүг төлнө.'
      },
      {
        id: 'p4',
        question: 'Төлбөрийн баримт авах боломжтой юу?',
        answer: 'Тийм, төлбөр бүрийн дараа та цахим баримт авах боломжтой. Баримтыг өөрийн дансны түүхээс татаж авч болно.'
      }
    ],
    account: [
      {
        id: 'a1',
        question: 'Хэрхэн данс үүсгэх вэ?',
        answer: '"Бүртгүүлэх" товч дээр дарж, шаардлагатай мэдээллээ оруулаад бүртгэлээ баталгаажуулна. Процесс 2-3 минут шаардана.'
      },
      {
        id: 'a2',
        question: 'Нууц үгээ мартсан бол?',
        answer: 'Нэвтрэх хуудсан дээрх "Нууц үг мартсан?" холбоос дээр дарж, бүртгэлтэй имэйл хаягаа оруулна. Бид танд шинэ нууц үг үүсгэх холбоос илгээнэ.'
      },
      {
        id: 'a3',
        question: 'Мэдээллээ хэрхэн засах вэ?',
        answer: 'Дансандаа нэвтрээд "Хувийн мэдээлэл" хэсэгт орж, мэдээллээ шинэчилж болно. Зарим мэдээлэл өөрчлөхөд баталгаажуулалт шаардагдана.'
      },
      {
        id: 'a4',
        question: 'Дансаа хэрхэн устгах вэ?',
        answer: 'Та support@omnicredit.mn хаяг руу данс устгах хүсэлт илгээнэ үү. Гэхдээ идэвхтэй зээл байгаа бол эхлээд төлбөрөө дуусгах шаардлагатай.'
      }
    ]
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const toggleFaqItem = (itemId) => {
    setOpenItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const getFilteredFaqs = () => {
    const faqs = faqData[activeCategory];
    if (!searchQuery) return faqs;

    return faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery) ||
      faq.answer.toLowerCase().includes(searchQuery)
    );
  };

  return (
    <div className="container">
      <section style={{ textAlign: 'center', margin: '64px 0 32px' }}>
        <h1>Түгээмэл асуулт хариулт</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', maxWidth: '600px', margin: '16px auto 0' }}>
          Таны асуултын хариултыг эндээс олоорой
        </p>
      </section>

      <div className="search-box">
        <input
          type="text"
          placeholder="Асуулт хайх..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      <div className="faq-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`btn category-btn ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleCategoryChange(cat.id)}
          >
            <div className="category-icon">{cat.icon}</div>
            <div>{cat.label}</div>
          </button>
        ))}
      </div>

      <div className="faq-section">
        <div className={`faq-list active`}>
          {getFilteredFaqs().map(faq => (
            <div
              key={faq.id}
              className={`faq-item ${openItems.includes(faq.id) ? 'open' : ''}`}
            >
              <div className="faq-question" onClick={() => toggleFaqItem(faq.id)}>
                <span>{faq.question}</span>
                <span className="faq-toggle">+</span>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  {faq.answer.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < faq.answer.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="contact-cta">
        <h3>Хариулт олдсонгүй юу?</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Бидэнтэй холбогдоорой, бид танд туслахад таатай байна
        </p>
        <div className="btn-group" style={{ justifyContent: 'center' }}>
          <a href="mailto:support@omnicredit.mn" className="btn btn-primary">
            Имэйл илгээх
          </a>
          <a href="tel:77777777" className="btn btn-secondary">
            Утасдах
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
