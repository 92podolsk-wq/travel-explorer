import { NextResponse } from "next/server";
import type { CountryInput } from "@/entities/country/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { deleteCountry, updateCountry } from "@/shared/server/countries-repository";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const input = (await request.json()) as CountryInput;
  const updated = updateCountry(id, input);

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = deleteCountry(id);

  if (!result.success) {
    if (result.reason === "not-found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: `Не удалось удалить: за этой страной закреплено регионов — ${result.areaCount}.` },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
