import { NextResponse } from "next/server";

/**
 * Handle Discord OAuth callback
 * Exchanges code for access token
 */
export async function handleDiscord(code: string, request: Request) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Discord OAuth not configured");
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback?service=discord`;

  const tokenResp = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const tokenJson = await tokenResp.json();
  
  if (tokenJson.error) {
    console.error("[Discord Token Error]", tokenJson);
    throw new Error(tokenJson.error_description || tokenJson.error);
  }

  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    throw new Error("No access token returned from Discord");
  }

  // Validate token by fetching user info
  const userResp = await fetch("https://discord.com/api/v10/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResp.ok) {
    const errData = await userResp.json();
    console.error("[Discord User Fetch Error]", errData);
    throw new Error(`Failed to fetch Discord user info: ${userResp.statusText}`);
  }

  const user = await userResp.json();
  
  if (!user.id) {
    console.error("[Discord User Data]", user);
    throw new Error("Invalid Discord user data");
  }

  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.set("discord_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  // Store user info
  res.cookies.set("discord_user", JSON.stringify({ id: user.id, username: user.username }), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
