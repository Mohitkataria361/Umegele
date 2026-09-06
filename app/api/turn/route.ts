import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(process.env.METER_API!);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch TURN servers" },
        { status: 500 }
      );
    }

    const iceServers = await response.json();

    return NextResponse.json(iceServers);
  } catch (error) {
    console.error("TURN API error:", error);

    return NextResponse.json(
      { error: "Failed to get TURN configuration" },
      { status: 500 }
    );
  }
}