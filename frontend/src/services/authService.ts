import axios from "axios";
import {
    forgot_password_url,
    get_notifications_url,
    get_recommendations_url,
    login_url,
    logout_url,
    refresh_token_url,
    reset_password_url,
    update_profile_url,
    updated_notification_status_url,
} from "../endpoints";

export const authService = {
    login: async (credentials: any) => {
        return axios.post(login_url, credentials, { withCredentials: true });
    },
    logout: async () => {
        return axios.get(logout_url, { withCredentials: true });
    },
    refreshToken: async () => {
        return axios.get(refresh_token_url, { withCredentials: true });
    },
    updateProfile: async (data: any) => {
        return axios.put(update_profile_url, data, { withCredentials: true });
    },
    getNotifications: async () => {
        return axios.get(get_notifications_url, { withCredentials: true });
    },
    forgotPassword: async (email: string) => {
        return axios.post(forgot_password_url, { email }, { withCredentials: true });
    },
    resetPassword: async (data: { email: string; activationCode: string; newPassword: string }) => {
        return axios.post(reset_password_url, data, { withCredentials: true });
    },

    getRecommendations: async (userId: string) => {
        return axios.get(`${get_recommendations_url}/${userId}`, { withCredentials: true });
    },

    updateNotificationStatus: async (id: string) => {
        return axios.put(`${updated_notification_status_url}/${id}`, {}, { withCredentials: true })
    }

};
