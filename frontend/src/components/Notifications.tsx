import { useEffect, useState } from "react";
import { useAuthContext } from "../context/useAuthContext";

const Notifications = () => {
  const { notifications, updateNotificationStatus } = useAuthContext();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleNotifications, setVisibleNotifications] = useState(notifications);

  useEffect(() => {
    const now = new Date().getTime();
    const filteredNotifications = notifications.filter((notification) => {
      if (notification.status === "read") {
        const createdAt = new Date(notification.createdAt).getTime();
        return now - createdAt < 24 * 60 * 60 * 1000;
      }
      return true;
    });

    setVisibleNotifications(filteredNotifications);
  }, [notifications]);

  const handleToggle = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      await updateNotificationStatus(id);
    }
  };

  return (
    <div className="p-2 w-full max-w-lg h-96 overflow-y-auto">
      <h2 className="text-lg font-semibold">Notifications</h2>

      {visibleNotifications.length === 0 ? (
        <p className="text-gray-500 mt-2">No new notifications.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {visibleNotifications.map((notification) => {
            const isRead = notification.status === "read";
            return (
              <li
                key={notification._id}
                className={`p-3 rounded-md  cursor-pointer transition ${isRead ? "bg-gray-200 text-gray-600" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                onClick={() => handleToggle(notification._id)}
              >
                <h3 className="font-medium">{notification.title}</h3>
                {expandedId === notification._id && (
                  <p className="text-sm text-gray-600 mt-2">{notification.message}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
