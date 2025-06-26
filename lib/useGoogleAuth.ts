// // lib/useGoogleAuth.ts
// "use client";

// import { useGoogleLogin, googleLogout } from "@react-oauth/google";
// import axios from "axios";
// import { setAuthToken } from "./api";

// const BACKEND_URL =
//   process.env.NEXT_PUBLIC_API_BASE_URL ||
//   "https://fifthlab-collaboration.onrender.com";

// type SuccessHandler = (data: {
//   success: boolean;
//   token: string;
//   user: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     accountName?: string;
//   };
// }) => void;
// type ErrorHandler = (error: unknown) => void;

// export const useGoogleAuth = () => {
//   const login = useGoogleLogin({
//     onSuccess: async (
//       tokenResponse
//     ): Promise<{
//       success: boolean;
//       token: string;
//       user: {
//         id: string;
//         firstName: string;
//         lastName: string;
//         email: string;
//         accountName?: string;
//       };
//     }> => {
//       try {
//         const res = await axios.post(
//           `${BACKEND_URL}/api/auth/google-callback`,
//           { accessToken: tokenResponse.access_token },
//           {
//             headers: { "Content-Type": "application/json" },
//             withCredentials: true,
//           }
//         );
//         setAuthToken(res.data.token);
//         return res.data;
//       } catch (error) {
//         throw error;
//       }
//     },
//     onError: (error) => {
//       throw new Error(error.error_description || "Google login failed");
//     },
//     flow: "implicit",
//   });

//   const handleGoogleLogin = async (
//     onSuccess: SuccessHandler,
//     onError: ErrorHandler
//   ) => {
//     try {
//       const data = await login(); // Now typed correctly
//       onSuccess(data);
//     } catch (error) {
//       onError(error);
//     }
//   };

//   const handleGoogleLogout = async () => {
//     try {
//       googleLogout();
//       await axios.post(
//         `${BACKEND_URL}/api/v1/users/logout`,
//         {},
//         {
//           headers: { "Content-Type": "application/json" },
//           withCredentials: true,
//         }
//       );
//       setAuthToken();
//     } catch (error) {
//       console.error("Google logout failed:", error);
//     }
//   };

//   return { handleGoogleLogin, handleGoogleLogout };
// };
