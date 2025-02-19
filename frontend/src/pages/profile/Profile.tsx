import { MdVerified } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/useAuthContext";
import Avatar from "/assets/avator2.png";
import { useEffect, useState } from "react";

const Profile = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [profileCompletion, setProfileCompletion] = useState(0)
  console.log(user)
  const {
    firstname,
    lastname,
    email,
    gender,
    phone_number,
    isVerified,
    avatar,
    customizations,
    diatery_preferences,
  } = user

  const calculateProfileCompletion = () => {
    let totalFields = 6;
    let filledFields = 0;

    if (avatar?.url) filledFields++;
    if (firstname) filledFields++;
    if (lastname) filledFields++;
    if (email) filledFields++;
    if (phone_number) filledFields++;
    if (customizations.notification_preference) filledFields++;

    // Calculate the percentage
    const completionPercentage = Math.round((filledFields / totalFields) * 100);
    setProfileCompletion(completionPercentage);
  };

  useEffect(() => {
    calculateProfileCompletion();
  }, [user]);

  const avatarUrl = avatar?.url || Avatar

  const showAttentionMessage =
    (!customizations || !customizations.notification_preference) ||
    (!diatery_preferences || diatery_preferences.food_allergies.length === 0);

  return (
    <section className=" lg:pb-8 font-giest lg:-mt-6 py-10 px-6 ">
      <div className="max-w-screen-lg select-none lg:pb-4 mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="flex items-center justify-between border border-b-1 p-6">
          <div className="flex items-center">
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-20 h-20 rounded-full mr-4"
            />
            <div>
              <h2 className="lg:text-xl flex font-semibold items-center gap-2 text-gray-500">
                {firstname} {lastname}

                {isVerified &&
                  <MdVerified
                    size={24}
                    color="green"
                    className="text-green-500"
                  />}
              </h2>
              <p className="text-sm text-gray-500 ">Developer - SF, Bay Area</p>
            </div>
          </div>
          <button onClick={() => navigate('/settings')} className="bg-blue-600 hover:bg-blue-700 text-sm text-white py-2 px-6 rounded-full">Edit Profile</button>
        </div>

        {/* Profile Details */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-500">Profile Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium text-gray-600">{firstname}</p>
            </div>
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-gray-500">Last Name</p>
              <p className="font-medium text-gray-600">{lastname}</p>
            </div>
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-600">{email}</p>
            </div>
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-gray-500">Contact Phone</p>
              <p className="font-medium text-gray-600">{phone_number}</p>
            </div>
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-gray-500">Communication</p>
              <p className="font-medium capitalize text-gray-600">{customizations.notification_preference}</p>
            </div>

            <div className="flex flex-col space-y-2">
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium capitalize text-gray-600">{gender}</p>
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div className="mt-6">
            <p className="text-sm text-gray-500">Profile Completion</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full"
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-gray-500">{profileCompletion}%</p>
          </div>
        </div>

        {/* Attention Alert */}
        {showAttentionMessage && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 mx-6 mt-6 rounded-md">
            <p className="font-medium">We need your attention!</p>
            <p>
              Please update your dietary preferences and communication settings to complete your profile.
              <a href="/settings" className="text-blue-600"> Update now</a>.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Profile;
