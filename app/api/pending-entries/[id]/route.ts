import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

// Define the interface for a pending entry
interface PendingEntry {
  id: number;
  [key: string]: any; // Allow for other properties
}

// Path to the pending entries data file
const pendingEntriesFilePath = path.join(process.cwd(), 'data', 'pending-entries.json');

// GET handler to fetch a specific pending entry
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Properly extract id from context.params to fix the warning
    const { id: idString } = context.params; // Extract as a string first
    const id = parseInt(idString, 10);
    
    // Read pending entries
    try {
      const fileContents = await readFile(pendingEntriesFilePath, 'utf8');
      const data = JSON.parse(fileContents);
      const pendingEntries = data.pendingEntries || [];
      
      // Find the requested entry - Fix by adding proper type to the entry parameter
      const entry = pendingEntries.find((entry: PendingEntry) => entry.id === id);
      
      if (!entry) {
        return NextResponse.json(
          { error: 'Pending entry not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ entry });
    } catch (fileError) {
      console.log('No pending-entries.json file found or error reading it');
      return NextResponse.json(
        { error: 'Failed to find pending entry' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error fetching pending entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending entry' },
      { status: 500 }
    );
  }
}