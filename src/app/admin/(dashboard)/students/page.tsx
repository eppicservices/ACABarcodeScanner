'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Pagination from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  Users,
  Plus,
  Search,
  X,
  GraduationCap,
  AlertTriangle,
  Ban,
  ChevronRight,
  ArrowUpDown,
  DollarSign,
  UserPlus,
  Loader2,
} from 'lucide-react'
import {
  getStudentsWithParents,
  getStudentStats,
  updateStudentsStatus,
  type StudentWithParent as StudentWithParentType,
  type StudentFilters,
} from '@/actions/students'
import { getLowBalanceThresholds } from '@/actions/settings'
import {
  getBalanceState,
  getBalanceDescription,
  BALANCE_STATE_TEXT_CLASS,
  type LowBalanceThresholds,
} from '@/lib/balance'
import type { ActiveFilter } from '@/types/database'

interface StudentWithParent extends StudentWithParentType {}

type SortField = 'name' | 'balance' | 'level'
type SortDirection = 'asc' | 'desc'
type SchoolLevelFilter = 'all' | 'elementary' | 'high_school'
type StudentTypeFilter = 'all' | 'regular' | 'staff_faculty' | 'student_unlimited'

const ITEMS_PER_PAGE = 25

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentWithParent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<SchoolLevelFilter>('all')
  const [typeFilter, setTypeFilter] = useState<StudentTypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<ActiveFilter>('active')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [thresholds, setThresholds] = useState<LowBalanceThresholds | null>(null)
  const router = useRouter()

  const [stats, setStats] = useState({
    activeCount: 0,
    inactiveCount: 0,
    lowBalanceCount: 0,
    elementaryCount: 0,
    highSchoolCount: 0,
    unlimitedCount: 0,
  })

  const fetchStats = useCallback(async () => {
    const statsData = await getStudentStats()
    setStats(statsData)
  }, [])

  const fetchStudents = useCallback(async () => {
    setLoading(true)

    const filters: StudentFilters = {
      schoolLevel: filter,
      studentType: typeFilter,
      status: statusFilter,
      search: search || undefined,
      sortField,
      sortDirection,
    }

    const allData = await getStudentsWithParents(filters)

    setTotalCount(allData.length)

    const from = (currentPage - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE
    const paginatedData = allData.slice(from, to)

    setStudents(paginatedData.map(s => ({
      ...s,
      school_level: s.schoolLevel,
      is_active: s.isActive,
      parent_id: s.parentId,
      created_at: s.createdAt,
    })) as unknown as StudentWithParent[])

    setLoading(false)
  }, [filter, typeFilter, statusFilter, sortField, sortDirection, search, currentPage])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    getLowBalanceThresholds().then(setThresholds)
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    setCurrentPage(1)
  }, [filter, typeFilter, statusFilter, sortField, sortDirection, search])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedStudents(new Set())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'balance' ? 'desc' : 'asc')
    }
  }

  const handleBulkStatusUpdate = async (setActive: boolean) => {
    if (selectedStudents.size === 0) return

    setBulkUpdating(true)
    try {
      await updateStudentsStatus(Array.from(selectedStudents), setActive)
      await fetchStudents()
      await fetchStats()
      setSelectedStudents(new Set())
    } catch (error) {
      console.error('Failed to update student status:', error)
      alert('Failed to update student status')
    } finally {
      setBulkUpdating(false)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)))
    }
  }


  const { activeCount, inactiveCount, lowBalanceCount, elementaryCount, highSchoolCount, unlimitedCount } = stats

  return (
    <div className="w-full max-w-[1200px]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-7">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--aca-teal-subtle)] to-white border border-gray-100 rounded-[14px] flex items-center justify-center text-[var(--aca-teal)] shadow-sm">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--aca-navy)] tracking-tight">Students</h1>
            <p className="text-sm text-gray-400 hidden sm:block">Manage student accounts and balances</p>
          </div>
        </div>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/admin/students/new">
            <Plus className="h-4 w-4" />
            Add Student
          </Link>
        </Button>
      </div>

      {/* Desktop Stats Grid */}
      <div className="hidden sm:grid grid-cols-4 gap-4 mb-6">
        <Card className="py-4">
          <CardContent className="p-0 px-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--aca-teal-subtle)] text-[var(--aca-teal)] flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-700">{activeCount}</div>
              <div className="text-xs text-gray-400 font-medium">Active Students</div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="p-0 px-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-700">{elementaryCount}</div>
              <div className="text-xs text-gray-400 font-medium">Elementary</div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="p-0 px-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--aca-gold-subtle)] text-[var(--aca-gold-dark)] flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-700">{highSchoolCount}</div>
              <div className="text-xs text-gray-400 font-medium">High School</div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4 border-[var(--error-border)]">
          <CardContent className="p-0 px-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--error-bg)] text-[var(--error)] flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-700">{lowBalanceCount}</div>
              <div className="text-xs text-gray-400 font-medium">Low Balance</div>
            </div>
          </CardContent>
        </Card>
        {inactiveCount > 0 && (
          <Card className="py-4 border-gray-300">
            <CardContent className="p-0 px-5 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
                <Ban className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-700">{inactiveCount}</div>
                <div className="text-xs text-gray-400 font-medium">Inactive</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Stats Pills */}
      <div className="flex sm:hidden flex-wrap gap-2 mb-4 justify-center">
        <Badge variant="muted">{activeCount} Active</Badge>
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">{elementaryCount} Elem</Badge>
        <Badge variant="default">{highSchoolCount} HS</Badge>
        {unlimitedCount > 0 && <Badge className="bg-amber-100 text-amber-700 border-amber-200">{unlimitedCount} Unlimited</Badge>}
        {lowBalanceCount > 0 && <Badge variant="warning">{lowBalanceCount} Low</Badge>}
        {inactiveCount > 0 && <Badge variant="muted">{inactiveCount} Inactive</Badge>}
      </div>

      {/* Filters */}
      <Card className="mb-5 py-4">
        <CardContent className="p-0 px-4 sm:px-5 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by name, barcode, or parent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                onClick={() => setSearch('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Level Filter Pills */}
          <div className="flex gap-1.5 bg-gray-50 p-1 rounded-lg">
            {(['all', 'elementary', 'high_school'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  filter === level
                    ? 'bg-white text-[var(--aca-teal)] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white'
                }`}
              >
                {level === 'all' ? 'All' : level === 'elementary' ? 'Elementary' : 'High School'}
              </button>
            ))}
          </div>

          {/* Type & Status Filters */}
          <div className="flex gap-2 sm:contents">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as StudentTypeFilter)}>
              <SelectTrigger className="flex-1 sm:flex-none sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="staff_faculty">Staff/Faculty</SelectItem>
                <SelectItem value="student_unlimited">Unlimited</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ActiveFilter)}>
              <SelectTrigger className="flex-1 sm:flex-none sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
                <SelectItem value="all">All Students</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="flex gap-2 sm:contents">
            <div className="flex items-center gap-2 flex-1 sm:flex-none sm:ml-auto">
              <span className="text-sm font-semibold text-gray-400 whitespace-nowrap hidden sm:inline">Sort:</span>
              <Select
                value={`${sortField}-${sortDirection}`}
                onValueChange={(v) => {
                  const [field, dir] = v.split('-') as [SortField, SortDirection]
                  setSortField(field)
                  setSortDirection(dir)
                }}
              >
                <SelectTrigger className="flex-1 sm:flex-none sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="balance-desc">Balance (High-Low)</SelectItem>
                  <SelectItem value="balance-asc">Balance (Low-High)</SelectItem>
                  <SelectItem value="level-asc">Level (Elem First)</SelectItem>
                  <SelectItem value="level-desc">Level (HS First)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedStudents.size > 0 && (
        <Card className="mb-5 py-3 bg-gradient-to-r from-[var(--aca-teal-subtle)] to-white border-2 border-[var(--aca-teal)]">
          <CardContent className="p-0 px-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-[var(--aca-teal-dark)] text-sm">
                {selectedStudents.size} selected
              </span>
              <button
                className="text-sm text-gray-500 underline hover:text-gray-700"
                onClick={() => setSelectedStudents(new Set())}
              >
                Clear selection
              </button>
            </div>
            <div className="flex gap-2.5">
              <Button
                variant="success"
                size="sm"
                onClick={() => handleBulkStatusUpdate(true)}
                disabled={bulkUpdating}
              >
                {bulkUpdating ? 'Updating...' : 'Set Active'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="bg-gray-500 text-white hover:bg-gray-600"
                onClick={() => handleBulkStatusUpdate(false)}
                disabled={bulkUpdating}
              >
                {bulkUpdating ? 'Updating...' : 'Set Inactive'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Action Bar */}
      <div className="flex sm:hidden gap-2.5 mb-4">
        <Button asChild className="flex-1 flex-col h-auto py-4 gap-2">
          <Link href="/admin/students/new">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <span>Add Student</span>
          </Link>
        </Button>
        <Button asChild variant="success" className="flex-1 flex-col h-auto py-4 gap-2">
          <Link href="/admin/add-payment">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
            <span>Add Payment</span>
          </Link>
        </Button>
      </div>

      {loading ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center gap-4 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--aca-teal)]" />
            <span>Loading students...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden sm:block py-0 overflow-hidden">
            <CardHeader className="py-3.5 px-5 border-b bg-gray-50">
              <span className="text-sm text-gray-500 font-medium">
                {totalCount} {totalCount === 1 ? 'student' : 'students'}
                {search && ` matching "${search}"`}
              </span>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={students.length > 0 && selectedStudents.size === students.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-[var(--aca-teal)] hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      Student
                      {sortField === 'name' && (
                        <span className="text-[var(--aca-teal)] font-bold">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-[var(--aca-teal)] hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('level')}
                  >
                    <div className="flex items-center gap-1.5">
                      Level
                      {sortField === 'level' && (
                        <span className="text-[var(--aca-teal)] font-bold">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-[var(--aca-teal)] hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('balance')}
                  >
                    <div className="flex items-center gap-1.5">
                      Balance
                      {sortField === 'balance' && (
                        <span className="text-[var(--aca-teal)] font-bold">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow
                    key={student.id}
                    className={`cursor-pointer ${!student.isActive ? 'opacity-65 bg-gray-50' : ''}`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={() => toggleStudentSelection(student.id)}
                      />
                    </TableCell>
                    <TableCell
                      onClick={() => router.push(`/admin/students/${student.id}`)}
                      className="font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-white font-semibold text-sm ${
                          student.isActive
                            ? 'bg-gradient-to-br from-[var(--aca-teal)] to-[var(--aca-teal-dark)]'
                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-700">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => router.push(`/admin/students/${student.id}`)}>
                      <code className="bg-gray-100 px-2.5 py-1 rounded text-xs text-[var(--aca-teal)] font-mono tracking-wide">
                        {student.barcode}
                      </code>
                    </TableCell>
                    <TableCell onClick={() => router.push(`/admin/students/${student.id}`)}>
                      <Badge
                        className={
                          student.schoolLevel === 'elementary'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-[var(--aca-gold-subtle)] text-[var(--aca-gold-dark)] border-[var(--aca-gold)]'
                        }
                      >
                        {student.schoolLevel === 'elementary' ? 'Elementary' : 'High School'}
                      </Badge>
                    </TableCell>
                    <TableCell
                      onClick={() => router.push(`/admin/students/${student.id}`)}
                      className="text-gray-500"
                    >
                      {student.parent.name}
                    </TableCell>
                    <TableCell onClick={() => router.push(`/admin/students/${student.id}`)}>
                      {student.studentType !== 'regular' ? (
                        <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white border-amber-400 font-bold">
                          UNLIMITED
                        </Badge>
                      ) : (
                        <span
                          className={`font-mono font-bold text-[15px] ${
                            BALANCE_STATE_TEXT_CLASS[
                              getBalanceState(student.balance, student.schoolLevel, thresholds)
                            ]
                          }`}
                          title={getBalanceDescription(student.balance, student.schoolLevel, thresholds)}
                          aria-label={getBalanceDescription(student.balance, student.schoolLevel, thresholds)}
                        >
                          {student.balance}
                        </span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => router.push(`/admin/students/${student.id}`)}>
                      <Badge variant={student.isActive ? 'success' : 'muted'}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4 text-gray-400">
                        <Search className="h-12 w-12 opacity-50" />
                        <div>
                          <p className="font-semibold text-gray-600">No students found</p>
                          <p className="text-sm">Try adjusting your search or filter</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile List View */}
          <Card className="sm:hidden py-0 overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-gray-50 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 tracking-wide">
                {totalCount} {totalCount === 1 ? 'student' : 'students'}
              </span>
              {students.length > 0 && (
                <button
                  className="text-xs font-semibold text-[var(--aca-teal)]"
                  onClick={toggleSelectAll}
                >
                  {selectedStudents.size === students.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </CardHeader>
            {students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-3.5">
                <Search className="h-10 w-10 opacity-50" />
                <p className="text-sm font-medium">No students found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center gap-3.5 px-4 py-3.5 ${
                      !student.isActive ? 'opacity-70 bg-gray-50' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={() => toggleStudentSelection(student.id)}
                      className="shrink-0"
                    />
                    <Link
                      href={`/admin/students/${student.id}`}
                      className="flex items-center gap-3.5 flex-1 min-w-0"
                    >
                      <div className={`w-[46px] h-[46px] rounded-[13px] flex items-center justify-center text-white font-bold text-[17px] shrink-0 shadow-md ${
                        student.isActive
                          ? 'bg-gradient-to-br from-[var(--aca-teal)] to-[var(--aca-teal-dark)]'
                          : 'bg-gradient-to-br from-gray-400 to-gray-500'
                      }`}>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-700 text-[15px] flex items-center gap-1.5">
                          {student.name}
                          {!student.isActive && (
                            <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-gray-400 mt-1.5">
                          <span className={`px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wide ${
                            student.schoolLevel === 'elementary'
                              ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'
                              : 'bg-gradient-to-r from-[var(--aca-gold-subtle)] to-amber-100 text-[var(--aca-gold-dark)]'
                          }`}>
                            {student.schoolLevel === 'elementary' ? 'Elem' : 'HS'}
                          </span>
                          <span className="font-mono text-[11px] tracking-wide">{student.barcode}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {student.studentType !== 'regular' ? (
                          <span className="px-2 py-1 rounded-md bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold uppercase">
                            Unlimited
                          </span>
                        ) : (
                          <span
                            className={`font-mono font-extrabold text-xl ${
                              BALANCE_STATE_TEXT_CLASS[
                                getBalanceState(student.balance, student.schoolLevel, thresholds)
                              ]
                            }`}
                            title={getBalanceDescription(student.balance, student.schoolLevel, thresholds)}
                            aria-label={getBalanceDescription(student.balance, student.schoolLevel, thresholds)}
                          >
                            {student.balance}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pagination */}
          <div className="mt-5">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              isLoading={loading}
            />
          </div>
        </>
      )}
    </div>
  )
}
