// pages/api/auth/google-callback.js
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { accessToken } = req.body;

  try {
    const googleRes = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const userData = googleRes.data;

    const payload = {
      firstName: userData.given_name || "Google",
      lastName: userData.family_name || "User",
      email: userData.email,
      accountName: userData.email.split("@")[0],
      isOAuth: true,
    };

    const backendRes = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/users/signup`,
      payload,
      { headers: { "Content-Type": "application/json" }, withCredentials: true }
    );

    const { token, user } = backendRes.data.data;

    if (!token) throw new Error("No token returned from backend");

    res.setHeader(
      "Set-Cookie",
      `jwt=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=604800`
    );

    res.status(200).json({ success: true, token, user });
  } catch (error) {
    console.error("Google auth failed:", error.response?.data || error.message);
    res
      .status(401)
      .json({ error: error.response?.data?.message || "Invalid Google token" });
  }
}
