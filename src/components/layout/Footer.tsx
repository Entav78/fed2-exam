/** @file Footer – site-wide footer with the current year and brand name. */

/**
 * Footer
 *
 * Renders a page footer with the current year and brand text.
 * Uses the header color variables for visual consistency.
 */
const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer
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
