import { fetchWebpageMetadata } from "@/lib/metadata";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  try {
    const metadata = await fetchWebpageMetadata(url);
    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch webpage metadata" },
      { status: 500 },
    );
  }
}
