import { NextResponse } from "next/server";
import { AIObservatoryEngine } from "@/lib/ai-trust/observatory/AIObservatoryEngine.js";

export async function GET() {
  try {
    const telemetrySnapshot = AIObservatoryEngine.getObservatorySnapshot();
    return NextResponse.json(telemetrySnapshot, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to retrieve AI Observatory snapshot", message: err.message },
      { status: 500 }
    );
  }
}
