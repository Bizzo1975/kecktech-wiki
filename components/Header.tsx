export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="https://www.kecktech.net/" aria-label="Kecktech IT Solutions — Home">
          <img
            src="https://www.kecktech.net/brand/transparent-logo-white.png"
            alt="Kecktech IT Solutions"
            className="logo-img"
          />
        </a>

        <nav className="main-nav" aria-label="Primary navigation">
          <a href="https://www.kecktech.net/" className="nav-link">Home</a>
          <a href="https://www.kecktech.net/about" className="nav-link">About</a>
          <a href="https://www.kecktech.net/services" className="nav-link">Services</a>
          <a href="https://www.kecktech.net/pricing" className="nav-link">Pricing</a>
          <a href="https://help.kecktech.net" className="nav-link active">Help</a>
          <a href="https://www.kecktech.net/contact" className="nav-link">Contact</a>
        </nav>

        <a href="https://portal.kecktech.net" className="btn-login">
          Customer Login
        </a>
      </div>
    </header>
  );
}
