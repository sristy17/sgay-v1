"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Check, Loader2, Upload, X } from "lucide-react"
import { fetchHouseById, updateHouse } from "@/lib/api"
import type { House } from "@/lib/types"
import { useSidebar } from "@/components/sidebar-provider"
import { useToast } from "@/components/ui/use-toast"

// Form schema
const formSchema = z.object({
  progress: z.coerce.number().min(0).max(100),
  stage: z.string().min(1, { message: "Please select a stage" }),
  fundUtilized: z.string().min(1, { message: "Utilized fund is required" }),
  foundationStatus: z.string().min(1, { message: "Please select foundation status" }),
  foundationDate: z.string().optional(),
  wallsStatus: z.string().min(1, { message: "Please select walls status" }),
  wallsDate: z.string().optional(),
  roofStatus: z.string().min(1, { message: "Please select roof status" }),
  roofDate: z.string().optional(),
  finishingStatus: z.string().min(1, { message: "Please select finishing status" }),
  finishingDate: z.string().optional(),
  remarks: z.string().optional(),
})

export default function UpdateProgressPage({ params }: { params: { id: string } }) {
  const [house, setHouse] = useState<House | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newImages, setNewImages] = useState<string[]>([])
  const router = useRouter()
  const { user } = useSidebar()
  const { toast } = useToast()

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      progress: 0,
      stage: "",
      fundUtilized: "",
      foundationStatus: "",
      wallsStatus: "",
      roofStatus: "",
      finishingStatus: "",
      remarks: "",
    },
  })

  useEffect(() => {
    // Check if user has permission to access this page
    if (user && user.role !== "admin" && user.role !== "officer") {
      router.push("/dashboard")
      return
    }

    // Load house data
    const loadData = async () => {
      try {
        setIsLoading(true)
        const houseData = await fetchHouseById(Number.parseInt(params.id))

        if (houseData) {
          setHouse(houseData)

          // Set form values
          form.reset({
            progress: houseData.progress,
            stage: houseData.stage,
            fundUtilized: houseData.fundUtilized,
            foundationStatus: houseData.constructionDetails.foundation.status,
            foundationDate: houseData.constructionDetails.foundation.completionDate || "",
            wallsStatus: houseData.constructionDetails.walls.status,
            wallsDate: houseData.constructionDetails.walls.completionDate || "",
            roofStatus: houseData.constructionDetails.roof.status,
            roofDate: houseData.constructionDetails.roof.completionDate || "",
            finishingStatus: houseData.constructionDetails.finishing.status,
            finishingDate: houseData.constructionDetails.finishing.completionDate || "",
            remarks: houseData.remarks,
          })
        }
      } catch (error) {
        console.error("Failed to fetch house data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load beneficiary data",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, router, params.id, form, toast])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Convert to data URLs for preview
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setNewImages((prev) => [...prev, e.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!house) return

    setIsSubmitting(true)

    try {
      // Calculate remaining fund
      const allocated = Number.parseInt(house.fundDetails.allocated.replace(/[^0-9]/g, ""))
      const utilized = Number.parseInt(data.fundUtilized.replace(/[^0-9]/g, ""))
      const remaining = allocated - utilized

      // Prepare house data
      const houseData: Partial<House> = {
        stage: data.stage,
        progress: data.progress,
        fundUtilized: data.fundUtilized,
        lastUpdated: new Date().toISOString().split("T")[0],
        remarks: data.remarks || house.remarks,
        // Add new images if any
        images: newImages.length > 0 ? [...house.images, ...newImages] : house.images,
        fundDetails: {
          ...house.fundDetails,
          utilized: data.fundUtilized,
          remaining: `Rs. ${remaining.toLocaleString()}`,
        },
        constructionDetails: {
          foundation: {
            status: data.foundationStatus as "Not Started" | "In Progress" | "Completed",
            completionDate: data.foundationStatus === "Completed" ? data.foundationDate : undefined,
          },
          walls: {
            status: data.wallsStatus as "Not Started" | "In Progress" | "Completed",
            completionDate: data.wallsStatus === "Completed" ? data.wallsDate : undefined,
          },
          roof: {
            status: data.roofStatus as "Not Started" | "In Progress" | "Completed",
            completionDate: data.roofStatus === "Completed" ? data.roofDate : undefined,
          },
          finishing: {
            status: data.finishingStatus as "Not Started" | "In Progress" | "Completed",
            completionDate: data.finishingStatus === "Completed" ? data.finishingDate : undefined,
          },
        },
      }

      // Update house
      const updatedHouse = await updateHouse(house.id, houseData)

      toast({
        title: "Success",
        description: "Construction progress updated successfully",
      })

      // Redirect to the house details
      router.push(`/beneficiaries/${house.id}`)
    } catch (error) {
      console.error("Error updating progress:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update progress. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Loading data...</p>
      </div>
    )
  }

  if (!house) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Beneficiary Not Found</CardTitle>
          <CardDescription>The beneficiary you are trying to update does not exist.</CardDescription>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Update Construction Progress</h2>
          <p className="text-muted-foreground">Update the construction progress for {house.beneficiaryName}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Construction Progress</CardTitle>
            <CardDescription>Update the current progress and construction details</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="progress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overall Progress: {field.value}%</FormLabel>
                        <FormControl>
                          <Slider
                            defaultValue={[field.value]}
                            max={100}
                            step={5}
                            onValueChange={(vals) => field.onChange(vals[0])}
                          />
                        </FormControl>
                        <FormDescription>Drag the slider to update the overall progress percentage</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stage</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Not Started">Not Started</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Delayed">Delayed</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fundUtilized"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fund Utilized</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Rs. 1,20,000" {...field} />
                          </FormControl>
                          <FormDescription>Total amount utilized so far</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="foundationStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Foundation Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Not Started">Not Started</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("foundationStatus") === "Completed" && (
                        <FormField
                          control={form.control}
                          name="foundationDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Foundation Completion Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="wallsStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Walls Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Not Started">Not Started</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("wallsStatus") === "Completed" && (
                        <FormField
                          control={form.control}
                          name="wallsDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Walls Completion Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="roofStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Roof Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Not Started">Not Started</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("roofStatus") === "Completed" && (
                        <FormField
                          control={form.control}
                          name="roofDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Roof Completion Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="finishingStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Finishing Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Not Started">Not Started</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("finishingStatus") === "Completed" && (
                        <FormField
                          control={form.control}
                          name="finishingDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Finishing Completion Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any additional remarks or notes about the progress"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Upload New Progress Images</FormLabel>

                    {newImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {newImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`New image ${index + 1}`}
                              className="h-24 w-full object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (MAX. 5MB)</p>
                        </div>
                        <input
                          id="image-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" type="button" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Update Progress
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beneficiary Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Name</p>
              <p>{house.beneficiaryName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Location</p>
              <p>
                {house.village}, {house.constituency}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Contact</p>
              <p>{house.contactNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Current Progress</p>
              <p>{house.progress}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Current Stage</p>
              <p>{house.stage}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Last Updated</p>
              <p>{house.lastUpdated}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Assigned Officer</p>
              <p>{house.assignedOfficer}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

