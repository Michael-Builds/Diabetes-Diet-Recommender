import { AxiosError } from "axios";

export function getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError && typeof error.response?.data?.message === "string") {
        return error.response.data.message;
    }
    return "Something went wrong. Please try again later.";
}
