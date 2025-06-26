import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav>
      <div>
        <h1>Ninja List</h1>
      </div>
      <Link href="#">Home</Link>
      <Link href="#">About</Link>
      <Link href="#">Ninja Listing</Link>
    </nav>
  );
};
export default Navbar;
