import { useAuthContext } from "../../context/useAuthContext";

const Dashboard = () => {
  const { user } = useAuthContext();

  // ✅ Extract user data
  const {
    health_details,
    diatery_preferences,
    customizations,
    avatar,
    firstname,
    lastname,
    email,
    phone_number,
    gender,
    isVerified
  } = user || {};

  // ✅ User Profile
  const userProfile = {
    avatarUrl: avatar?.url || "https://via.placeholder.com/100",
    name: `${firstname} ${lastname}`,
    email,
    phone: phone_number || "N/A",
    gender: gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "N/A",
    verified: isVerified ? "Yes ✅" : "No ❌",
  };

  // ✅ Health Overview
  const healthOverviewData = [
    { title: "Current Weight", value: health_details?.current_weight ? `${health_details.current_weight} kg` : "N/A", color: "text-green-500" },
    { title: "Height", value: health_details?.height ? `${health_details.height} cm` : "N/A", color: "text-orange-500" },
    { title: "Diabetic Type", value: health_details?.diabetic_type || "Not specified", color: "text-purple-500" },
  ];

  // ✅ Dietary Preferences
  const dietaryPreferences = [
    { title: "Preferred Diet Type", value: diatery_preferences?.preferred_diet_type || "Not specified", color: "text-red-500" },
    { title: "Food Allergies", value: diatery_preferences?.food_allergies?.length > 0 ? diatery_preferences.food_allergies.join(", ") : "None", color: "text-yellow-500" },
    { title: "Foods to Avoid", value: diatery_preferences?.foods_to_avoid?.length > 0 ? diatery_preferences.foods_to_avoid.join(", ") : "None", color: "text-gray-500" },
    { title: "Favorite Foods", value: diatery_preferences?.favorite_foods?.length > 0 ? diatery_preferences.favorite_foods.join(", ") : "None", color: "text-blue-500" },
  ];

  // ✅ Customization Settings
  const customizationSettings = [
    { title: "Meal Reminder", value: customizations?.meal_reminder_preference ? "Enabled ✅" : "Disabled ❌", color: "text-green-500" },
    { title: "Preferred Time for Diet", value: customizations?.preferred_time_for_diet || "N/A", color: "text-blue-500" },
    { title: "Notification Preference", value: customizations?.notification_preference || "None", color: "text-purple-500" },
  ];

  return (
    <section className="p-6 bg-gray-100 min-h-screen font-geist">
      <h1 className="text-2xl font-bold text-gray-700">Diabetes Dashboard</h1>

      {/* ✅ User Profile */}
      <div className="bg-white p-4 shadow rounded-md flex items-center gap-4 mt-6">
        <img src={userProfile.avatarUrl} alt="User Avatar" className="w-16 h-16 rounded-full border" />
        <div>
          <h2 className="text-lg font-semibold text-gray-700">{userProfile.name}</h2>
          <p className="text-sm text-gray-500">Email: <span className="text-blue-500">{userProfile.email}</span></p>
          <p className="text-sm text-gray-500">Phone: <span className="text-green-500">{userProfile.phone}</span></p>
          <p className="text-sm text-gray-500">Gender: <span className="text-purple-500">{userProfile.gender}</span></p>
          <p className="text-sm text-gray-500">Verified: <span className="text-red-500">{userProfile.verified}</span></p>
        </div>
      </div>

      {/* ✅ Health Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {healthOverviewData.map((item, index) => (
          <div key={index} className="bg-white p-4 shadow rounded-md">
            <h2 className="text-lg font-semibold text-gray-600">{item.title}</h2>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* ✅ Dietary Preferences Section */}
      <div className="bg-white p-4 shadow rounded-md mt-6">
        <h2 className="text-lg font-semibold text-gray-600">Dietary Preferences</h2>
        <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {dietaryPreferences.map((item, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-semibold text-gray-700">{item.title}</h3>
              <p className={`text-md font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Customization Settings Section */}
      <div className="bg-white p-4 shadow rounded-md mt-6">
        <h2 className="text-lg font-semibold text-gray-600">Customization Settings</h2>
        <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {customizationSettings.map((item, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-semibold text-gray-700">{item.title}</h3>
              <p className={`text-md font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
