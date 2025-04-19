"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge" // Add this import
import { useToast } from "@/components/ui/use-toast"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Check, Edit, PlusCircle, Trash2, Loader2, MoreVertical, Eye } from "lucide-react"
import { useAppContext } from "@/lib/app-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

// Define types for better type safety
interface Officer {
  id: number;
  name: string;
  email: string;
  contactNumber: string;
  constituency: string;
  assignedHouses: number[];
  role: string;
}

interface ConstructionStage {
  status?: string;
  completionDate?: string;
}

interface FundDetails {
  allocated?: string;
  released?: string;
  utilized?: string;
  remaining?: string;
}

interface ConstructionDetails {
  foundation?: ConstructionStage;
  walls?: ConstructionStage;
  roof?: ConstructionStage;
  finishing?: ConstructionStage;
}

// Update the PendingEntry interface definition to include updateType
interface PendingEntry {
  id: number;
  originalHouseId?: number; // ID of the original beneficiary (for edits/updates)
  updateType?: string; // "edit", "progress", or undefined for new entries
  beneficiaryName: string;
  constituency: string;
  village: string;
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
  status?: string;
  constructionDetails?: ConstructionDetails;
  fundDetails?: FundDetails;
}

interface FormData {
  name: string;
  email: string;
  contactNumber: string;
  constituency: string;
  password: string;
}

// Helper function to fetch officers from JSON file
async function fetchOfficers(): Promise<Officer[]> {
  try {
    const response = await fetch('/api/officers');
    if (!response.ok) {
      throw new Error('Failed to fetch officers');
    }
    const data = await response.json();
    return data.officers || [];
  } catch (error) {
    console.error("Error fetching officers:", error);
    return [];
  }
}

// Helper function to fetch pending entries
async function fetchPendingEntries(): Promise<PendingEntry[]> {
  try {
    const response = await fetch('/api/pending-entries');
    if (!response.ok) {
      throw new Error('Failed to fetch pending entries');
    }
    const data = await response.json();
    return data.pendingEntries || [];
  } catch (error) {
    console.error("Error fetching pending entries:", error);
    return [];
  }
}

// Helper function to add a new officer
async function addOfficer(officerData: Omit<Officer, 'id'>): Promise<Officer> {
  try {
    const response = await fetch('/api/officers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(officerData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add officer');
    }
    
    const result = await response.json();
    return result.officer;
  } catch (error) {
    console.error("Error adding officer:", error);
    throw error;
  }
}

// Helper function to remove an officer
async function removeOfficer(officerId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/officers/${officerId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove officer');
    }
    
    return true;
  } catch (error) {
    console.error("Error removing officer:", error);
    throw error;
  }
}

// Helper function to approve an entry
async function approveEntry(entryId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/pending-entries/${entryId}/approve`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to approve entry');
    }
    
    return true;
  } catch (error) {
    console.error("Error approving entry:", error);
    throw error;
  }
}

// Helper function to reject an entry
async function rejectEntry(entryId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/pending-entries/${entryId}/reject`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to reject entry');
    }
    
    return true;
  } catch (error) {
    console.error("Error rejecting entry:", error);
    throw error;
  }
}

export default function AdminPanel() {
  const [selectedTab, setSelectedTab] = useState("officers")
  const [officers, setOfficers] = useState<Officer[]>([])
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAppContext()
  const [selectedEntry, setSelectedEntry] = useState<PendingEntry | null>(null);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);

  // Fetch officers and pending entries on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Fetch officers from JSON file via API route
        const officersData = await fetchOfficers();
        setOfficers(officersData);
        
        // Fetch pending entries from API
        const entriesData = await fetchPendingEntries();
        setPendingEntries(entriesData);
      } catch (error) {
        console.error("Failed to fetch admin data:", error)
        toast({
          title: "Error",
          description: "Failed to load admin panel data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [toast])

  // Check if user is admin - if not, show access denied
  if (user?.role !== "admin") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You do not have permission to access the admin panel.</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    )
  }

  // Function to add a new officer
  const handleAddOfficer = async (formData: FormData): Promise<boolean> => {
    try {
      const newOfficerData = {
        name: formData.name,
        email: formData.email,
        contactNumber: formData.contactNumber,
        constituency: formData.constituency,
        password: formData.password,
        role: "officer",
        assignedHouses: [] 
      };
      
      // Send request to API to add officer
      const newOfficer = await addOfficer(newOfficerData);
      
      // Update local state
      setOfficers(prevOfficers => [...prevOfficers, newOfficer]);
      
      toast({
        title: "Success",
        description: "Field officer added successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Failed to add officer:", error);
      toast({
        title: "Error",
        description: "Failed to add field officer",
        variant: "destructive"
      });
      return false;
    }
  }

  // Function to remove an officer
  const handleRemoveOfficer = async (officerId: number): Promise<void> => {
    try {
      // Send request to API to remove officer
      await removeOfficer(officerId);
      
      // Update local state
      setOfficers(prevOfficers => prevOfficers.filter(officer => officer.id !== officerId));
      
      toast({
        title: "Success",
        description: "Field officer removed successfully",
      });
    } catch (error) {
      console.error("Failed to remove officer:", error);
      toast({
        title: "Error",
        description: "Failed to remove field officer",
        variant: "destructive"
      });
    }
  }

  // Function to approve an entry
  const handleApproveEntry = async (entryId: number): Promise<void> => {
    try {
      // Send request to API to approve entry
      await approveEntry(entryId);
      
      // Update local state
      setPendingEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === entryId ? { ...entry, status: "approved" } : entry
        )
      );
      
      toast({
        title: "Success",
        description: "Entry approved successfully",
      });
      
      // After a brief delay, remove from pending list
      setTimeout(() => {
        setPendingEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
      }, 2000);
    } catch (error) {
      console.error("Failed to approve entry:", error);
      toast({
        title: "Error",
        description: "Failed to approve entry",
        variant: "destructive"
      });
    }
  }

  // Function to reject an entry
  const handleRejectEntry = async (entryId: number): Promise<void> => {
    try {
      // Send request to API to reject entry
      await rejectEntry(entryId);
      
      // Update local state
      setPendingEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === entryId ? { ...entry, status: "rejected" } : entry
        )
      );
      
      toast({
        title: "Entry Rejected",
        description: "Entry has been rejected",
      });
      
      // After a brief delay, remove from pending list
      setTimeout(() => {
        setPendingEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
      }, 2000);
    } catch (error) {
      console.error("Failed to reject entry:", error);
      toast({
        title: "Error",
        description: "Failed to reject entry",
        variant: "destructive"
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Admin Panel</h2>
          <p className="text-muted-foreground">Manage field officers and approve entries</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="officers" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="officers">Field Officers</TabsTrigger>
              <TabsTrigger value="entries">Pending Entries</TabsTrigger>
            </TabsList>
            
            {/* Field Officers Tab */}
            <TabsContent value="officers" className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Field Officers</h3>
                <AddOfficerDialog onAddOfficer={handleAddOfficer} />
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <p>Loading field officers...</p>
                </div>
              ) : officers.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Constituency</TableHead>
                        <TableHead>Assigned Houses</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {officers.map((officer) => (
                        <TableRow key={officer.id}>
                          <TableCell className="font-medium">{officer.name}</TableCell>
                          <TableCell>{officer.email}</TableCell>
                          <TableCell>{officer.contactNumber}</TableCell>
                          <TableCell>{officer.constituency}</TableCell>
                          <TableCell>
                            {Array.isArray(officer.assignedHouses) ? officer.assignedHouses.length : 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveOfficer(officer.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex justify-center py-10 border rounded-md">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">No field officers found</p>
                    <AddOfficerDialog onAddOfficer={handleAddOfficer} />
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Pending Entries Tab */}
            <TabsContent value="entries" className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold">Pending Approval Entries</h3>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <p>Loading pending entries...</p>
                </div>
              ) : pendingEntries.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Beneficiary</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Submitted On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.beneficiaryName}</TableCell>
                          <TableCell>
                            {entry.updateType === "Edit" ? (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                Edit
                              </Badge>
                            ) : entry.updateType === "Progress" ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                Progress
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                                New Entry
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{entry.village}, {entry.constituency}</TableCell>
                          <TableCell>{entry.stage || 'Not Started'}</TableCell>
                          <TableCell>{entry.progress || 0}%</TableCell>
                          <TableCell>{entry.submittedBy}</TableCell>
                          <TableCell>{formatDate(entry.submittedOn)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1"
                                onClick={() => handleApproveEntry(entry.id)}
                                disabled={entry.status === "approved"}
                              >
                                <Check className="h-4 w-4" />
                                {entry.status === "approved" ? "Approved" : "Approve"}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedEntry(entry);
                                    setIsEntryDialogOpen(true);
                                  }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Quick Review
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/pending/${entry.id}`}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      View Full Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive" 
                                    onClick={() => handleRejectEntry(entry.id)}
                                    disabled={entry.status === "rejected"}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Reject Entry
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex justify-center py-10 border rounded-md">
                  <p className="text-muted-foreground">No pending entries found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {selectedEntry && (
        <ViewEntryDialog 
          isOpen={isEntryDialogOpen} 
          setIsOpen={setIsEntryDialogOpen} 
          entry={selectedEntry} 
          onApprove={() => handleApproveEntry(selectedEntry.id)} 
          onReject={() => handleRejectEntry(selectedEntry.id)} 
        />
      )}
    </div>
  )
}

// Dialog for adding a new field officer
interface AddOfficerDialogProps {
  onAddOfficer: (formData: FormData) => Promise<boolean>;
}

function AddOfficerDialog({ onAddOfficer }: AddOfficerDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    contactNumber: "",
    constituency: "",
    password: ""
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const success = await onAddOfficer(formData)
      if (success) {
        setIsOpen(false)
        setFormData({
          name: "",
          email: "",
          contactNumber: "",
          constituency: "",
          password: ""
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Field Officer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Field Officer</DialogTitle>
          <DialogDescription>
            Add a new field officer to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactNumber">Phone Number</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="constituency">Constituency</Label>
              <Select
                value={formData.constituency}
                onValueChange={(value) => handleSelectChange("constituency", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="constituency">
                  <SelectValue placeholder="Select constituency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="East Sikkim">East Sikkim</SelectItem>
                  <SelectItem value="West Sikkim">West Sikkim</SelectItem>
                  <SelectItem value="North Sikkim">North Sikkim</SelectItem>
                  <SelectItem value="South Sikkim">South Sikkim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Temporary Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Officer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Dialog for viewing entry details
interface ViewEntryDialogProps {
  entry: PendingEntry;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

function ViewEntryDialog({ entry, onApprove, onReject, isOpen, setIsOpen }: ViewEntryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await onApprove()
      setIsOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleReject = async () => {
    setIsSubmitting(true)
    try {
      await onReject()
      setIsOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!entry) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Entry Details</DialogTitle>
          <DialogDescription>
            Review entry information before approval or rejection.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Beneficiary Name</p>
              <p className="text-sm text-muted-foreground">{entry.beneficiaryName}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-muted-foreground">{entry.village}, {entry.constituency}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Stage</p>
              <p className="text-sm text-muted-foreground">{entry.stage || "Not Started"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Progress</p>
              <p className="text-sm text-muted-foreground">{entry.progress || 0}%</p>
            </div>
            <div>
              <p className="text-sm font-medium">Submitted By</p>
              <p className="text-sm text-muted-foreground">{entry.submittedBy}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Submitted On</p>
              <p className="text-sm text-muted-foreground">{formatDate(entry.submittedOn)}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-1">Remarks</p>
            <p className="text-sm text-muted-foreground border rounded-md p-2">
              {entry.remarks || "No remarks provided"}
            </p>
          </div>
          
          {entry.images && entry.images.length > 0 ? (
            <div>
              <p className="text-sm font-medium mb-1">Photos</p>
              <div className="grid grid-cols-3 gap-2">
                {entry.images.map((image, i) => (
                  <div key={i} className="aspect-video bg-muted rounded overflow-hidden">
                    <img 
                      src={image} 
                      alt={`Photo ${i+1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium mb-1">Photos</p>
              <p className="text-sm text-muted-foreground">No photos available</p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting || entry.status === "rejected"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : entry.status === "rejected" ? "Rejected" : "Reject"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Close
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting || entry.status === "approved"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : entry.status === "approved" ? "Approved" : "Approve"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to format dates
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}