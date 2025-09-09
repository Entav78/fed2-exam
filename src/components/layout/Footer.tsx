const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer
      className="
        bg-[rgb(var(--header-bg))] text-[rgb(var(--header-fg))]
        border-t border-[rgb(var(--header-fg))/15]
      "
      role="contentinfo"
    >
      <div className="container py-6 text-sm opacity-80">
        © {year} Holidaze. All rights reserved.
      </div>
    </footer>
  );
};
export default Footer;
