import Link from 'next/link';

export const Footer = () => (
  <div className="footerContainer" id="masterFooter">
    <footer className="footer">
      <div className="footerInner">
        <div className="brand">
          <div className="logo">Writo</div>
          <p className="tagline">Minimal, mobile-first stories.</p>
          <div className="social">
            <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
            <a href="#" aria-label="Twitter"><i className="fa-brands fa-twitter"></i></a>
          </div>
        </div>
        <div>
          <div className="colTitle">Links</div>
          <ul className="links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/blog">Articles</Link></li>
            <li><Link href="/admin">Admin</Link></li>
          </ul>
        </div>
        <div>
          <div className="colTitle">Explore</div>
          <ul className="links">
            <li><Link href="/category/design">Design</Link></li>
            <li><Link href="/category/engineering">Engineering</Link></li>
          </ul>
        </div>
        <div className="newsBox">
          <div className="colTitle">Newsletter</div>
          <p className="newsText">Weekly highlights from our editors.</p>
          <form className="newsForm">
            <input className="input" type="email" placeholder="Email" />
            <button className="btn" type="button">Join</button>
          </form>
        </div>
      </div>
      <div className="footerBottom">
        <div className="copyright">© 2026 Writo.</div>
        <div className="bottomLinks">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  </div>
);
