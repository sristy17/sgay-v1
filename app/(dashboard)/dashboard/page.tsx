"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { fetchHouses } from "@/lib/api"
import type { House } from "@/lib/types"
import { DataTable } from "@/components/data-table"
import { ProgressChart } from "@/components/charts/progress-chart"
import { ConstituencyChart } from "@/components/charts/constituency-chart"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const submitted = searchParams.get("submitted")
  const { toast } = useToast()

  useEffect(() => {
    // Show a toast notification if coming from a successful submission
    if (submitted === "true") {
      toast({
        title: "Entry submitted",
        description: "Your beneficiary entry is pending admin approval",
      })
    }
  }, [submitted, toast])

  const [houses, setHouses] = useState<House[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data only once on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchHouses()
        setHouses(data)
      } catch (error) {
        console.error("Failed to fetch houses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Memoize statistics calculations to prevent recalculation on re-renders
  const {
    totalHouses,
    completedHouses,
    inProgressHouses,
    delayedHouses,
    overallProgress,
    completedPercentage,
    inProgressPercentage,
    delayedPercentage,
  } = useMemo(() => {
    const total = houses.length
    const completed = houses.filter((house) => house.stage === "Completed").length
    const inProgress = houses.filter((house) => house.stage === "In Progress").length
    const delayed = houses.filter((house) => house.stage === "Delayed").length

    const overall =
      total > 0 ? Math.round((houses.reduce((sum, house) => sum + house.progress, 0) / (total * 100)) * 100) : 0

    return {
      totalHouses: total,
      completedHouses: completed,
      inProgressHouses: inProgress,
      delayedHouses: delayed,
      overallProgress: overall,
      completedPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      inProgressPercentage: total > 0 ? Math.round((inProgress / total) * 100) : 0,
      delayedPercentage: total > 0 ? Math.round((delayed / total) * 100) : 0,
    }
  }, [houses])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Houses</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalHouses}</div>
            <p className="text-xs text-muted-foreground">Registered under the scheme</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : completedHouses}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Calculating..." : `${completedPercentage}% of total houses`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : inProgressHouses}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Calculating..." : `${inProgressPercentage}% of total houses`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : delayedHouses}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Calculating..." : `${delayedPercentage}% of total houses`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>Construction progress across all registered houses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{overallProgress}% Complete</span>
              <span className="text-sm text-muted-foreground">
                {completedHouses} of {totalHouses} houses completed
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Progress by Stage</CardTitle>
                <CardDescription>Distribution of houses by construction stage</CardDescription>
              </CardHeader>
              <CardContent className="h-80">{!isLoading && <ProgressChart houses={houses} />}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Constituency Distribution</CardTitle>
                <CardDescription>Houses by constituency</CardDescription>
              </CardHeader>
              <CardContent className="h-80">{!isLoading && <ConstituencyChart houses={houses} />}</CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Houses Data</CardTitle>
              <CardDescription>Complete list of houses under the scheme</CardDescription>
            </CardHeader>
            <CardContent>{!isLoading && <DataTable houses={houses} />}</CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  )
}

