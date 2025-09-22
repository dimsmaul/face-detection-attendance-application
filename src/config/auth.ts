import { callAlert } from "@/components/alert";
import { useAuthStore } from "@/store/useAuthStore";
import axios from "axios";

const auth = axios.create({
    baseURL: "/api/v1"
});

auth.interceptors.request.use((config) => {
    const token = useAuthStore.getState().users.token;
    const mtoken = localStorage.getItem("mtoken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (mtoken) {
        config.headers.Authorization = `Bearer ${mtoken}`;
    }
    // config.headers["Content-Type"] = "application/json";
    config.headers["Content-Type"] =
        config.headers["Content-Type"] || "application/json";
    return config;
});
auth.interceptors.response.use(
    (response) => response, // Jika sukses, lanjutkan responsenya
    (error) => {
        if (error.response?.status === 401) {
            callAlert({
                type: "error",
                title: "Unauthorized",
                message: "Your session has expired. Please log in again.",
                onConfirm: () => {
                    useAuthStore.getState().clearUsers();
                    window.location.href = "/";
                },
            });
        } else {
            const errorMessage = JSON.stringify(error);
            // const errorMessage = error.response?.data?.error || "An error occurred";
            callAlert({
                type: "error",
                title: "Error",
                message: errorMessage,
            });
        }

        return Promise.reject(error);
    }
);

export default auth;