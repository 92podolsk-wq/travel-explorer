import { NextResponse } from "next/server";
import type { CountryInput } from "@/entities/country/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { createCountry, readCountries } from "@/shared/server/countries-repository";

export async function GET() {
  return NextResponse.json(await readCountries());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json()) as CountryInput;
  const country = await createCountry(input);

  return NextResponse.json(country, { status: 201 });
}
