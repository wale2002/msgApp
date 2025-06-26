import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

type SuccessHandler = (data: any) => void; // Replace `any` with a specific type if you know the structure
type ErrorHandler = (error: unknown) => void;

export const handleGoogleLogin = async (
  onSuccess: SuccessHandler,
  onError: ErrorHandler
) => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await axios.post("/api/auth/google-callback", {
          accessToken: tokenResponse.access_token,
        });
        onSuccess(res.data);
      } catch (error) {
        onError(error);
      }
    },
    onError: (error) => onError(error),
    flow: "implicit",
  });
  login();
};
