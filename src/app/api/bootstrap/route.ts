import { NextResponse } from "next/server";
import { getBootstrapData } from "@/shared/server/bootstrap";

export async function GET() {
  const data = await getBootstrapData();

  return NextResponse.json(data, {
    headers: { "Access-Control-Allow-Origin": "*" }
  });
}
