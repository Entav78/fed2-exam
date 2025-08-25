const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-header text-text-soft py-6">
      <div className="container text-sm opacity-80">© {year} Holidaze. All rights reserved.</div>
    </footer>
  );
};
export default Footer;
