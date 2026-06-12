import { NextResponse } from "next/server";

export async function GET() {
  try {
    const githubToken = process.env.github_token;
    if (!githubToken) {
      throw new Error("GITHUB_TOKEN is not defined in environment variables");
    }

    const githubApiUrl = process.env.GITHUB_API_URL || "https://api.github.com";
    
    const response = await fetch(`${githubApiUrl}/rate_limit`, {
      headers: {
        Authorization: `token ${githubToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching rate limit:", error);
    return NextResponse.json({ error: "Failed to fetch rate limit" }, { status: 500 });
  }
}