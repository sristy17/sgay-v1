import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // The params must be awaited before accessing its properties
    const { id } = params; // Extract id from params
    const idNumber = parseInt(id, 10);

    // Read pending entries
    try {
      const filePath = path.join(process.cwd(), "data", "pending-entries.json");
      const fileExists = fs.existsSync(filePath);

      if (!fileExists) {
        return NextResponse.json(
          { error: "No pending entries found" },
          { status: 404 }
        );
      }

      const fileData = fs.readFileSync(filePath, "utf8");
      const pendingEntries = JSON.parse(fileData);

      // Find the entry with the matching ID
      const entry = pendingEntries.find((entry: any) => entry.id === idNumber);

      if (!entry) {
        return NextResponse.json(
          { error: "Pending entry not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(entry);
    } catch (error) {
      console.error("Error reading pending entries file:", error);
      return NextResponse.json(
        { error: "Failed to read pending entries" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}