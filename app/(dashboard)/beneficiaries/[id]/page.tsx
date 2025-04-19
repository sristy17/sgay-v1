"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { ArrowLeft, Calendar, CheckCircle, Clock, Edit, Home, IndianRupee, MapPin, Phone, User } from "lucide-react"
import { fetchHouseById } from "@/lib/api"
import type { House } from "@/lib/types"
import { useSidebar } from "@/components/sidebar-provider"
import { use } from "react"

interface PageParams {
  params: { id: string };
}

export default function BeneficiaryDetailsPage({ params }: PageParams) {
  const { id } = params;

  const [house, setHouse] = useState<House | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user } = useSidebar()

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchHouseById(Number.parseInt(id, 10))
        setHouse(data)
      } catch (error) {
        console.error("Failed to fetch house details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Loading details...</p>
      </div>
    )
  }

  if (!house) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Beneficiary Not Found</CardTitle>
          <CardDescription>The beneficiary you are looking for does not exist.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "Delayed":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getComponentStatus = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "Not Started":
        return <Clock className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Beneficiary Details</h2>
          <p className="text-muted-foreground">Detailed information about the beneficiary and construction progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {(user?.role === "admin" || user?.role === "officer") && (
            <Button onClick={() => router.push(`/manage/edit/${house.id}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Details
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle>{house.beneficiaryName}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {house.village}, {house.constituency}
                </CardDescription>
              </div>
              <Badge variant="outline" className={getStageColor(house.stage)}>
                {house.stage}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Construction Progress</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{house.progress}% Complete</span>
                  <span className="text-muted-foreground">Last Updated: {house.lastUpdated}</span>
                </div>
                <Progress value={house.progress} className="h-2" />
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
                    <p className="font-medium">{house.beneficiaryName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Contact Number</p>
                    <p className="font-medium">{house.contactNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Aadhar Number</p>
                    <p className="font-medium">{house.aadharNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Family Members</p>
                    <p className="font-medium">{house.familyMembers}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Constituency</p>
                    <p className="font-medium">{house.constituency}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Village</p>
                    <p className="font-medium">{house.village}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{house.startDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Expected Completion</p>
                    <p className="font-medium">{house.expectedCompletion}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Assigned Officer</p>
                    <p className="font-medium">{house.assignedOfficer}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{house.lastUpdated}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                  <p>{house.remarks}</p>
                </div>
              </TabsContent>

              <TabsContent value="construction" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getComponentStatus(house.constructionDetails.foundation.status)}
                      <span className="font-medium">Foundation</span>
                    </div>
                    <div className="text-sm">
                      {house.constructionDetails.foundation.status === "Completed" ? (
                        <span>Completed on {house.constructionDetails.foundation.completionDate}</span>
                      ) : (
                        <Badge variant="outline" className={getStageColor(house.constructionDetails.foundation.status)}>
                          {house.constructionDetails.foundation.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getComponentStatus(house.constructionDetails.walls.status)}
                      <span className="font-medium">Walls</span>
                    </div>
                    <div className="text-sm">
                      {house.constructionDetails.walls.status === "Completed" ? (
                        <span>Completed on {house.constructionDetails.walls.completionDate}</span>
                      ) : (
                        <Badge variant="outline" className={getStageColor(house.constructionDetails.walls.status)}>
                          {house.constructionDetails.walls.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getComponentStatus(house.constructionDetails.roof.status)}
                      <span className="font-medium">Roof</span>
                    </div>
                    <div className="text-sm">
                      {house.constructionDetails.roof.status === "Completed" ? (
                        <span>Completed on {house.constructionDetails.roof.completionDate}</span>
                      ) : (
                        <Badge variant="outline" className={getStageColor(house.constructionDetails.roof.status)}>
                          {house.constructionDetails.roof.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getComponentStatus(house.constructionDetails.finishing.status)}
                      <span className="font-medium">Finishing</span>
                    </div>
                    <div className="text-sm">
                      {house.constructionDetails.finishing.status === "Completed" ? (
                        <span>Completed on {house.constructionDetails.finishing.completionDate}</span>
                      ) : (
                        <Badge variant="outline" className={getStageColor(house.constructionDetails.finishing.status)}>
                          {house.constructionDetails.finishing.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Allocated</p>
                    <p className="font-medium">{house.fundDetails.allocated}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Released</p>
                    <p className="font-medium">{house.fundDetails.released}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Utilized</p>
                    <p className="font-medium">{house.fundDetails.utilized}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="font-medium">{house.fundDetails.remaining}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Fund Utilization</span>
                    <span className="text-sm text-muted-foreground">
                      {(Number.parseInt(house.fundDetails.utilized.replace(/[^0-9]/g, "")) /
                        Number.parseInt(house.fundDetails.allocated.replace(/[^0-9]/g, ""))) *
                        100}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      (Number.parseInt(house.fundDetails.utilized.replace(/[^0-9]/g, "")) /
                        Number.parseInt(house.fundDetails.allocated.replace(/[^0-9]/g, ""))) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </TabsContent>

              <TabsContent value="images" className="pt-4">
                <Carousel className="w-full">
                  <CarouselContent>
                    {house.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <Card>
                            <CardContent className="flex aspect-square items-center justify-center p-6">
                              <img
                                src={image || "/placeholder.svg"}
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
              <div className="aspect-square rounded-md bg-muted flex items-center justify-center">
                <iframe
                  title="House Location"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://maps.google.com/maps?q=${house.lat},${house.lng}&z=15&output=embed`}
                ></iframe>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                Coordinates: {house.lat}, {house.lng}
              </div>
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
                  <p className="text-sm text-muted-foreground">{house.stage}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-full">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Timeline</p>
                  <p className="text-sm text-muted-foreground">
                    {house.startDate} to {house.expectedCompletion}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Assigned Officer</p>
                  <p className="text-sm text-muted-foreground">{house.assignedOfficer}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-full">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Contact</p>
                  <p className="text-sm text-muted-foreground">{house.contactNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-full">
                  <IndianRupee className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Fund Utilized</p>
                  <p className="text-sm text-muted-foreground">{house.fundDetails.utilized}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

