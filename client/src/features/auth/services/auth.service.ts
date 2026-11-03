import { apiClient } from "@/lib/api/client";
import type { AuthResponse, LoginInput, SignupInput, User } from "../types/auth.types";

export const authService = {
  async signup(input: SignupInput): Promise<User> {
    const { data } = await apiClient.post<AuthResponse>("/auth/signup", input);
    return data.user;
  },

  async login(input: LoginInput): Promise<User> {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", input);
    return data.user;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<AuthResponse>("/auth/me");
    return data.user;
  },
};
