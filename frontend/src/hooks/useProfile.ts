import { useState, useCallback } from "react";
import axios from "axios";
import { useNotifications } from "./useNotifications";
import { update_profile_url } from "../endpoints";

export const useProfile = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { refreshNotifications } = useNotifications();

    const updateProfile = useCallback(async (updatedData: any) => {
        setIsLoading(true);
        setError(null);
        try {
            await axios.put(update_profile_url, updatedData);

            refreshNotifications();
        } catch (err) {
            setError("Profile update failed");
        } finally {
            setIsLoading(false);
        }
    }, [refreshNotifications]);

    return {
        updateProfile,
        isLoading,
        error,
    };
};
