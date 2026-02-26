'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import Pagination from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Receipt,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  Calendar as CalendarIcon,
  Download,
  SlidersHorizontal,
  GraduationCap,
  School,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Settings2,
  RotateCcw,
} from 'lucide-react'
import {
  getTransactions,
  getTransactionCount,
  getTransactionStats,
  getTransactionsForExport,
  type TransactionWithStudent,
} from '@/actions/transactions'
import type { TransactionType, SchoolLevel, StudentType } from '@prisma/client'

type SortField = 'date' | 'amount' | 'student'
type SortDirection = 'asc' | 'desc'
type FilterType = 'all' | 'payment' | 'lunch_card' | 'adjustment' | 'lunch_used'
type DatePreset = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_30' | 'custom'
type SchoolLevelFilter = 'all' | 'elementary' | 'high_school'
type StudentTypeFilter = 'all' | 'regular' | 'staff_faculty' | 'student_unlimited'

const ITEMS_PER_PAGE = 25

const DATE_PRESETS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_30', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
] as const

function getDateRange(preset: DatePreset): { start: Date | null; end: Date | null } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'today':
      return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) }
    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      return { start: yesterday, end: new Date(today.getTime() - 1) }
    }
    case 'this_week': {
      const dayOfWeek = today.getDay()
      const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
      return { start: startOfWeek, end: now }
    }
    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: startOfMonth, end: now }
    }
    case 'last_30': {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      return { start: thirtyDaysAgo, end: now }
    }
    default:
      return { start: null, end: null }
  }
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Filter states
  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevelFilter>('all')
  const [studentType, setStudentType] = useState<StudentTypeFilter>('all')
  const [isExporting, setIsExporting] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const isInitialMount = useRef(true)

  const [stats, setStats] = useState({
    totalLunchesAdded: 0,
    totalLunchesUsed: 0,
    paymentCount: 0,
    adjustmentCount: 0,
    usedCount: 0,
  })

  // Get active date range
  const getActiveDateRange = useCallback(() => {
    if (datePreset === 'custom' && customDateRange.from && customDateRange.to) {
      return {
        start: customDateRange.from,
        end: new Date(customDateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
    }
    return getDateRange(datePreset)
  }, [datePreset, customDateRange])

  const fetchStats = useCallback(async () => {
    try {
      const { start, end } = getActiveDateRange()
      const statsData = await getTransactionStats({
        transactionType: filter as TransactionType | 'all',
        startDate: start || undefined,
        endDate: end || undefined,
        schoolLevel: schoolLevel as SchoolLevel | 'all',
        studentType: studentType,
      })
      setStats(statsData)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [filter, getActiveDateRange, schoolLevel, studentType])

  const fetchTransactions = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }
    try {
      const { start, end } = getActiveDateRange()

      const filters = {
        transactionType: filter as TransactionType | 'all',
        search: debouncedSearch || undefined,
        startDate: start || undefined,
        endDate: end || undefined,
        schoolLevel: schoolLevel as SchoolLevel | 'all',
        studentType: studentType,
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
      }

      const [count, data] = await Promise.all([
        getTransactionCount(filters),
        getTransactions(filters),
      ])

      setTotalCount(count)

      let sortedData = data
      if (sortField === 'date' && sortDirection === 'asc') {
        sortedData = [...data].reverse()
      } else if (sortField === 'amount') {
        sortedData = [...data].sort((a, b) => {
          const comparison = a.lunchesChange - b.lunchesChange
          return sortDirection === 'asc' ? comparison : -comparison
        })
      } else if (sortField === 'student') {
        sortedData = [...data].sort((a, b) => {
          const comparison = a.student.name.localeCompare(b.student.name)
          return sortDirection === 'asc' ? comparison : -comparison
        })
      }

      setTransactions(sortedData)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    }
    setLoading(false)
    setIsRefreshing(false)
  }, [filter, debouncedSearch, sortField, sortDirection, currentPage, getActiveDateRange, schoolLevel, studentType])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchTransactions(isInitialMount.current)
    isInitialMount.current = false
  }, [fetchTransactions])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [filter, sortField, sortDirection, debouncedSearch, datePreset, customDateRange, schoolLevel, studentType])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const { start, end } = getActiveDateRange()
      const data = await getTransactionsForExport({
        transactionType: filter as TransactionType | 'all',
        startDate: start || undefined,
        endDate: end || undefined,
        schoolLevel: schoolLevel as SchoolLevel | 'all',
        studentType: studentType,
      })

      const headers = ['Date', 'Time', 'Student', 'Barcode', 'School Level', 'Student Type', 'Type', 'Change', 'Previous', 'New Balance', 'Amount Paid', 'Notes']
      const rows = data.map((tx) => {
        const date = new Date(tx.createdAt)
        const studentTypeLabel = tx.studentType === 'staff_faculty' ? 'Staff/Faculty' :
          tx.studentType === 'student_unlimited' ? 'Unlimited' : 'Regular'
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          tx.studentName,
          tx.studentBarcode,
          tx.schoolLevel === 'elementary' ? 'Elementary' : 'High School',
          studentTypeLabel,
          tx.transactionType,
          tx.lunchesChange,
          tx.previousLunches,
          tx.newLunches,
          tx.amountPaid ? `$${tx.amountPaid.toFixed(2)}` : '',
          tx.notes,
        ]
      })

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export:', error)
    }
    setIsExporting(false)
  }

  const clearFilters = () => {
    setDatePreset('all')
    setCustomDateRange({ from: undefined, to: undefined })
    setSchoolLevel('all')
    setStudentType('all')
    setFilter('all')
    setSearchQuery('')
  }

  const hasActiveFilters = datePreset !== 'all' || schoolLevel !== 'all' || studentType !== 'all' || filter !== 'all' || searchQuery !== ''
  const activeFilterCount = [datePreset !== 'all', schoolLevel !== 'all', studentType !== 'all', filter !== 'all', searchQuery !== ''].filter(Boolean).length

  const getTypeBadgeVariant = (type: TransactionType) => {
    switch (type) {
      case 'payment':
      case 'lunch_card':
        return 'success'
      case 'lunch_used':
        return 'destructive'
      case 'adjustment':
        return 'teal'
      default:
        return 'muted'
    }
  }

  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'lunch_used':
        return 'Used'
      case 'lunch_card':
        return 'Lunch Card'
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
            <p className="text-sm text-muted-foreground">
              View and manage balance history and payment records
            </p>
          </div>
          <Button onClick={handleExport} disabled={isExporting} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalLunchesAdded}</p>
                  <p className="text-xs text-muted-foreground">Lunches Added</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalLunchesUsed}</p>
                  <p className="text-xs text-muted-foreground">Lunches Used</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.paymentCount}</p>
                  <p className="text-xs text-muted-foreground">Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Settings2 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.adjustmentCount}</p>
                  <p className="text-xs text-muted-foreground">Adjustments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Type Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="w-full">
          <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-background">
              All
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-background">
              Payments
            </TabsTrigger>
            <TabsTrigger value="lunch_card" className="data-[state=active]:bg-background">
              Lunch Cards
            </TabsTrigger>
            <TabsTrigger value="lunch_used" className="data-[state=active]:bg-background">
              Used
            </TabsTrigger>
            <TabsTrigger value="adjustment" className="data-[state=active]:bg-background">
              Adjustments
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <Card>
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CardHeader className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search students or parents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:ml-auto">
                  {/* Advanced Filters Toggle */}
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                          {activeFilterCount}
                        </Badge>
                      )}
                      <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>

                  {/* Sort */}
                  <Select
                    value={`${sortField}-${sortDirection}`}
                    onValueChange={(v) => {
                      const [field, dir] = v.split('-') as [SortField, SortDirection]
                      setSortField(field)
                      setSortDirection(dir)
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Newest</SelectItem>
                      <SelectItem value="date-asc">Oldest</SelectItem>
                      <SelectItem value="amount-desc">Amount ↓</SelectItem>
                      <SelectItem value="amount-asc">Amount ↑</SelectItem>
                      <SelectItem value="student-asc">Name A-Z</SelectItem>
                      <SelectItem value="student-desc">Name Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CollapsibleContent>
              <Separator />
              <CardContent className="p-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Date Range</Label>
                    <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
                      <SelectTrigger>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_PRESETS.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {datePreset === 'custom' && (
                      <div className="flex gap-2 pt-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {customDateRange.from ? format(customDateRange.from, 'MMM d') : 'Start'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={customDateRange.from}
                              onSelect={(date) => setCustomDateRange((prev) => ({ ...prev, from: date }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {customDateRange.to ? format(customDateRange.to, 'MMM d') : 'End'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={customDateRange.to}
                              onSelect={(date) => setCustomDateRange((prev) => ({ ...prev, to: date }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>

                  {/* School Level */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">School Level</Label>
                    <Select value={schoolLevel} onValueChange={(v) => setSchoolLevel(v as SchoolLevelFilter)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="elementary">
                          <span className="flex items-center gap-2">
                            <School className="h-4 w-4" />
                            Elementary
                          </span>
                        </SelectItem>
                        <SelectItem value="high_school">
                          <span className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            High School
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Student Type */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Student Type</Label>
                    <Select value={studentType} onValueChange={(v) => setStudentType(v as StudentTypeFilter)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="staff_faculty">Staff/Faculty</SelectItem>
                        <SelectItem value="student_unlimited">Unlimited Plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Filters */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">&nbsp;</Label>
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      className="w-full gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{totalCount}</span> transactions
            {hasActiveFilters && ' (filtered)'}
          </p>
          {isRefreshing && <span className="text-muted-foreground animate-pulse">Updating...</span>}
        </div>

        {/* Table */}
        <Card>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="h-8 w-8 text-muted-foreground/50" />
                        <p className="font-medium">No transactions found</p>
                        <p className="text-sm text-muted-foreground">
                          {hasActiveFilters ? 'Try adjusting your filters' : 'Transactions will appear here'}
                        </p>
                        {hasActiveFilters && (
                          <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="cursor-pointer"
                      onClick={() => (window.location.href = `/admin/transactions/${tx.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{format(new Date(tx.createdAt!), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.createdAt!), 'h:mm a')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/students/${tx.studentId}`}
                            className="font-medium text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {tx.student.name}
                          </Link>
                          {tx.student.studentType !== 'regular' && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200"
                            >
                              {tx.student.studentType === 'staff_faculty' ? 'STAFF' : 'UNLIMITED'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{tx.student.barcode}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {tx.student.schoolLevel === 'elementary' ? 'Elem' : 'HS'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(tx.transactionType)}>
                          {getTypeLabel(tx.transactionType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-bold ${
                            tx.lunchesChange >= 0
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {tx.lunchesChange >= 0 ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          {Math.abs(tx.lunchesChange)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground font-mono">
                          {tx.previousLunches} → {tx.newLunches}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm text-muted-foreground truncate block">
                              {tx.notes || '—'}
                            </span>
                          </TooltipTrigger>
                          {tx.notes && (
                            <TooltipContent>
                              <p className="max-w-xs">{tx.notes}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden divide-y">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 px-4">
                <Receipt className="h-8 w-8 text-muted-foreground/50" />
                <p className="font-medium">No transactions found</p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              transactions.map((tx) => (
                <Link
                  key={tx.id}
                  href={`/admin/transactions/${tx.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`w-1 h-12 rounded-full ${
                      tx.lunchesChange >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-medium truncate">{tx.student.name}</span>
                        {tx.student.studentType !== 'regular' && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-200 flex-shrink-0"
                          >
                            {tx.student.studentType === 'staff_faculty' ? 'STAFF' : 'UNL'}
                          </Badge>
                        )}
                      </div>
                      <span
                        className={`font-mono font-bold flex-shrink-0 ${
                          tx.lunchesChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.lunchesChange >= 0 ? '+' : ''}
                        {tx.lunchesChange}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant={getTypeBadgeVariant(tx.transactionType)} className="text-xs">
                        {getTypeLabel(tx.transactionType)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {tx.student.schoolLevel === 'elementary' ? 'Elem' : 'HS'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(tx.createdAt!), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={handlePageChange}
          isLoading={isRefreshing}
        />
      </div>
    </TooltipProvider>
  )
}
