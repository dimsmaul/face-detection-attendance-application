import axios from "axios";

const unauth = axios.create({
    baseURL: '/api',
});

unauth.interceptors.request.use((config) => {
    config.headers["Content-Type"] = "application/json";
    return config;
});

export default unauth;