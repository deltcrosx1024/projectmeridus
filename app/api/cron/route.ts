import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(`${process.env.GITHUB_API_URL}/rate_limit`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching rate limit:", error);
    return NextResponse.json({ error: "Failed to fetch rate limit" }, { status: 500 });
  }
}