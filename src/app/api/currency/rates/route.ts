import { NextRequest, NextResponse } from "next/server";
import { getExchangeRateAPI } from "@/lib/currencyService";

export async function GET(request: NextRequest) {
  try {
    const result = await getExchangeRateAPI();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        rates: result.rates,
        lastUpdate: result.lastUpdate
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Currency API error:", error);
    return NextResponse.json({
      success: false,
      error: "Döviz kurları alınamadı"
    }, { status: 500 });
  }
}
