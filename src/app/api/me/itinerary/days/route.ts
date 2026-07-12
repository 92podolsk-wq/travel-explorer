import { NextResponse } from "next/server";
import { addDay } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await addDay(user.id), { status: 201 });
}
