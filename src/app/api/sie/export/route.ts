import { NextRequest, NextResponse } from "next/server";
import { generateSIE } from "@/lib/sie/generator";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get("companyId");
  const fiscalYearId = searchParams.get("fiscalYearId");

  if (!companyId || !fiscalYearId) {
    return NextResponse.json(
      { error: "companyId and fiscalYearId are required" },
      { status: 400 }
    );
  }

  try {
    const sieContent = await generateSIE({ companyId, fiscalYearId });

    return new NextResponse(sieContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="export.se"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}
