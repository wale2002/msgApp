const { default: Footer } = require("./Footer");
const { default: Navbar } = require("./Navbar");

const Layout = ({ children }) => {
  return (
    //children from the app folder would be outputted here
    <div className="content">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
};
export default Layout;
