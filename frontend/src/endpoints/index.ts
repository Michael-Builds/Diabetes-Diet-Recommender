// export const domain = process.env.NODE_ENV === 'production' ? "hello" : "http://localhost:4000/api"
export const domain = "http://localhost:4000/api"
export const login_url = `${domain}/login`
export const register_url = `${domain}/register`
export const activate_account_url = `${domain}/account-activate`
export const resend_activate_code_url = `${domain}/resend-activation`
export const forgot_password_url = `${domain}/forgot-password`
export const reset_password_url = `${domain}/reset-password`
export const logout_url = `${domain}/logout`
export const refresh_token_url = `${domain}/refresh-token`
export const get_user_info_url = `${domain}/get-user`
export const get_notifications_url = `${domain}/notifications`
export const updated_notification_status_url = `${domain}/update-notification-status`
export const update_profile_url = `${domain}/update-profile`
export const update_health_details_url = `${domain}/update-health-details`
export const update_customization_url = `${domain}/update-customizations`
export const generate_recommendation_url = `${domain}/generate-recommendations`
export const get_recommendations_url = `${domain}/get-recommendations`