const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer
      role="contentinfo"
      className="
        bg-[rgb(var(--header-bg))] text-[rgb(var(--header-fg))]
        border-t border-[rgb(var(--header-fg))/15]
      "
    >
      <div className="container py-6 text-center text-[rgb(var(--header-fg))/0.95]">
        © {year} Holidaze. All rights reserved.
      </div>
    </footer>
  );
};
export default Footer;
