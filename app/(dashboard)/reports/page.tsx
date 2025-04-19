"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, Download, FileText, Printer, ChevronDown } from "lucide-react"
import { fetchHouses } from "@/lib/api"
import { House } from "@/lib/types"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { format } from 'date-fns'
import { useToast } from "@/components/ui/use-toast"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState("monthly")
  const [beneficiaries, setBeneficiaries] = useState<House[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MMMM yyyy'))
  const [selectedConstituency, setSelectedConstituency] = useState<string>("All")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Last 6 Months")
  const monthlyReportRef = useRef<HTMLDivElement>(null)
  const constituencyReportRef = useRef<HTMLDivElement>(null)
  const financialReportRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Get last 12 months for dropdown
  const getLast12Months = () => {
    const months = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(format(month, 'MMMM yyyy'))
    }
    return months
  }

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const data = await fetchHouses()
        setBeneficiaries(data)
      } catch (error) {
        console.error("Failed to fetch beneficiary data:", error)
        toast({
          title: "Error",
          description: "Failed to load beneficiary data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [toast])

  // Get unique constituencies
  const constituencies = ["All", ...Array.from(new Set(beneficiaries.map(b => b.constituency || "Unknown"))).sort()]
  
  // Filter data based on selected month
  const getMonthlyData = () => {
    if (!selectedMonth) return [];
    
    try {
      const [month, year] = selectedMonth.split(' ');
      // Create a proper Date object for the month
      const monthDate = new Date(`${month} 1, ${year}`);
      const monthNum = monthDate.getMonth();
      const yearNum = parseInt(year);
      
      console.log("Selected month:", selectedMonth);
      console.log("Parsed month/year:", monthNum, yearNum);
      console.log("Total beneficiaries:", beneficiaries.length);
      console.log("Filtered beneficiaries:", beneficiaries.filter(b => {
        if (!b.lastUpdated) return false;
        try {
          const date = new Date(b.lastUpdated);
          console.log("Comparing date:", b.lastUpdated, date.getMonth(), date.getFullYear());
          return date.getMonth() === monthNum && date.getFullYear() === yearNum;
        } catch (e) {
          return false;
        }
      }).length);

      return beneficiaries.filter(b => {
        if (!b.lastUpdated) return false;
        try {
          const date = new Date(b.lastUpdated);
          // Properly handle date comparison to get all entries from the selected month
          return date.getMonth() === monthNum && date.getFullYear() === yearNum;
        } catch (e) {
          console.error("Error parsing date:", b.lastUpdated, e);
          return false;
        }
      });
    } catch (e) {
      console.error("Error parsing month data:", e);
      return [];
    }
  }

  // Filter data based on selected constituency
  const getConstituencyData = () => {
    if (selectedConstituency === "All") {
      return beneficiaries
    }
    return beneficiaries.filter(b => b.constituency === selectedConstituency)
  }

  // Calculate financial summary based on period
  const getFinancialData = () => {
    const now = new Date()
    let startDate: Date
    
    switch (selectedPeriod) {
      case "Last Month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        break
      case "Last 3 Months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      case "Last 6 Months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        break
      case "Last Year":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    }
    
    return beneficiaries.filter(b => {
      if (!b.lastUpdated) return false;
      try {
        return new Date(b.lastUpdated) >= startDate
      } catch (e) {
        return false;
      }
    })
  }

  // Generate monthly report data for chart
  const generateMonthlyProgressData = () => {
    const data = getMonthlyData()
    const stages = ["Not Started", "Foundation", "Walls", "Roof", "Finishing", "Completed"]
    
    return stages.map(stage => ({
      name: stage,
      count: data.filter(b => b.stage === stage).length
    }))
  }

  // Generate constituency report data for chart
  const generateConstituencyData = () => {
    const data = getConstituencyData()
    const statusCounts = data.reduce((acc, house) => {
      const stage = house.stage || "Unknown"
      acc[stage] = (acc[stage] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.keys(statusCounts).map(key => ({
      name: key,
      value: statusCounts[key]
    }))
  }

  // Fix for the generateFinancialData function to handle fund data correctly
  const generateFinancialData = () => {
    const data = getFinancialData();
    
    // Calculate total allocated, released, utilized funds
    const totalAllocated = data.reduce((sum, house) => {
      let allocated = 0;
      try {
        // Check fundDetails first (this is the structure in your JSON)
        if (house.fundDetails && house.fundDetails.allocated) {
          allocated = parseFloat(String(house.fundDetails.allocated).replace(/[^\d.]/g, '')) || 0;
        } 
        // Fallback to direct fund properties if available
        else if (house.fundDetails.allocated) {
          allocated = parseFloat(String(house.fundDetails.allocated).replace(/[^\d.]/g, '')) || 0;
        }
      } catch (e) {
        console.error('Error parsing allocated fund:', e);
      }
      return sum + allocated;
    }, 0);
    
    const totalReleased = data.reduce((sum, house) => {
      let released = 0;
      try {
        // Check fundDetails first
        if (house.fundDetails && house.fundDetails.released) {
          released = parseFloat(String(house.fundDetails.released).replace(/[^\d.]/g, '')) || 0;
        } 
        // Fallback to direct property
        else if (house.fundDetails.released) {
          released = parseFloat(String(house.fundDetails.released).replace(/[^\d.]/g, '')) || 0;
        }
      } catch (e) {
        console.error('Error parsing released fund:', e);
      }
      return sum + released;
    }, 0);
    
    const totalUtilized = data.reduce((sum, house) => {
      let utilized = 0;
      try {
        // Check fundDetails first
        if (house.fundDetails && house.fundDetails.utilized) {
          utilized = parseFloat(String(house.fundDetails.utilized).replace(/[^\d.]/g, '')) || 0;
        } 
        // Direct property
        else if (house.fundDetails.utilized) {
          utilized = parseFloat(String(house.fundDetails.utilized).replace(/[^\d.]/g, '')) || 0;
        }
      } catch (e) {
        console.error('Error parsing utilized fund:', e);
      }
      return sum + utilized;
    }, 0);
    
    return [
      { name: 'Allocated', amount: totalAllocated },
      { name: 'Released', amount: totalReleased },
      { name: 'Utilized', amount: totalUtilized },
      { name: 'Remaining', amount: totalReleased - totalUtilized }
    ];
  }
  
  // Print functionality - implemented correctly without calling hooks inside event handlers
  const handlePrintMonthly = useCallback(() => {
    if (!monthlyReportRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open print window. Check your popup blocker settings.",
        variant: "destructive"
      });
      return;
    }
    
    const content = monthlyReportRef.current.innerHTML;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Monthly Report - ${selectedMonth}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            thead th { background-color: #f9fafb; }
            .page-break { page-break-after: always; }
            h2 { margin-top: 0; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem; }
            .card { padding: 1rem; border-radius: 0.5rem; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div>${content}</div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }, [monthlyReportRef, selectedMonth, toast]);
  
  const handlePrintConstituency = useCallback(() => {
    if (!constituencyReportRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open print window. Check your popup blocker settings.",
        variant: "destructive"
      });
      return;
    }
    
    const content = constituencyReportRef.current.innerHTML;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Constituency Report - ${selectedConstituency}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            thead th { background-color: #f9fafb; }
            .page-break { page-break-after: always; }
            h2 { margin-top: 0; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem; }
            .card { padding: 1rem; border-radius: 0.5rem; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div>${content}</div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }, [constituencyReportRef, selectedConstituency, toast]);
  
  const handlePrintFinancial = useCallback(() => {
    if (!financialReportRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open print window. Check your popup blocker settings.",
        variant: "destructive"
      });
      return;
    }
    
    const content = financialReportRef.current.innerHTML;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial Report - ${selectedPeriod}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            thead th { background-color: #f9fafb; }
            .page-break { page-break-after: always; }
            h2 { margin-top: 0; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem; }
            .card { padding: 1rem; border-radius: 0.5rem; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div>${content}</div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }, [financialReportRef, selectedPeriod, toast]);
  
  // Print functionality - simplified handler
  const handlePrint = useCallback((reportType: string) => {
    switch(reportType) {
      case 'monthly':
        handlePrintMonthly();
        break;
      case 'constituency':
        handlePrintConstituency();
        break;
      case 'financial':
        handlePrintFinancial();
        break;
      default:
        break;
    }
  }, [handlePrintMonthly, handlePrintConstituency, handlePrintFinancial]);
  
  // Download PDF functionality
  const handleDownload = useCallback(async (reportType: string) => {
    let ref;
    let title;
    
    switch(reportType) {
      case 'monthly':
        ref = monthlyReportRef;
        title = `Monthly Progress Report - ${selectedMonth}`;
        break;
      case 'constituency':
        ref = constituencyReportRef;
        title = `Constituency Report - ${selectedConstituency}`;
        break;
      case 'financial':
        ref = financialReportRef;
        title = `Financial Summary - ${selectedPeriod}`;
        break;
      default:
        toast({
          title: "Error",
          description: "Invalid report type",
          variant: "destructive"
        });
        return;
    }
    
    if (!ref || !ref.current) {
      toast({
        title: "Error",
        description: "Report content not available",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Generating PDF",
      description: "Please wait while we prepare your download"
    });

    try {
      // Small delay to ensure toast is shown before heavy processing starts
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(ref.current, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable logging for better performance
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Slightly lower quality for better performance
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Add title
      pdf.setFontSize(18);
      pdf.text(title, pdfWidth/2, 20, { align: 'center' });
      
      // Calculate image dimensions to fit page while maintaining aspect ratio
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, (pdfHeight - 40) / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      pdf.addImage(imgData, 'JPEG', imgX, 30, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Your report has been downloaded"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Try using a smaller date range or fewer records.",
        variant: "destructive"
      });
    }
  }, [monthlyReportRef, constituencyReportRef, financialReportRef, selectedMonth, selectedConstituency, selectedPeriod, toast]);

  // Safely format a date with fallback
  const formatDate = useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return 'N/A';
    }
  }, []);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Generate and download reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="monthly" onValueChange={setSelectedReport}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="monthly">Monthly Progress</TabsTrigger>
              <TabsTrigger value="constituency">Constituency-wise</TabsTrigger>
              <TabsTrigger value="financial">Financial Summary</TabsTrigger>
            </TabsList>
            
            {/* Monthly Progress Report */}
            <TabsContent value="monthly" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Monthly Progress Report</h3>
                <div className="flex items-center gap-2">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {getLast12Months().map(month => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" onClick={() => handlePrint('monthly')}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  
                  <Button size="sm" onClick={() => handleDownload('monthly')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border p-6" ref={monthlyReportRef}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Monthly Progress Report</h2>
                  <p className="text-muted-foreground">Period: {selectedMonth}</p>
                  <p className="text-muted-foreground">Generated on: {formatDate(new Date().toISOString())}</p>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center h-60">
                    <p>Loading report data...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Progress Summary</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-muted rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Total Houses</p>
                          <p className="text-2xl font-bold">{getMonthlyData().length}</p>
                        </div>
                        <div className="bg-green-100 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="text-2xl font-bold">
                            {getMonthlyData().filter(h => h.stage === 'Completed').length}
                          </p>
                        </div>
                        <div className="bg-blue-100 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">In Progress</p>
                          <p className="text-2xl font-bold">
                            {getMonthlyData().filter(h => h.stage !== 'Completed' && h.stage !== 'Not Started').length}
                          </p>
                        </div>
                        <div className="bg-amber-100 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Not Started</p>
                          <p className="text-2xl font-bold">
                            {getMonthlyData().filter(h => h.stage === 'Not Started').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {getMonthlyData().length > 0 && (
                      <>
                        <div className="mb-8">
                          <h3 className="text-lg font-medium mb-4">Progress by Stage</h3>
                          <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={generateMonthlyProgressData()}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value} houses`, 'Count']} />
                                <Legend />
                                <Bar dataKey="count" name="House Count" fill="#8884d8" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-4">Recent Updates</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Beneficiary Name
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stage
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Progress
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Updated
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {getMonthlyData().slice(0, 10).map((house, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-4 py-2 text-sm">{house.beneficiaryName}</td>
                                    <td className="px-4 py-2 text-sm">{house.village}, {house.constituency}</td>
                                    <td className="px-4 py-2 text-sm">{house.stage}</td>
                                    <td className="px-4 py-2 text-sm">{house.progress}%</td>
                                    <td className="px-4 py-2 text-sm">{formatDate(house.lastUpdated)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {getMonthlyData().length === 0 && (
                      <div className="flex justify-center items-center h-60">
                        <p className="text-gray-500">No data available for this month</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
            
            {/* Constituency-wise Report */}
            <TabsContent value="constituency" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Constituency-wise Report</h3>
                <div className="flex items-center gap-2">
                  <Select value={selectedConstituency} onValueChange={setSelectedConstituency}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Constituency" />
                    </SelectTrigger>
                    <SelectContent>
                      {constituencies.map(constituency => (
                        <SelectItem key={constituency} value={constituency}>{constituency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" onClick={() => handlePrint('constituency')}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  
                  <Button size="sm" onClick={() => handleDownload('constituency')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border p-6" ref={constituencyReportRef}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Constituency Report</h2>
                  <p className="text-muted-foreground">
                    Constituency: {selectedConstituency === "All" ? "All Constituencies" : selectedConstituency}
                  </p>
                  <p className="text-muted-foreground">Generated on: {formatDate(new Date().toISOString())}</p>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center h-60">
                    <p>Loading report data...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Summary</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-muted rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Total Houses</p>
                          <p className="text-2xl font-bold">{getConstituencyData().length}</p>
                        </div>
                        <div className="bg-green-100 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="text-2xl font-bold">
                            {getConstituencyData().filter(h => h.stage === 'Completed').length}
                          </p>
                        </div>
                        <div className="bg-blue-100 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">In Progress</p>
                          <p className="text-2xl font-bold">
                            {getConstituencyData().filter(h => h.stage !== 'Completed' && h.stage !== 'Not Started').length}
                          </p>
                        </div>
                        <div className="bg-amber-100 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Average Progress</p>
                          <p className="text-2xl font-bold">
                            {getConstituencyData().length > 0 
                              ? Math.round(getConstituencyData().reduce((sum, house) => sum + (house.progress || 0), 0) / getConstituencyData().length) 
                              : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {getConstituencyData().length > 0 && (
                      <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div>
                          <h3 className="text-lg font-medium mb-4">Status Distribution</h3>
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={generateConstituencyData()}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={true}
                                  outerRadius={100}
                                  fill="#8884d8"
                                  dataKey="value"
                                  nameKey="name"
                                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                  {generateConstituencyData().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} houses`, 'Count']} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-4">Villages</h3>
                          <div className="overflow-y-auto max-h-[300px]">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="sticky top-0 bg-white z-10">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Village
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Houses
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Completed
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {Array.from(new Set(getConstituencyData()
                                  .filter(h => h.village) // Filter out items without village
                                  .map(h => h.village)))
                                  .sort()
                                  .map(village => {
                                    if (!village) return null;
                                    const villageHouses = getConstituencyData().filter(h => h.village === village);
                                    const completedHouses = villageHouses.filter(h => h.stage === 'Completed').length;
                                    
                                    return (
                                      <tr key={village}>
                                        <td className="px-4 py-2 text-sm">{village}</td>
                                        <td className="px-4 py-2 text-sm">{villageHouses.length}</td>
                                        <td className="px-4 py-2 text-sm">
                                          {completedHouses} ({villageHouses.length > 0 ? Math.round((completedHouses / villageHouses.length) * 100) : 0}%)
                                        </td>
                                      </tr>
                                    );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Beneficiary List</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Beneficiary Name
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Village
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stage
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Progress
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Updated
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {getConstituencyData().slice(0, 10).map((house, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-2 text-sm">{house.beneficiaryName}</td>
                                <td className="px-4 py-2 text-sm">{house.village}</td>
                                <td className="px-4 py-2 text-sm">{house.stage}</td>
                                <td className="px-4 py-2 text-sm">{house.progress}%</td>
                                <td className="px-4 py-2 text-sm">{formatDate(house.lastUpdated)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {getConstituencyData().length === 0 && (
                      <div className="flex justify-center items-center h-60">
                        <p className="text-gray-500">No data available for this constituency</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Financial Summary Report */}
            <TabsContent value="financial" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Financial Summary Report</h3>
                <div className="flex items-center gap-2">
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Last Month">Last Month</SelectItem>
                      <SelectItem value="Last 3 Months">Last 3 Months</SelectItem>
                      <SelectItem value="Last 6 Months">Last 6 Months</SelectItem>
                      <SelectItem value="Last Year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" onClick={() => handlePrint('financial')}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  
                  <Button size="sm" onClick={() => handleDownload('financial')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border p-6" ref={financialReportRef}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Financial Summary Report</h2>
                  <p className="text-muted-foreground">Period: {selectedPeriod}</p>
                  <p className="text-muted-foreground">Generated on: {formatDate(new Date().toISOString())}</p>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center h-60">
                    <p>Loading report data...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Fund Summary</h3>
                      <div className="grid grid-cols-4 gap-4">
                        {generateFinancialData().map((item, index) => (
                          <div key={index} className={`rounded-lg p-4 ${
                            index === 0 ? 'bg-blue-100' : 
                            index === 1 ? 'bg-green-100' : 
                            index === 2 ? 'bg-amber-100' : 
                            'bg-red-100'
                          }`}>
                            <p className="text-sm text-muted-foreground">{item.name}</p>
                            <p className="text-2xl font-bold">₹{item.amount.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {getFinancialData().length > 0 && (
                      <>
                        <div className="mb-8">
                          <h3 className="text-lg font-medium mb-4">Fund Utilization</h3>
                          <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={generateFinancialData()}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                                <Legend />
                                <Bar dataKey="amount" name="Amount (₹)" fill="#8884d8" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                          <div>
                            <h3 className="text-lg font-medium mb-4">Constituency-wise Utilization</h3>
                            <div className="overflow-y-auto max-h-[300px]">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="sticky top-0 bg-white z-10">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Constituency
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Allocated
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Utilized
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      %
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {constituencies.filter(c => c !== "All").map(constituency => {
                                    const constituencyHouses = getFinancialData().filter(h => h.constituency === constituency);
                                    
                                    let allocated = 0;
                                    let utilized = 0;
                                    
                                    constituencyHouses.forEach(house => {
                                      try {
                                        // Check for nested fundDetails first
                                        if (house.fundDetails) {
                                          allocated += parseFloat(String(house.fundDetails.allocated || '0').replace(/[^\d.]/g, '')) || 0;
                                          utilized += parseFloat(String(house.fundDetails.utilized || house.fundDetails.utilized || '0').replace(/[^\d.]/g, '')) || 0;
                                        } 
                                      } catch (e) {
                                        console.error('Error processing fund data:', e);
                                      }
                                    });
                                    
                                    const percentage = allocated > 0 ? Math.round((utilized / allocated) * 100) : 0;
                                    
                                    return (
                                      <tr key={constituency}>
                                        <td className="px-4 py-2 text-sm">{constituency}</td>
                                        <td className="px-4 py-2 text-sm">₹{allocated.toLocaleString()}</td>
                                        <td className="px-4 py-2 text-sm">₹{utilized.toLocaleString()}</td>
                                        <td className="px-4 py-2 text-sm">{percentage}%</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium mb-4">Stage-wise Fund Allocation</h3>
                            <div className="overflow-y-auto max-h-[300px]">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="sticky top-0 bg-white z-10">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Stage
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Houses
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Allocated
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Released
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {Array.from(new Set(getFinancialData()
                                    .filter(h => h.stage) // Filter out undefined stages
                                    .map(h => h.stage)))
                                    .sort()
                                    .map(stage => {
                                      if (!stage) return null;
                                      const stageHouses = getFinancialData().filter(h => h.stage === stage);
                                      
                                      let allocated = 0;
                                      let released = 0;
                                      
                                      stageHouses.forEach(house => {
                                        try {
                                          // Check for nested fundDetails first
                                          if (house.fundDetails) {
                                            allocated += parseFloat(String(house.fundDetails.allocated || '0').replace(/[^\d.]/g, '')) || 0;
                                            released += parseFloat(String(house.fundDetails.released || '0').replace(/[^\d.]/g, '')) || 0;
                                          }
                                        } catch (e) {
                                          console.error('Error processing fund data:', e);
                                        }
                                      });
                                      
                                      return (
                                        <tr key={stage}>
                                          <td className="px-4 py-2 text-sm">{stage}</td>
                                          <td className="px-4 py-2 text-sm">{stageHouses.length}</td>
                                          <td className="px-4 py-2 text-sm">₹{allocated.toLocaleString()}</td>
                                          <td className="px-4 py-2 text-sm">₹{released.toLocaleString()}</td>
                                        </tr>
                                      );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Beneficiary Name
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Allocated
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Released
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Utilized
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {getFinancialData().slice(0, 10).map((house, index) => {
                                  // Get fund values, checking nested fundDetails first
                                  let allocated = '₹0';
                                  let released = '₹0';
                                  let utilized = '₹0';
                                  
                                  try {
                                    if (house.fundDetails) {
                                      allocated = house.fundDetails.allocated || '₹0';
                                      released = house.fundDetails.released || '₹0';
                                      utilized = house.fundDetails.utilized ||'₹0';
                                    }
                                  } catch (e) {
                                    console.error('Error processing fund data:', e);
                                  }
                                  
                                  return (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-4 py-2 text-sm">{house.beneficiaryName}</td>
                                      <td className="px-4 py-2 text-sm">{house.village}, {house.constituency}</td>
                                      <td className="px-4 py-2 text-sm">{allocated}</td>
                                      <td className="px-4 py-2 text-sm">{released}</td>
                                      <td className="px-4 py-2 text-sm">{utilized}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {getFinancialData().length === 0 && (
                      <div className="flex justify-center items-center h-60">
                        <p className="text-gray-500">No data available for this period</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

