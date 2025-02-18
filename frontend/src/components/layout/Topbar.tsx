import { useAuthContext } from "../../context/useAuthContext";

const Topbar = () => {
    const { user, isAuthenticated, logout, notifications } = useAuthContext();

    console.log("Usr data", user);
    console.log("Authenticated", isAuthenticated);
    console.log("Notifications", notifications);

    return (
        <section className="bg-[#ffffff] pl-2 pr-2 lg:pl-8 lg:pr-8 font-geist shadow-sm h-14 rounded-lg items-center flex justify-between">
            <p>Notify</p>
            {/* <p>Profile</p> */}
            {isAuthenticated && (
                <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
                >
                    Logout
                </button>
            )}
        </section>
    );
};

export default Topbar;
