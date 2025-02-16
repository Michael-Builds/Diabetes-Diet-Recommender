import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { get_notifications_url } from "../endpoints";

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(get_notifications_url);
            setNotifications(response.data);
        } catch (err) {
            setError("Failed to fetch notifications");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return {
        notifications,
        isLoading,
        error,
        refreshNotifications: fetchNotifications,
    };
};
