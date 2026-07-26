import { NextResponse } from "next/server";
import type { CategoryInput } from "@/entities/category/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { createCategory, readCategories } from "@/shared/server/categories-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

export async function GET() {
  const categories = await readCategories();

  if (await isAdminAuthenticated()) {
    return NextResponse.json(categories);
  }

  const user = await getCurrentUser();
  const canSeeHidden = user?.canAccessHiddenCategories ?? false;

  return NextResponse.json(canSeeHidden ? categories : categories.filter((category) => !category.isHidden));
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json()) as CategoryInput;
  const category = await createCategory(input);

  return NextResponse.json(category, { status: 201 });
}
