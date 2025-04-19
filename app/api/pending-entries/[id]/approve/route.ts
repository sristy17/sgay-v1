import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

// Define interfaces for type safety
interface PendingEntry {
  id: number;
  originalHouseId?: number; // ID of the original beneficiary (for edits/updates)
  updateType?: string; // "edit", "progress", or undefined for new entries
  beneficiaryName: string;
  constituency?: string;
  village?: string;
  stage?: string;
  progress?: number;
  contactNumber?: string;
  aadharNumber?: string;
  familyMembers?: number;
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
  constructionDetails?: {
    foundation?: {
      status?: string;
      completionDate?: string;
    };
    walls?: {
      status?: string;
      completionDate?: string;
    };
    roof?: {
      status?: string;
      completionDate?: string;
    };
    finishing?: {
      status?: string;
      completionDate?: string;
    };
  };
  [key: string]: any;
}

interface Beneficiary {
  id: number;
  beneficiaryName: string;
  constituency?: string;
  village?: string;
  stage?: string;
  progress?: number;
  contactNumber?: string;
  aadharNumber?: string;
  familyMembers?: number;
  assignedOfficer?: string;
  startDate?: string;
  expectedCompletion?: string;
  remarks?: string;
  lat?: number;
  lng?: number;
  images?: string[];
  lastUpdated?: string;
  fundDetails?: {
    allocated?: string;
    released?: string;
    utilized?: string;
    remaining?: string;
  };
  constructionDetails?: {
    foundation?: {
      status?: string;
      completionDate?: string;
    };
    walls?: {
      status?: string;
      completionDate?: string;
    };
    roof?: {
      status?: string;
      completionDate?: string;
    };
    finishing?: {
      status?: string;
      completionDate?: string;
    };
  };
  [key: string]: any;
}

interface Officer {
  id: number;
  name: string;
  assignedHouses?: number[];
  [key: string]: any;
}

// Paths to data files
const pendingEntriesFilePath = path.join(process.cwd(), 'data', 'pending-entries.json');
const beneficiariesFilePath = path.join(process.cwd(), 'data', 'beneficiaries.json');
const officersFilePath = path.join(process.cwd(), 'data', 'officers.json');

// POST handler to approve a pending entry
export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const entryId = parseInt(id, 10);
    
    // Read pending entries
    let pendingEntries: PendingEntry[] = [];
    let approvedEntry: PendingEntry | null = null;
    
    try {
      const fileContents = await readFile(pendingEntriesFilePath, 'utf8');
      const data = JSON.parse(fileContents);
      pendingEntries = data.pendingEntries || [];
      
      // Find the entry to approve
      approvedEntry = pendingEntries.find((entry) => entry.id === entryId) || null;
      
      if (!approvedEntry) {
        return NextResponse.json(
          { error: 'Pending entry not found' },
          { status: 404 }
        );
      }
      
      // Remove the entry from pending entries
      data.pendingEntries = pendingEntries.filter((entry) => entry.id !== entryId);
      
      // Write updated pending entries back to file
      await writeFile(pendingEntriesFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (fileError) {
      console.error('Error processing pending entry:', fileError);
      return NextResponse.json(
        { error: 'Failed to process pending entry' },
        { status: 500 }
      );
    }
    
    // Process the approved entry
    if (approvedEntry) {
      try {
        // Read beneficiaries file
        let beneficiariesData: { beneficiaries: Beneficiary[] } = { beneficiaries: [] };
        
        try {
          const beneficiariesContent = await readFile(beneficiariesFilePath, 'utf8');
          beneficiariesData = JSON.parse(beneficiariesContent);
        } catch (readError) {
          // If file doesn't exist, create new structure
          beneficiariesData = { beneficiaries: [] };
        }
        
        let resultBeneficiary: Beneficiary;
        
        // Check if this is an update to existing beneficiary or a new one
        if (approvedEntry.updateType && approvedEntry.originalHouseId) {
          // This is an update to existing beneficiary
          const existingIndex = beneficiariesData.beneficiaries.findIndex(
            (b) => b.id === approvedEntry.originalHouseId
          );
          
          if (existingIndex >= 0) {
            // Update the existing beneficiary
            const updatedBeneficiary: Beneficiary = {
              ...beneficiariesData.beneficiaries[existingIndex],
              beneficiaryName: approvedEntry.beneficiaryName,
              constituency: approvedEntry.constituency,
              village: approvedEntry.village,
              stage: approvedEntry.stage,
              progress: approvedEntry.progress,
              contactNumber: approvedEntry.contactNumber,
              aadharNumber: approvedEntry.aadharNumber,
              familyMembers: approvedEntry.familyMembers,
              assignedOfficer: approvedEntry.assignedOfficer,
              startDate: approvedEntry.startDate,
              expectedCompletion: approvedEntry.expectedCompletion,
              remarks: approvedEntry.remarks,
              lat: approvedEntry.lat,
              lng: approvedEntry.lng,
              images: approvedEntry.images,
              lastUpdated: new Date().toISOString().split("T")[0],
              fundDetails: approvedEntry.fundDetails,
              constructionDetails: approvedEntry.constructionDetails,
            };
            
            beneficiariesData.beneficiaries[existingIndex] = updatedBeneficiary;
            resultBeneficiary = updatedBeneficiary;
          } else {
            return NextResponse.json(
              { error: 'Original beneficiary not found' },
              { status: 404 }
            );
          }
        } else {
          // This is a new beneficiary
          const maxId = beneficiariesData.beneficiaries.length > 0
            ? beneficiariesData.beneficiaries.reduce(
                (max: number, b: Beneficiary) => (typeof b.id === 'number' && b.id > max ? b.id : max),
                0
              )
            : 0;
          
          const newBeneficiary: Beneficiary = {
            id: maxId + 1,
            beneficiaryName: approvedEntry.beneficiaryName,
            constituency: approvedEntry.constituency,
            village: approvedEntry.village,
            stage: approvedEntry.stage || "Not Started",
            progress: typeof approvedEntry.progress === 'number' ? approvedEntry.progress : 0,
            contactNumber: approvedEntry.contactNumber || "",
            aadharNumber: approvedEntry.aadharNumber || "",
            familyMembers: approvedEntry.familyMembers || 0,
            assignedOfficer: approvedEntry.assignedOfficer || "",
            startDate: approvedEntry.startDate || "",
            expectedCompletion: approvedEntry.expectedCompletion || "",
            remarks: approvedEntry.remarks || "",
            lat: approvedEntry.lat,
            lng: approvedEntry.lng,
            images: approvedEntry.images || [],
            lastUpdated: new Date().toISOString().split("T")[0],
            fundDetails: approvedEntry.fundDetails || {},
            constructionDetails: approvedEntry.constructionDetails || {
              foundation: { status: "Not Started" },
              walls: { status: "Not Started" },
              roof: { status: "Not Started" },
              finishing: { status: "Not Started" },
            },
          };
          
          beneficiariesData.beneficiaries.push(newBeneficiary);
          resultBeneficiary = newBeneficiary;
        }
        
        // Write updated beneficiaries back to file
        await writeFile(beneficiariesFilePath, JSON.stringify(beneficiariesData, null, 2), 'utf8');
        
        // Update officer's assignedHouses array for new beneficiary
        if (!approvedEntry.updateType && approvedEntry.assignedOfficer) {
          try {
            const officersContent = await readFile(officersFilePath, 'utf8');
            const officersData = JSON.parse(officersContent);
            
            const officerIndex = officersData.officers.findIndex(
              (officer: Officer) => officer.name === approvedEntry.assignedOfficer
            );
            
            if (officerIndex >= 0) {
              if (!Array.isArray(officersData.officers[officerIndex].assignedHouses)) {
                officersData.officers[officerIndex].assignedHouses = [];
              }
              
              officersData.officers[officerIndex].assignedHouses.push(resultBeneficiary.id);
              
              await writeFile(officersFilePath, JSON.stringify(officersData, null, 2), 'utf8');
            }
          } catch (officerError) {
            console.error('Error updating officer assignedHouses:', officerError);
          }
        }
        
        return NextResponse.json({
          success: true,
          message: approvedEntry.updateType 
            ? 'Updates approved and applied to beneficiary' 
            : 'New beneficiary approved and added to database',
          beneficiary: resultBeneficiary,
        });
      } catch (error) {
        console.error('Error updating beneficiaries:', error);
        return NextResponse.json(
          { error: 'Failed to apply approved changes' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'No entry data found to approve',
    }, { status: 400 });
  } catch (error) {
    console.error('Error in approval process:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}