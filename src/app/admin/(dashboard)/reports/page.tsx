'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3,
  Download,
  Loader2,
  Users,
  GraduationCap,
  Utensils,
  Filter,
} from 'lucide-react'
import {
  getMealUsageReport,
  getReportStats,
  getMealUsageForExport,
  type MealUsageReport,
  type ReportStats,
  type ReportFilters,
} from '@/actions/reports'
import Pagination from '@/components/Pagination'

type StudentTypeFilter = 'all' | 'regular' | 'staff_faculty' | 'student_unlimited'
type SchoolLevelFilter = 'all' | 'elementary' | 'high_school'

const ITEMS_PER_PAGE = 25

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [reportData, setReportData] = useState<MealUsageReport[]>([])
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter state
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [startDate, setStartDate] = useState(weekAgo.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])
  const [studentType, setStudentType] = useState<StudentTypeFilter>('all')
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevelFilter>('all')

  const buildFilters = useCallback((): ReportFilters => {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    return {
      startDate: start,
      endDate: end,
      studentType: studentType,
      schoolLevel: schoolLevel,
    }
  }, [startDate, endDate, studentType, schoolLevel])

  const generateReport = useCallback(async () => {
    setLoading(true)
    setCurrentPage(1)

    try {
      const filters = buildFilters()
      const [data, statsData] = await Promise.all([
        getMealUsageReport(filters),
        getReportStats(filters),
      ])
      setReportData(data)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setLoading(false)
    }
  }, [buildFilters])

  // Generate report on mount
  useEffect(() => {
    generateReport()
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const filters = buildFilters()
      const data = await getMealUsageForExport(filters)

      // Create CSV content
      const headers = ['Student Name', 'Student Type', 'School Level', 'Parent Name', 'Meals Count']
      const rows = data.map(row => [
        `"${row.studentName}"`,
        `"${row.studentType}"`,
        `"${row.schoolLevel}"`,
        `"${row.parentName}"`,
        row.mealsCount,
      ])

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `meal-usage-report-${startDate}-to-${endDate}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to export report:', error)
    } finally {
      setExporting(false)
    }
  }

  // Pagination
  const totalPages = Math.ceil(reportData.length / ITEMS_PER_PAGE)
  const paginatedData = reportData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="w-full max-w-[1200px]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-7">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-white border border-gray-100 rounded-[14px] flex items-center justify-center text-purple-600 shadow-sm">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--aca-navy)] tracking-tight">Reports</h1>
            <p className="text-sm text-gray-400 hidden sm:block">Meal usage analytics and exports</p>
          </div>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting || reportData.length === 0}
          variant="outline"
          className="hidden sm:inline-flex"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export CSV
            </>
          )}
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="mb-6">
        <CardHeader className="py-3.5 px-5 border-b bg-gray-50">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Filter className="h-4 w-4" />
            Report Filters
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Student Type</Label>
              <Select value={studentType} onValueChange={(v) => setStudentType(v as StudentTypeFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="staff_faculty">Staff/Faculty</SelectItem>
                  <SelectItem value="student_unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>School Level</Label>
              <Select value={schoolLevel} onValueChange={(v) => setSchoolLevel(v as SchoolLevelFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="elementary">Elementary</SelectItem>
                  <SelectItem value="high_school">High School</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <Button onClick={generateReport} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="py-4">
            <CardContent className="p-0 px-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                <Utensils className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-gray-700">{stats.totalMeals}</div>
              <div className="text-xs text-gray-400 font-medium">Total Meals</div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="p-0 px-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--aca-teal-subtle)] text-[var(--aca-teal)] flex items-center justify-center mb-2">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-gray-700">{stats.regularMeals}</div>
              <div className="text-xs text-gray-400 font-medium">Regular</div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="p-0 px-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-gray-700">{stats.staffFacultyMeals}</div>
              <div className="text-xs text-gray-400 font-medium">Staff/Faculty</div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="p-0 px-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-gray-700">{stats.unlimitedMeals}</div>
              <div className="text-xs text-gray-400 font-medium">Unlimited</div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="p-0 px-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-gray-700">{stats.elementaryMeals}</div>
              <div className="text-xs text-gray-400 font-medium">Elementary</div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="p-0 px-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--aca-gold-subtle)] text-[var(--aca-gold-dark)] flex items-center justify-center mb-2">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-gray-700">{stats.highSchoolMeals}</div>
              <div className="text-xs text-gray-400 font-medium">High School</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile Export Button */}
      <div className="sm:hidden mb-4">
        <Button
          onClick={handleExport}
          disabled={exporting || reportData.length === 0}
          variant="outline"
          className="w-full"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export CSV
            </>
          )}
        </Button>
      </div>

      {/* Results Table */}
      {loading ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center gap-4 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span>Generating report...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="py-0 overflow-hidden">
            <CardHeader className="py-3.5 px-5 border-b bg-gray-50">
              <span className="text-sm text-gray-500 font-medium">
                {reportData.length} {reportData.length === 1 ? 'student' : 'students'} with meals in this period
              </span>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead className="text-right">Meals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row) => (
                  <TableRow key={row.studentId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br from-[var(--aca-teal)] to-[var(--aca-teal-dark)]">
                          {row.studentName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-700">{row.studentName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.studentType === 'regular' ? (
                        <Badge variant="muted">Regular</Badge>
                      ) : row.studentType === 'staff_faculty' ? (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">Staff</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">Unlimited</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          row.schoolLevel === 'elementary'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-[var(--aca-gold-subtle)] text-[var(--aca-gold-dark)] border-[var(--aca-gold)]'
                        }
                      >
                        {row.schoolLevel === 'elementary' ? 'Elem' : 'HS'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{row.parentName}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono font-bold text-lg text-[var(--aca-teal)]">
                        {row.mealsCount}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4 text-gray-400">
                        <Utensils className="h-12 w-12 opacity-50" />
                        <div>
                          <p className="font-semibold text-gray-600">No meal data found</p>
                          <p className="text-sm">Try adjusting your date range or filters</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {reportData.length > ITEMS_PER_PAGE && (
            <div className="mt-5">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={reportData.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
                isLoading={loading}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
