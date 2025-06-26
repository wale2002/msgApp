"use client";

import { useRouter } from "next/router";
import AuthPage, { FormData } from "../comps/AuthPage";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  login,
  signup,
  logout,
  forgotPassword,
  resetPassword,
  setAuthToken,
  ApiResponse,
} from "../lib/api";
import { AxiosResponse } from "axios";

export default function Auth() {
  const router = useRouter();
  const { token } = router.query;

  const handleAuth = async (
    formData: FormData,
    isSignup: boolean,
    isReset: boolean = false,
    isForgot: boolean = false
  ): Promise<{ success: boolean; message: string }> => {
    try {
      let res: AxiosResponse<ApiResponse>;
      if (isSignup) {
        console.log("Signup attempt:", formData);
        res = await signup({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          accountName: formData.accountName,
          password: formData.password,
        });
      } else if (isReset && token) {
        console.log("Reset password attempt:", {
          token,
          password: formData.password,
        });
        res = await resetPassword(token as string, {
          password: formData.password,
        });
      } else if (isForgot) {
        console.log("Forgot password attempt:", { email: formData.email });
        res = await forgotPassword({ email: formData.email });
      } else {
        console.log("Login attempt:", { email: formData.email });
        res = await login({
          email: formData.email,
          password: formData.password,
        });
      }

      if (res.data.success && res.data.token) {
        setAuthToken(res.data.token);
        console.log("Token set:", res.data.token.substring(0, 10) + "...");
      }

      return {
        success: res.data.success,
        message:
          res.data.message ||
          (isSignup
            ? "Signup successful"
            : isReset
            ? "Password reset successful"
            : isForgot
            ? "Reset link sent"
            : "Login successful"),
      };
    } catch (err: any) {
      console.error("Auth error:", err.message, err.response?.data);
      throw new Error(err.message || "Authentication failed");
    }
  };

  const handleLogout = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const res = await logout();
      return {
        success: res.data.success,
        message: res.data.message || "Logged out successfully",
      };
    } catch (err: any) {
      console.error("Logout error:", err.response?.data || err.message);
      throw new Error(err.response?.data?.message || "Logout failed");
    }
  };

  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
    >
      <AuthPage onSubmit={handleAuth} onLogout={handleLogout} />
    </GoogleOAuthProvider>
  );
}
