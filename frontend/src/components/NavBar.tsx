import { Link } from "react-router-dom";

const Navbar = () => {
    return (
        <nav className="bg-gray-800 text-white py-3 px-5 flex justify-between">
            <h1 className="text-xl font-bold">DiaNutri</h1>
            <div>
                <Link to="/home" className="mx-2">Home</Link>
                <Link to="/profile" className="mx-2">Profile</Link>
            </div>
        </nav>
    );
};

export default Navbar;