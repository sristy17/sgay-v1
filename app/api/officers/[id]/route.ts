import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

// Path to the officers data file
const officersFilePath = path.join(process.cwd(), 'data', 'officers.json');

// DELETE handler to remove an officer
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    
    // Read current officers data
    const fileContents = await readFile(officersFilePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Filter out the officer to delete
    data.officers = data.officers.filter((officer: any) => officer.id !== id);
    
    // Write back to file
    await writeFile(officersFilePath, JSON.stringify(data, null, 2), 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing officer:', error);
    return NextResponse.json(
      { error: 'Failed to remove officer' },
      { status: 500 }
    );
  }
}