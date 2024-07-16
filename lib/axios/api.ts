import axios, { AxiosError, AxiosInstance } from "axios";
import apiConfig from "@/config/api";
import fetchAdapter from "@haverstack/axios-fetch-adapter";

export type ApiResponse<T> = {
    success: true;
    data: T;
};

export type ErrorResponse = {
    success: false;
    error: string;
};

class Api {
    private readonly baseURL: string;

    private readonly axios: AxiosInstance;

    constructor(baseURL: string = "") {
        this.baseURL = baseURL.replace(/\/+$/, ""); // Trim trailing slashes for consistency

        this.axios = axios.create({
            baseURL: this.baseURL,
            timeout: apiConfig.timeout,
            adapter: fetchAdapter,
        });
    }

    private async makeRequest<T>(
        url: string,
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
        data?: any,
        headers?: Record<string, string>,
    ): Promise<ApiResponse<T> | ErrorResponse> {
        const fullUrl = `${this.baseURL}${url}`;

        try {
            const response = await this.axios({
                url: fullUrl,
                method,
                data,
                headers,
            });

            return response.data as ApiResponse<T>;
        } catch (error: any) {
            const axiosError = error as AxiosError;

            if (axiosError.isAxiosError) {
                const { response, stack } = axiosError;

                console.error("There was an error sending this API request.", {
                    url: fullUrl,
                    method,
                    data,
                    status: response?.status,
                    statusText: response?.statusText,
                    message: response?.data,
                });

                console.error(stack);

                return response?.data as ErrorResponse;
            } else {
                throw new Error(`Error making API request: ${error.message}`);
            }
        }
    }

    public async get<T>(url: string, headers?: Record<string, string>) {
        return this.makeRequest<T>(url, "GET", headers);
    }

    public async post<T, B = any>(
        url: string,
        data?: B,
        headers?: Record<string, string>,
    ) {
        return this.makeRequest<T>(url, "POST", data, headers);
    }

    public async put<T, B>(
        url: string,
        data?: B,
        headers?: Record<string, string>,
    ) {
        return this.makeRequest<T>(url, "PUT", data, headers);
    }

    public async delete<T>(url: string, headers?: Record<string, string>) {
        return this.makeRequest<T>(url, "DELETE", headers);
    }

    public async patch<T, B>(
        url: string,
        data?: B,
        headers?: Record<string, string>,
    ) {
        return this.makeRequest<T>(url, "PATCH", data, headers);
    }
}

export default Api;

const aqApi = new Api(apiConfig.baseUrl);

export { aqApi };
