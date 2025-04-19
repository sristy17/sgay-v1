"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, Loader2, MapPin, Upload, X } from "lucide-react";
import { addHouse, fetchOfficers } from "@/lib/api";
import type { Officer } from "@/lib/types";
import { useSidebar } from "@/components/sidebar-provider";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  beneficiaryName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" }),
  constituency: z.string().min(1, { message: "Please select a constituency" }),
  village: z.string().min(1, { message: "Village is required" }),
  stage: z.string().min(1, { message: "Please select a stage" }),
  progress: z.coerce.number().min(0).max(100),
  contactNumber: z
    .string()
    .min(10, { message: "Contact number must be at least 10 digits" }),
  aadharNumber: z.string().min(1, { message: "Aadhar number is required" }),
  familyMembers: z.coerce.number().min(1),
  assignedOfficer: z.string().min(1, { message: "Please select an officer" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  expectedCompletion: z
    .string()
    .min(1, { message: "Expected completion date is required" }),
  remarks: z.string().optional(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  fundAllocated: z.string().min(1, { message: "Allocated fund is required" }),
  fundReleased: z.string().min(1, { message: "Released fund is required" }),
  fundUtilized: z.string().min(1, { message: "Utilized fund is required" }),
  foundationStatus: z
    .string()
    .min(1, { message: "Please select foundation status" }),
  foundationDate: z.string().optional(),
  wallsStatus: z.string().min(1, { message: "Please select walls status" }),
  wallsDate: z.string().optional(),
  roofStatus: z.string().min(1, { message: "Please select roof status" }),
  roofDate: z.string().optional(),
  finishingStatus: z
    .string()
    .min(1, { message: "Please select finishing status" }),
  finishingDate: z.string().optional(),
});

export default function AddBeneficiaryPage() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const router = useRouter();
  const { user } = useSidebar();
  const { toast } = useToast();

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      beneficiaryName: "",
      constituency: "",
      village: "",
      stage: "Not Started",
      progress: 0,
      contactNumber: "",
      aadharNumber: "",
      familyMembers: 1,
      assignedOfficer: "",
      startDate: new Date().toISOString().split("T")[0],
      expectedCompletion: "",
      remarks: "",
      lat: 27.5,
      lng: 88.5,
      fundAllocated: "Rs. 2,50,000",
      fundReleased: "Rs. 0",
      fundUtilized: "Rs. 0",
      foundationStatus: "Not Started",
      wallsStatus: "Not Started",
      roofStatus: "Not Started",
      finishingStatus: "Not Started",
    },
  });

  useEffect(() => {
    // Check if user has permission to access this page
    if (user && user.role !== "admin" && user.role !== "officer") {
      router.push("/dashboard");
      return;
    }

    // Load officers
    const loadOfficers = async () => {
      try {
        const data = await fetchOfficers();
        setOfficers(data);
      } catch (error) {
        console.error("Failed to fetch officers:", error);
      }
    };

    loadOfficers();
  }, [user, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert to data URLs for preview
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      // Calculate remaining fund
      const allocated = Number.parseInt(
        data.fundAllocated.replace(/[^0-9]/g, "")
      );
      const utilized = Number.parseInt(
        data.fundUtilized.replace(/[^0-9]/g, "")
      );
      const remaining = allocated - utilized;

      // Prepare house data for pending approval
      const pendingEntryData = {
        beneficiaryName: data.beneficiaryName,
        constituency: data.constituency,
        village: data.village,
        stage: data.stage,
        progress: data.progress,
        fundUtilized: data.fundUtilized,
        lat: data.lat,
        lng: data.lng,
        images:
          images.length > 0
            ? images
            : ["/placeholder.svg?height=300&width=400"],
        submittedBy: data.assignedOfficer,
        submittedOn: new Date().toISOString().split("T")[0],
        status: "pending",
        contactNumber: data.contactNumber,
        aadharNumber: data.aadharNumber,
        familyMembers: data.familyMembers,
        assignedOfficer: data.assignedOfficer,
        remarks: data.remarks || "",
        startDate: data.startDate,
        expectedCompletion: data.expectedCompletion,
        fundDetails: {
          allocated: data.fundAllocated,
          released: data.fundReleased,
          utilized: data.fundUtilized,
          remaining: `Rs. ${remaining.toLocaleString()}`,
        },
        constructionDetails: {
          foundation: {
            status: data.foundationStatus as
              | "Not Started"
              | "In Progress"
              | "Completed",
            completionDate:
              data.foundationStatus === "Completed"
                ? data.foundationDate
                : undefined,
          },
          walls: {
            status: data.wallsStatus as
              | "Not Started"
              | "In Progress"
              | "Completed",
            completionDate:
              data.wallsStatus === "Completed" ? data.wallsDate : undefined,
          },
          roof: {
            status: data.roofStatus as
              | "Not Started"
              | "In Progress"
              | "Completed",
            completionDate:
              data.roofStatus === "Completed" ? data.roofDate : undefined,
          },
          finishing: {
            status: data.finishingStatus as
              | "Not Started"
              | "In Progress"
              | "Completed",
            completionDate:
              data.finishingStatus === "Completed"
                ? data.finishingDate
                : undefined,
          },
        },
      };

      // Submit to pending entries instead of directly adding
      const response = await fetch('/api/pending-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pendingEntryData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit beneficiary for approval');
      }

      const result = await response.json();

      toast({
        title: "Successfully submitted",
        description: "Beneficiary has been submitted for admin approval",
      });

      // Redirect to the dashboard or a confirmation page
      router.push('/dashboard?submitted=true');
    } catch (error) {
      console.error("Error submitting beneficiary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit beneficiary for approval. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Add New Beneficiary
          </h2>
          <p className="text-muted-foreground">
            Add a new beneficiary to the housing scheme
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="construction">Construction</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>

            <Card className="mt-4 border-t-0 rounded-tl-none rounded-tr-none">
              <CardContent className="pt-6">
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="beneficiaryName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beneficiary Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter contact number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aadharNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aadhar Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter Aadhar number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="familyMembers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Family Members</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assignedOfficer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned Officer</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an officer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {officers.map((officer) => (
                                <SelectItem
                                  key={officer.id}
                                  value={officer.name}
                                >
                                  {officer.name} - {officer.designation}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expectedCompletion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Completion</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stage</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Not Started">
                                Not Started
                              </SelectItem>
                              <SelectItem value="In Progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="Delayed">Delayed</SelectItem>
                              <SelectItem value="Completed">
                                Completed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="progress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Progress (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any additional remarks or notes"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Upload Images</FormLabel>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG or JPEG (MAX. 5MB)
                          </p>
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

                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`Uploaded image ${index + 1}`}
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
                  </div>
                </TabsContent>

                <TabsContent value="location" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="constituency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Constituency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select constituency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Gangtok">Gangtok</SelectItem>
                              <SelectItem value="Upper Tadong">
                                Upper Tadong
                              </SelectItem>
                              <SelectItem value="Arithang">Arithang</SelectItem>
                              <SelectItem value="Namchi-Singhithang">
                                Namchi-Singhithang
                              </SelectItem>
                              <SelectItem value="Gyalshing-Barnyak">
                                Gyalshing-Barnyak
                              </SelectItem>
                              <SelectItem value="Yangthang">
                                Yangthang
                              </SelectItem>
                              <SelectItem value="Soreng-Chakung">
                                Soreng-Chakung
                              </SelectItem>
                              <SelectItem value="Rumtek-Martam">
                                Rumtek-Martam
                              </SelectItem>
                              <SelectItem value="Melli">Melli</SelectItem>
                              <SelectItem value="Rhenock">Rhenock</SelectItem>
                              <SelectItem value="Dzongu (BL)">
                                Dzongu (BL)
                              </SelectItem>
                              <SelectItem value="Lachen-Mangan">
                                Lachen-Mangan
                              </SelectItem>
                              <SelectItem value="Shyari (BL)">
                                Shyari (BL)
                              </SelectItem>
                              <SelectItem value="Poklok-Kamrang">
                                Poklok-Kamrang
                              </SelectItem>
                              <SelectItem value="Khamdong-Singtam">
                                Khamdong-Singtam
                              </SelectItem>
                              <SelectItem value="Yoksam-Tashiding">
                                Yoksam-Tashiding
                              </SelectItem>
                              <SelectItem value="Rinchenpong">
                                Rinchenpong
                              </SelectItem>
                              <SelectItem value="Daramdin">Daramdin</SelectItem>
                              <SelectItem value="West Pendam">
                                West Pendam
                              </SelectItem>
                              <SelectItem value="Namthang-Rateypani">
                                Namthang-Rateypani
                              </SelectItem>
                              <SelectItem value="Barfung (BL)">
                                Barfung (BL)
                              </SelectItem>
                              <SelectItem value="Tumin-Lingee">
                                Tumin-Lingee
                              </SelectItem>
                              <SelectItem value="Namcheybung">
                                Namcheybung
                              </SelectItem>
                              <SelectItem value="Chujachen">
                                Chujachen
                              </SelectItem>
                              <SelectItem value="Gnathang-Machong">
                                Gnathang-Machong
                              </SelectItem>
                              <SelectItem value="Kabi-Lungchok">
                                Kabi-Lungchok
                              </SelectItem>
                              <SelectItem value="Upper Burtuk">
                                Upper Burtuk
                              </SelectItem>
                              <SelectItem value="Salghari-Zoom">
                                Salghari-Zoom
                              </SelectItem>
                              <SelectItem value="Maneybung-Dentam">
                                Maneybung-Dentam
                              </SelectItem>
                              <SelectItem value="Temi-Namphing">
                                Temi-Namphing
                              </SelectItem>
                              <SelectItem value="Martam-Rumtek">
                                Martam-Rumtek
                              </SelectItem>
                              <SelectItem value="Sangha">Sangha</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="village"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Village</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter village name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0001" {...field} />
                          </FormControl>
                          <FormDescription>
                            Decimal coordinates (e.g., 27.3314)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0001" {...field} />
                          </FormControl>
                          <FormDescription>
                            Decimal coordinates (e.g., 88.6138)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-md border p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Enter the exact coordinates of the house location. You
                        can use Google Maps to find the coordinates.
                      </p>
                    </div>
                    <div className="aspect-video rounded-md bg-muted flex items-center justify-center">
                      <iframe
                        title="House Location"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={`https://maps.google.com/maps?q=${form.watch(
                          "lat"
                        )},${form.watch("lng")}&z=15&output=embed`}
                      ></iframe>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="construction" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="foundationStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Foundation Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Not Started">
                                  Not Started
                                </SelectItem>
                                <SelectItem value="In Progress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="Completed">
                                  Completed
                                </SelectItem>
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
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Not Started">
                                  Not Started
                                </SelectItem>
                                <SelectItem value="In Progress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="Completed">
                                  Completed
                                </SelectItem>
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
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Not Started">
                                  Not Started
                                </SelectItem>
                                <SelectItem value="In Progress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="Completed">
                                  Completed
                                </SelectItem>
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
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Not Started">
                                  Not Started
                                </SelectItem>
                                <SelectItem value="In Progress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="Completed">
                                  Completed
                                </SelectItem>
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
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fundAllocated"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fund Allocated</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Rs. 2,50,000"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fundReleased"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fund Released</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Rs. 1,50,000"
                              {...field}
                            />
                          </FormControl>
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
                            <Input
                              placeholder="e.g., Rs. 1,20,000"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-1">
                      <FormLabel>Fund Remaining</FormLabel>
                      <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50">
                        {(() => {
                          try {
                            const allocated =
                              Number.parseInt(
                                form
                                  .watch("fundAllocated")
                                  .replace(/[^0-9]/g, "")
                              ) || 0;
                            const utilized =
                              Number.parseInt(
                                form
                                  .watch("fundUtilized")
                                  .replace(/[^0-9]/g, "")
                              ) || 0;
                            const remaining = allocated - utilized;
                            return `Rs. ${remaining.toLocaleString()}`;
                          } catch (e) {
                            return "Rs. 0";
                          }
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Automatically calculated
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                >
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
                      Save Beneficiary
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
