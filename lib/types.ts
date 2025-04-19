export interface House {
  id: number
  beneficiaryName: string
  constituency: string
  village: string
  stage: string
  progress: number
  lat: number
  lng: number
  images: string[]
  lastUpdated: string
  startDate: string
  expectedCompletion: string
  contactNumber: string
  aadharNumber: string
  familyMembers: number
  assignedOfficer: string
  remarks: string
  fundDetails: {
    allocated: string
    released: string
    utilized: string
    remaining: string
  }
  constructionDetails: {
    foundation: {
      status: "Not Started" | "In Progress" | "Completed"
      completionDate?: string
    }
    walls: {
      status: "Not Started" | "In Progress" | "Completed"
      completionDate?: string
    }
    roof: {
      status: "Not Started" | "In Progress" | "Completed"
      completionDate?: string
    }
    finishing: {
      status: "Not Started" | "In Progress" | "Completed"
      completionDate?: string
    }
  }
}

export interface Officer {
  id: number
  name: string
  designation: string
  constituency: string
  contactNumber: string
  email: string
  assignedHouses: number[]
}

export type ConstructionStage = "Not Started" | "Foundation" | "Walls" | "Roof" | "Finishing" | "Completed" | "Delayed"

export interface PendingEntry {
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
}

