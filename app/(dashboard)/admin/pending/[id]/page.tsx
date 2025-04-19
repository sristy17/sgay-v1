"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { ArrowLeft, Calendar, CheckCircle, Clock, Edit, Home, IndianRupee, MapPin, Phone, User, Check, X, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAppContext } from "@/lib/app-context"

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

interface PendingEntry {
  id: number;
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
  constructionDetails?: ConstructionDetails;
  fundDetails?: FundDetails;
}

interface PageParams {
  params: { id: string };
}

export default function PendingEntryDetailsPage({ params }: PageParams) {
  const { id } = params;
  
  const [entry, setEntry] = useState<PendingEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAppContext();

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`/api/pending-entries/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch entry details');
        }
        const data = await response.json();
        setEntry(data.entry);
      } catch (error) {
        console.error("Failed to fetch pending entry details:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load entry details"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, toast]);

  // Function to approve the entry
  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/pending-entries/${id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve entry');
      }

      toast({
        title: "Success",
        description: "Entry approved and added to beneficiaries",
      });

      // Redirect back to admin panel
      router.push('/admin?tab=entries');
    } catch (error) {
      console.error("Error approving entry:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve entry. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to reject the entry
  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/pending-entries/${id}/reject`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reject entry');
      }

      toast({
        title: "Entry Rejected",
        description: "The entry has been rejected",
      });

      // Redirect back to admin panel
      router.push('/admin?tab=entries');
    } catch (error) {
      console.error("Error rejecting entry:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject entry. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Loading details...</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Entry Not Found</CardTitle>
          <CardDescription>The entry you are looking for does not exist or has been processed.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Admin Panel
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Check if user is admin - if not, show access denied
  if (user?.role !== "admin") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You do not have permission to access this page.</p>
        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  const getStageColor = (stage?: string): string => {
    if (!stage) return "bg-gray-100 text-gray-800 border-gray-300";
    
    switch (stage.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "delayed":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getComponentStatus = (status?: string) => {
    if (!status) return null;
    
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "not started":
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Pending Approval</h2>
          <p className="text-muted-foreground">Review beneficiary information before approval</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Panel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Reject
              </>
            )}
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Approve
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle>{entry.beneficiaryName}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {entry.village}, {entry.constituency}
                </CardDescription>
              </div>
              <Badge variant="outline" className={getStageColor(entry.stage)}>
                {entry.stage || "Not Started"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Construction Progress</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{entry.progress || 0}% Complete</span>
                  <span className="text-muted-foreground">Submitted: {entry.submittedOn}</span>
                </div>
                <Progress value={entry.progress || 0} className="h-2" />
              </div>
            </div>

            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="construction">Construction</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Beneficiary Name</p>
                    <p className="font-medium">{entry.beneficiaryName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Contact Number</p>
                    <p className="font-medium">{entry.contactNumber || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Aadhar Number</p>
                    <p className="font-medium">{entry.aadharNumber || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Family Members</p>
                    <p className="font-medium">{entry.familyMembers || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Constituency</p>
                    <p className="font-medium">{entry.constituency}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Village</p>
                    <p className="font-medium">{entry.village}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{entry.startDate || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Expected Completion</p>
                    <p className="font-medium">{entry.expectedCompletion || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Assigned Officer</p>
                    <p className="font-medium">{entry.assignedOfficer || "Not assigned"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Submitted By</p>
                    <p className="font-medium">{entry.submittedBy}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                  <p>{entry.remarks || "No remarks provided"}</p>
                </div>
              </TabsContent>

              <TabsContent value="construction" className="space-y-4 pt-4">
                {entry.constructionDetails ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getComponentStatus(entry.constructionDetails.foundation?.status)}
                        <span className="font-medium">Foundation</span>
                      </div>
                      <div className="text-sm">
                        {entry.constructionDetails.foundation?.status === "Completed" ? (
                          <span>Completed on {entry.constructionDetails.foundation.completionDate}</span>
                        ) : (
                          <Badge variant="outline" className={getStageColor(entry.constructionDetails.foundation?.status)}>
                            {entry.constructionDetails.foundation?.status || "Not Started"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getComponentStatus(entry.constructionDetails.walls?.status)}
                        <span className="font-medium">Walls</span>
                      </div>
                      <div className="text-sm">
                        {entry.constructionDetails.walls?.status === "Completed" ? (
                          <span>Completed on {entry.constructionDetails.walls.completionDate}</span>
                        ) : (
                          <Badge variant="outline" className={getStageColor(entry.constructionDetails.walls?.status)}>
                            {entry.constructionDetails.walls?.status || "Not Started"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getComponentStatus(entry.constructionDetails.roof?.status)}
                        <span className="font-medium">Roof</span>
                      </div>
                      <div className="text-sm">
                        {entry.constructionDetails.roof?.status === "Completed" ? (
                          <span>Completed on {entry.constructionDetails.roof.completionDate}</span>
                        ) : (
                          <Badge variant="outline" className={getStageColor(entry.constructionDetails.roof?.status)}>
                            {entry.constructionDetails.roof?.status || "Not Started"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getComponentStatus(entry.constructionDetails.finishing?.status)}
                        <span className="font-medium">Finishing</span>
                      </div>
                      <div className="text-sm">
                        {entry.constructionDetails.finishing?.status === "Completed" ? (
                          <span>Completed on {entry.constructionDetails.finishing.completionDate}</span>
                        ) : (
                          <Badge variant="outline" className={getStageColor(entry.constructionDetails.finishing?.status)}>
                            {entry.constructionDetails.finishing?.status || "Not Started"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>No construction details available</p>
                )}
              </TabsContent>

              <TabsContent value="financial" className="space-y-4 pt-4">
                {entry.fundDetails ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Allocated</p>
                        <p className="font-medium">{entry.fundDetails.allocated || "₹0"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Released</p>
                        <p className="font-medium">{entry.fundDetails.released || "₹0"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Utilized</p>
                        <p className="font-medium">{entry.fundDetails.utilized || "₹0"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className="font-medium">{entry.fundDetails.remaining || "₹0"}</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Fund Utilization</span>
                        <span className="text-sm text-muted-foreground">
                          {calculatePercentage(entry.fundDetails.utilized, entry.fundDetails.allocated)}%
                        </span>
                      </div>
                      <Progress
                        value={calculatePercentage(entry.fundDetails.utilized, entry.fundDetails.allocated)}
                        className="h-2"
                      />
                    </div>
                  </>
                ) : (
                  <p>No financial details available</p>
                )}
              </TabsContent>

              <TabsContent value="images" className="pt-4">
                {entry.images && entry.images.length > 0 ? (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {entry.images.map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="p-1">
                            <Card>
                              <CardContent className="flex aspect-square items-center justify-center p-6">
                                <img
                                  src={image}
                                  alt={`Construction image ${index + 1}`}
                                  className="rounded-md max-h-full object-cover"
                                />
                              </CardContent>
                              <CardFooter className="p-2 text-center">
                                <p className="text-sm text-muted-foreground w-full">Construction Photo {index + 1}</p>
                              </CardFooter>
                            </Card>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                ) : (
                  <div className="flex justify-center items-center h-40">
                    <p className="text-muted-foreground">No images available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location</CardTitle>
            </CardHeader>
            <CardContent>
              {entry.lat && entry.lng ? (
                <>
                  <div className="aspect-square rounded-md bg-muted flex items-center justify-center">
                    <iframe
                      title="House Location"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://maps.google.com/maps?q=${entry.lat},${entry.lng}&z=15&output=embed`}
                    ></iframe>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    Coordinates: {entry.lat}, {entry.lng}
                  </div>
                </>
              ) : (
                <div className="aspect-square rounded-md bg-muted flex flex-col items-center justify-center p-4">
                  <MapPin className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-center text-muted-foreground">Location coordinates not available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-full">
                  <Home className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Construction Stage</p>
                  <p className="text-sm text-muted-foreground">{entry.stage || "Not Started"}</p>
                </div>
              </div>

              {entry.startDate && entry.expectedCompletion && (
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-full">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Timeline</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.startDate} to {entry.expectedCompletion}
                    </p>
                  </div>
                </div>
              )}

              {entry.assignedOfficer && (
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-full">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Assigned Officer</p>
                    <p className="text-sm text-muted-foreground">{entry.assignedOfficer}</p>
                  </div>
                </div>
              )}

              {entry.contactNumber && (
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-full">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contact</p>
                    <p className="text-sm text-muted-foreground">{entry.contactNumber}</p>
                  </div>
                </div>
              )}

              {entry.fundDetails?.utilized && (
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-full">
                    <IndianRupee className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fund Utilized</p>
                    <p className="text-sm text-muted-foreground">{entry.fundDetails.utilized}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Submitted By</p>
                  <p className="text-sm text-muted-foreground">{entry.submittedBy}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-full">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Submission Date</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.submittedOn ? formatDate(entry.submittedOn) : "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate percentage from rupee strings
function calculatePercentage(utilized?: string, allocated?: string): number {
  if (!utilized || !allocated) return 0;
  
  try {
    const utilizedNum = parseFloat(String(utilized).replace(/[^\d.]/g, '')) || 0;
    const allocatedNum = parseFloat(String(allocated).replace(/[^\d.]/g, '')) || 1; // Prevent division by zero
    
    return Math.min(Math.round((utilizedNum / allocatedNum) * 100), 100); // Cap at 100%
  } catch (error) {
    console.error("Error calculating percentage:", error);
    return 0;
  }
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