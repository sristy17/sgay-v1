"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Edit, Eye, FileEdit, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"
import { fetchHouses, deleteHouse } from "@/lib/api"
import type { House } from "@/lib/types"
import { useSidebar } from "@/components/sidebar-provider"
import { useToast } from "@/components/ui/use-toast"

export default function ManagePage() {
  const [houses, setHouses] = useState<House[]>([])
  const [filteredHouses, setFilteredHouses] = useState<House[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()
  const { user } = useSidebar()
  const { toast } = useToast()

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "officer") {
      router.push("/dashboard")
      return
    }

    const loadData = async () => {
      try {
        const data = await fetchHouses()
        setHouses(data)
        setFilteredHouses(data)
      } catch (error) {
        console.error("Failed to fetch houses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, router])

  useEffect(() => {
    let filtered = houses

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (house) =>
          house.beneficiaryName.toLowerCase().includes(term) ||
          house.village.toLowerCase().includes(term) ||
          house.constituency.toLowerCase().includes(term) ||
          house.assignedOfficer.toLowerCase().includes(term),
      )
    }

    if (activeTab !== "all") {
      filtered = filtered.filter((house) => house.stage.toLowerCase() === activeTab)
    }

    setFilteredHouses(filtered)
  }, [searchTerm, activeTab, houses])

  const handleDelete = async (id: number) => {
    try {
      const success = await deleteHouse(id)
      if (success) {
        setHouses(houses.filter((house) => house.id !== id))
        toast({
          title: "Success",
          description: "Beneficiary deleted successfully",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete beneficiary",
        })
      }
    } catch (error) {
      console.error("Error deleting house:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while deleting the beneficiary",
      })
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "delayed":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Manage Beneficiaries</h2>
          <p className="text-muted-foreground">Add, edit, or remove beneficiaries and update construction progress</p>
        </div>
        <Button onClick={() => router.push("/manage/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Beneficiary
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Beneficiaries</CardTitle>
          <CardDescription>Manage all beneficiaries in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search beneficiaries..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="in progress">In Progress</TabsTrigger>
                  <TabsTrigger value="delayed">Delayed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p>Loading data...</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHouses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No beneficiaries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHouses.map((house) => (
                        <TableRow key={house.id}>
                          <TableCell>{house.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{house.beneficiaryName}</div>
                              <div className="text-sm text-muted-foreground">{house.contactNumber}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{house.village}</div>
                              <div className="text-sm text-muted-foreground">{house.constituency}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStageColor(house.stage)}>
                              {house.stage}
                            </Badge>
                          </TableCell>
                          <TableCell>{house.progress}%</TableCell>
                          <TableCell>{house.lastUpdated}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => router.push(`/beneficiaries/${house.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/manage/edit/${house.id}`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/manage/update-progress/${house.id}`)}>
                                  <FileEdit className="mr-2 h-4 w-4" />
                                  Update Progress
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the beneficiary and
                                        all associated data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(house.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

