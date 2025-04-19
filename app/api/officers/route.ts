import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

// Path to the officers data file
const officersFilePath = path.join(process.cwd(), 'data', 'officers.json');

// GET handler to fetch all officers
export async function GET() {
  try {
    const fileContents = await readFile(officersFilePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading officers data:', error);
    return NextResponse.json(
      { error: 'Failed to load officers data' },
      { status: 500 }
    );
  }
}

// POST handler to add a new officer
export async function POST(request: Request) {
  try {
    const newOfficer = await request.json();
    
    // Read current officers data
    const fileContents = await readFile(officersFilePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Generate a new ID for the officer
    const maxId = data.officers.reduce(
      (max: number, officer: any) => (officer.id > max ? officer.id : max),
      0
    );
    
    const officerWithId = {
      ...newOfficer,
      id: maxId + 1
    };
    
    // Add the new officer
    data.officers.push(officerWithId);
    
    // Write back to file
    await writeFile(officersFilePath, JSON.stringify(data, null, 2), 'utf8');
    
    return NextResponse.json({ officer: officerWithId });
  } catch (error) {
    console.error('Error adding officer:', error);
    return NextResponse.json(
      { error: 'Failed to add officer' },
      { status: 500 }
    );
  }
}