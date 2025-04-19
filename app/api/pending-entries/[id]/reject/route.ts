import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

// Path to the pending entries data file
const pendingEntriesFilePath = path.join(process.cwd(), 'data', 'pending-entries.json');

// POST handler to reject a pending entry
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    
    // Read pending entries
    try {
      const fileContents = await readFile(pendingEntriesFilePath, 'utf8');
      const data = JSON.parse(fileContents);
      const pendingEntries = data.pendingEntries || [];
      
      // Check if entry exists
      const entryIndex = pendingEntries.findIndex((entry: any) => entry.id === id);
      
      if (entryIndex === -1) {
        return NextResponse.json(
          { error: 'Pending entry not found' },
          { status: 404 }
        );
      }
      
      // Remove the entry from pending entries
      data.pendingEntries = pendingEntries.filter((entry: any) => entry.id !== id);
      
      // Write updated pending entries back to file
      await writeFile(pendingEntriesFilePath, JSON.stringify(data, null, 2), 'utf8');
      
      return NextResponse.json({ success: true });
    } catch (fileError) {
      console.log('No pending-entries.json file found or error reading it');
      return NextResponse.json(
        { error: 'Failed to process pending entry' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error rejecting entry:', error);
    return NextResponse.json(
      { error: 'Failed to reject entry' },
      { status: 500 }
    );
  }
}