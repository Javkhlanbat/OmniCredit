import '../styles/hero.css';
import '../styles/aboutus.css';

const AboutUs = () => {
  const values = [
    {
      icon: '',
      title: 'Ил тод байдал',
      description: 'Бүх төлбөр, хураамж, үйлчилгээний нөхцөлийг ойлгомжтой, нууцгүй тодорхой зарлана.'
    },
    {
      icon: '',
      title: 'Хэрэглэгч төвтэй',
      description: 'Хэрэглэгчийн хэрэгцээ шаардлагад нийцсэн, хүртээмжтэй үйлчилгээ үзүүлэхийг эрхэмлэнэ.'
    },
    {
      icon: '',
      title: 'Найдвартай байдал',
      description: 'Таны мэдээллийн аюулгүй байдлыг хамгийн өндөр түвшинд хангаж ажиллана.'
    },
    {
      icon: '',
      title: 'Инновац',
      description: 'Орчин үеийн технологи, шинэ санааг ашиглан үйлчилгээгээ тасралтгүй сайжруулна.'
    }
  ];

  const timeline = [
    {
      year: '2025',
      title: 'Байгуулагдсан',
      description: 'OmniCredit компани албан ёсоор үүсгэн байгуулагдаж, анхны хөгжүүлэлтийн ажлыг эхлүүллээ. Одоогоор манай баг платформыг хөгжүүлэлтийн үе шатандаа явуулж байна.'
    }
  ];

  const team = [
    {
      name: 'Б. Жавхланбат',
      role: 'Хөгжүүлэгч',
      avatar: ''
    },
    {
      name: 'Т. Марал',
      role: 'Дизайнер',
      avatar: ''
    },
    {
      name: 'О. Анар',
      role: 'Гүйцэтгэх захирал',
      avatar: ''
    }
  ];

  return (
    <div className="container">
      <section className="hero hero-compact">
        <div className="hero-content">
          <h1>OmniCredit түүх</h1>
          <p>
            Бид Монголд зээлийн үйлчилгээг хүн бүрт хүртээмжтэй, ил тод, найдвартай үйлчилгээ
            үзүүлэхээр зорин ажиллаж байна.
          </p>
        </div>
      </section>

      <section style={{ marginTop: '80px' }}>
        <div className="card card-peachy" style={{ padding: '64px 48px' }}>
          <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '24px' }}>
            Бидний эрхэм зорилго
          </h2>
          <p style={{ color: 'white', textAlign: 'center', fontSize: '1.125rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
            Санхүүгийн үйлчилгээг хүн бүрт хүртээмжтэй болгож,
            технологийн тусламжтайгаар хүмүүсийн амьдралын чанарыг
            сайжруулахад хувь нэмэр оруулах. Бид ил тод, шударга,
            хариуцлагатай зарчмаар үйл ажиллагаа явуулдаг.
          </p>
        </div>
      </section>

      <section style={{ marginTop: '80px' }}>
        <h2 className="text-center mb-4">Бидний үнэт зүйлс</h2>
        <div className="values-grid">
          {values.map((value, index) => (
            <div key={index} className="value-item">
              <div className="value-icon">{value.icon}</div>
              <h4>{value.title}</h4>
              <p style={{ color: 'var(--text-muted)' }}>
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '80px' }}>
        <h2 className="text-center mb-4">Бидний замнал</h2>
        <div className="timeline">
          {timeline.map((item, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-year">{item.year}</div>
              <div className="timeline-content">
                <h4>{item.title}</h4>
                <p style={{ color: 'var(--text-muted)' }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '80px', marginBottom: '80px' }}>
        <h2 className="text-center mb-4">Манай баг</h2>
        <div className="team-grid">
          {team.map((member, index) => (
            <div key={index} className="team-member">
              <div className="team-avatar">{member.avatar}</div>
              <div className="team-name">{member.name}</div>
              <div className="team-role">{member.role}</div>
              <div className="team-social">
                <a href="#">LinkedIn</a>
                <a href="#">Email</a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
