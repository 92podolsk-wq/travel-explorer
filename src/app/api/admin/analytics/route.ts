import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import {
  getActivitySummary,
  getTopPoisByFavorites,
  getTopPoisByViews,
  getUserGrowth
} from "@/shared/server/analytics-repository";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [topViewed, topFavorited, userGrowth, activity] = await Promise.all([
    getTopPoisByViews(5),
    getTopPoisByFavorites(5),
    getUserGrowth(30),
    getActivitySummary(7)
  ]);

  return NextResponse.json({ topViewed, topFavorited, userGrowth, activity });
}
