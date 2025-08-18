const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-header text-white py-4 text-center text-sm">
      © {year} Holidaze. All rights reserved.
    </footer>
  );
};
export default Footer;
