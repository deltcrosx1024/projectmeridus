import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { linkUser } from "@/app/lib/userLinks";

const BOT_CLIENT_ID = "1468966026304557125";
const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${BOT_CLIENT_ID}&permissions=8&response_type=code&redirect_uri=https%3A%2F%2Fwww.meridusdev.in.th%2Fapi%2Fauth%2Fcallback%3Fservice%3Ddiscord&integration_type=0&scope=webhook.incoming+applications.commands+bot`;

/**
 * Check if user has the bot on any server they administer
 */
async function checkBotInUserGuilds(accessToken: string): Promise<boolean> {
  try {
    // Fetch user's guilds (servers)
    const guildsResp = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!guildsResp.ok) {
      console.error("[Discord] Failed to fetch guilds:", guildsResp.status);
      return false;
    }

    const guilds = await guildsResp.json();

    // Filter guilds where user has admin or manage server permissions
    // Permissions bitwise: ADMINISTRATOR = 0x8, MANAGE_GUILD = 0x20
    const adminGuilds = guilds.filter((guild: any) => {
      const permissions = BigInt(guild.permissions);
      const hasAdmin = (permissions & BigInt(0x8)) !== BigInt(0);
      const hasManageGuild = (permissions & BigInt(0x20)) !== BigInt(0);
      const isOwner = guild.owner === true;
      return isOwner || hasAdmin || hasManageGuild;
    });

    if (adminGuilds.length === 0) {
      console.log("[Discord] User is not admin of any guilds");
      return false;
    }

    // Check if bot is in any of these guilds
    for (const guild of adminGuilds) {
      try {
        // Try to fetch bot member from guild - this requires bot token
        // Instead, we'll check by trying to get guild info with bot token
        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
          console.error("[Discord] No bot token to check guild membership");
          continue;
        }

        const botGuildCheck = await fetch(
          `https://discord.com/api/v10/guilds/${guild.id}/members/${BOT_CLIENT_ID}`,
          {
            headers: {
              Authorization: `Bot ${botToken}`,
            },
          }
        );

        if (botGuildCheck.ok) {
          console.log(`[Discord] Bot found in guild ${guild.name} (${guild.id})`);
          return true;
        }
      } catch (err) {
        // Bot not in this guild, continue checking
      }
    }

    console.log("[Discord] Bot not found in any admin guilds");
    return false;
  } catch (error) {
    console.error("[Discord] Error checking guilds:", error);
    return false;
  }
}

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

  // Use fixed redirect URI from environment (must match Discord Developer Portal)
  // Include ?service=discord query parameter to match the configured redirect URI
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/callback?service=discord`;

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

  // Check if bot is already in user's admin guilds
  const hasBot = await checkBotInUserGuilds(accessToken);

  if (!hasBot) {
    // Bot not found - redirect to invite with cookies set first
    console.log("[Discord] Bot not in guilds, redirecting to invite");

    const res = NextResponse.redirect(BOT_INVITE_URL);

    // Set cookies before redirecting
    res.cookies.set("discord_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set("discord_user", JSON.stringify({ id: user.id, username: user.username }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Check GitHub link before redirect
    const cookieStore = await cookies();
    const githubToken = cookieStore.get("github_token")?.value;
    const githubUserCookie = cookieStore.get("github_user")?.value;

    if (githubToken && user.id) {
      try {
        let githubUsername: string | undefined;
        if (githubUserCookie) {
          const githubUser = JSON.parse(githubUserCookie);
          githubUsername = githubUser.login;
        }

        await linkUser(user.id, githubToken, {
          discordUsername: user.username,
          githubUsername,
        });

        console.log(`[Discord OAuth] Linked Discord ${user.id} to GitHub before bot invite`);
      } catch (err) {
        console.error("[Discord OAuth] Failed to link accounts:", err);
      }
    }

    return res;
  }

  // Bot already in guilds - proceed to home
  console.log("[Discord] Bot already in user's guilds, redirecting to home");

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

  // Check if user already has GitHub linked - if so, link them together
  const cookieStore = await cookies();
  const githubToken = cookieStore.get("github_token")?.value;
  const githubUserCookie = cookieStore.get("github_user")?.value;
  
  if (githubToken && user.id) {
    try {
      let githubUsername: string | undefined;
      if (githubUserCookie) {
        const githubUser = JSON.parse(githubUserCookie);
        githubUsername = githubUser.login;
      }
      
      await linkUser(user.id, githubToken, {
        discordUsername: user.username,
        githubUsername,
      });
      
      console.log(`[Discord OAuth] Linked Discord ${user.id} to GitHub`);
      
      // Set a cookie to indicate successful linking
      res.cookies.set("accounts_linked", "true", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 5, // 5 minutes - just for notification
      });
    } catch (err) {
      console.error("[Discord OAuth] Failed to link accounts:", err);
    }
  }

  return res;
}
