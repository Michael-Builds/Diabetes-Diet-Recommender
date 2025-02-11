
const VerifyOtp = () => {
    return (
        <section className="h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-900 p-6">
            <h2 className="text-2xl font-bold mb-4">Verify OTP</h2>
            <form className="bg-white shadow-md rounded-lg p-6 flex flex-col gap-4 w-80">
                <input
                    type="text"
                    placeholder="Enter OTP"
                    maxLength={6}
                    className="w-full p-3 border border-gray-300 rounded-lg text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-all"
                >
                    Verify OTP
                </button>
            </form>
        </section>
    );
};

export default VerifyOtp;
