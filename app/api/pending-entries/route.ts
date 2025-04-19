import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

interface ConstructionDetails {
  foundation?: { status?: 'Not Started' | 'In Progress' | 'Completed'; completionDate?: string };
  walls?: { status?: 'Not Started' | 'In Progress' | 'Completed'; completionDate?: string };
  roof?: { status?: 'Not Started' | 'In Progress' | 'Completed'; completionDate?: string };
  finishing?: { status?: 'Not Started' | 'In Progress' | 'Completed'; completionDate?: string };
}

interface PendingEntry {
  id: number;
  beneficiaryName: string;
  constituency?: string;
  village?: string;
  stage?: string;
  progress?: number;
  contactNumber?: string;
  aadharNumber?: string;
  familyMembers?: string;
  assignedOfficer?: string;
  startDate?: string;
  expectedCompletion?: string;
  remarks?: string;
  lat?: number;
  lng?: number;
  images?: string[];
  submittedBy: string;
  submittedOn: string;
  fundDetails?: {
    allocated?: string;
    released?: string;
    utilized?: string;
    remaining?: string;
  };
  constructionDetails?: ConstructionDetails;
  [key: string]: any; 
}

interface PendingEntriesData {
  pendingEntries: PendingEntry[];
}

const pendingEntriesFilePath = path.join(process.cwd(), 'data', 'pending-entries.json');

function calculateProgress(constructionDetails: ConstructionDetails | undefined): number {
  let progress = 0;
  let completedStages = 0;
  const totalStages = 4;

  if (!constructionDetails) {
    return 0;
  }

  const stages = [
    constructionDetails.foundation?.status,
    constructionDetails.walls?.status,
    constructionDetails.roof?.status,
    constructionDetails.finishing?.status,
  ];

  stages.forEach((status) => {
    if (status === 'Completed') {
      completedStages++;
    } else if (status === 'In Progress') {
      progress += 15; 
    }
  });

  progress += (completedStages / totalStages) * (100 - (15 * (totalStages - completedStages))); 
  return Math.min(Math.round(progress), 100);
}

export async function GET(): Promise<NextResponse> {
  try {
    try {
      const fileContents = await readFile(pendingEntriesFilePath, 'utf8');
      const data: PendingEntriesData = JSON.parse(fileContents);
      return NextResponse.json(data);
    } catch (fileError) {
      console.log('No pending-entries.json file found, returning empty array');
      return NextResponse.json({ pendingEntries: [] });
    }
  } catch (error) {
    console.error('Error reading pending entries data:', error);
    return NextResponse.json(
      { error: 'Failed to load pending entries data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const newEntry: Omit<PendingEntry, 'id' | 'progress'> = await request.json();
    let pendingEntries: PendingEntry[] = [];

    try {
      const fileContents = await readFile(pendingEntriesFilePath, 'utf8');
      const data: PendingEntriesData = JSON.parse(fileContents);
      pendingEntries = data.pendingEntries || [];
    } catch (fileError) {
      console.log('Creating new pending-entries.json file');
      pendingEntries = [];
    }

    const calculatedProgress = calculateProgress(newEntry.constructionDetails);

    const maxId = pendingEntries.length > 0
      ? pendingEntries.reduce(
          (max: number, entry: PendingEntry) => (entry.id > max ? entry.id : max),
          100
        )
      : 100;

    const entryWithId: PendingEntry = {
      beneficiaryName: newEntry.beneficiaryName || "",
      submittedBy: newEntry.submittedBy || "Unknown",
      submittedOn: newEntry.submittedOn || new Date().toISOString(),
      ...newEntry,
      progress: calculatedProgress, 
      id: maxId + 1
    };

    pendingEntries.push(entryWithId);

    await writeFile(
      pendingEntriesFilePath,
      JSON.stringify({ pendingEntries }, null, 2),
      'utf8'
    );

    return NextResponse.json({ success: true, entry: entryWithId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error adding pending entry:', errorMessage);

    return NextResponse.json(
      { error: 'Failed to add pending entry' },
      { status: 500 }
    );
  }
}