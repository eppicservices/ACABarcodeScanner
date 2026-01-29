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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  Plus,
  Search,
  X,
  Home,
  Ban,
  ChevronRight,
  Mail,
  DollarSign,
  UserPlus,
  Loader2,
  Check,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import {
  getParentsWithStudents,
  getParentStats,
  updateParentsStatus,
  updateParentsAndStudentsStatus,
  type ParentWithStudents,
} from '@/actions/parents'

type ActiveFilter = 'all' | 'active' | 'inactive'
type SortField = 'name' | 'balance' | 'children'
type SortDirection = 'asc' | 'desc'

const ITEMS_PER_PAGE = 25

export default function ParentsPage() {
  const [parents, setParents] = useState<ParentWithStudents[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ActiveFilter>('active')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [selectedParents, setSelectedParents] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [showCascadeModal, setShowCascadeModal] = useState(false)
  const [pendingDeactivation, setPendingDeactivation] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const router = useRouter()

  const [stats, setStats] = useState({
    activeCount: 0,
    inactiveCount: 0,
    totalStudents: 0,
    parentsWithMultipleKids: 0,
  })

  const fetchStats = useCallback(async () => {
    try {
      const stats = await getParentStats()
      setStats(stats)
    } catch (error) {
      console.error('Failed to fetch parent stats:', error)
    }
  }, [])

  const sendBalanceEmail = async (parentId: string) => {
    setSendingEmailFor(parentId)
    setEmailSuccess(null)
    setEmailError(null)

    try {
      const response = await fetch('/api/admin/send-balance-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: parentId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      setEmailSuccess(parentId)
      setTimeout(() => setEmailSuccess(null), 3000)
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to send email')
      setTimeout(() => setEmailError(null), 5000)
    } finally {
      setSendingEmailFor(null)
    }
  }

  const fetchParents = useCallback(async () => {
    setLoading(true)
    try {
      const allData = await getParentsWithStudents({
        status: statusFilter,
        search,
        sortField,
        sortDirection,
      })

      setTotalCount(allData.length)

      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE
      const paginatedData = allData.slice(from, to)

      setParents(paginatedData)
    } catch (error) {
      console.error('Failed to fetch parents:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sortField, sortDirection, search, currentPage])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchParents()
  }, [fetchParents])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, sortField, sortDirection, search])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedParents(new Set())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBulkStatusUpdate = async (setActive: boolean, cascadeToStudents: boolean = false) => {
    if (selectedParents.size === 0) return

    setBulkUpdating(true)
    setShowCascadeModal(false)
    try {
      const parentIds = Array.from(selectedParents)

      if (!setActive && cascadeToStudents) {
        await updateParentsAndStudentsStatus(parentIds, setActive)
      } else {
        await updateParentsStatus(parentIds, setActive)
      }

      await fetchParents()
      await fetchStats()
      setSelectedParents(new Set())
      setPendingDeactivation(new Set())
    } catch (error) {
      console.error('Failed to update parent status:', error)
      alert('Failed to update parent status')
    } finally {
      setBulkUpdating(false)
    }
  }

  const initiateDeactivation = () => {
    setPendingDeactivation(selectedParents)
    setShowCascadeModal(true)
  }

  const toggleParentSelection = (parentId: string) => {
    setSelectedParents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(parentId)) {
        newSet.delete(parentId)
      } else {
        newSet.add(parentId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedParents.size === parents.length) {
      setSelectedParents(new Set())
    } else {
      setSelectedParents(new Set(parents.map(p => p.id)))
    }
  }

  const { activeCount, inactiveCount, totalStudents, parentsWithMultipleKids } = stats

  return (
    <div className="w-full max-w-[1200px]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-7">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--aca-teal-subtle)] to-white border border-gray-100 rounded-[14px] flex items-center justify-center text-[var(--aca-teal)] shadow-sm">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--aca-navy)] tracking-tight">Parents</h1>
            <p className="text-sm text-gray-400 hidden sm:block">Manage parent contact information</p>
          </div>
        </div>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/admin/parents/new">
            <Plus className="h-4 w-4" />
            Add Parent
          </Link>
        </Button>
      </div>

      {/* Error Toast */}
      {emailError && (
        <Alert variant="destructive" className="mb-4">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{emailError}</AlertDescription>
        </Alert>
      )}

      {/* Desktop Stats Grid */}
      <div className="hidden sm:grid grid-cols-3 gap-4 mb-6">
        <Card className="py-4">
          <CardContent className="p-0 px-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--aca-teal-subtle)] text-[var(--aca-teal)] flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-700">{activeCount}</div>
              <div className="text-xs text-gray-400 font-medium">Active Parents</div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="p-0 px-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-700">{totalStudents}</div>
              <div className="text-xs text-gray-400 font-medium">Active Students</div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="p-0 px-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--aca-gold-subtle)] text-[var(--aca-gold-dark)] flex items-center justify-center">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-700">{parentsWithMultipleKids}</div>
              <div className="text-xs text-gray-400 font-medium">Multiple Children</div>
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
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">{totalStudents} Students</Badge>
        {parentsWithMultipleKids > 0 && (
          <Badge variant="default">{parentsWithMultipleKids} Multi</Badge>
        )}
        {inactiveCount > 0 && <Badge variant="muted">{inactiveCount} Inactive</Badge>}
      </div>

      {/* Filters */}
      <Card className="mb-5 py-4">
        <CardContent className="p-0 px-4 sm:px-5 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-[400px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-10"
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

          {search && (
            <span className="text-sm text-gray-400 hidden sm:inline">
              {totalCount} result{totalCount !== 1 ? 's' : ''}
            </span>
          )}

          {/* Status Filter & Sort - side by side on mobile */}
          <div className="flex gap-2 sm:contents">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ActiveFilter)}>
              <SelectTrigger className="flex-1 sm:flex-none sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
                <SelectItem value="all">All Parents</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
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
                <SelectTrigger className="flex-1 sm:flex-none sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="balance-desc">Balance (High-Low)</SelectItem>
                  <SelectItem value="balance-asc">Balance (Low-High)</SelectItem>
                  <SelectItem value="children-desc">Children (Most First)</SelectItem>
                  <SelectItem value="children-asc">Children (Least First)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedParents.size > 0 && (
        <Card className="mb-5 py-3 bg-gradient-to-r from-[var(--aca-teal-subtle)] to-white border-2 border-[var(--aca-teal)]">
          <CardContent className="p-0 px-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-[var(--aca-teal-dark)] text-sm">
                {selectedParents.size} selected
              </span>
              <button
                className="text-sm text-gray-500 underline hover:text-gray-700"
                onClick={() => setSelectedParents(new Set())}
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
                onClick={initiateDeactivation}
                disabled={bulkUpdating}
              >
                {bulkUpdating ? 'Updating...' : 'Set Inactive'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cascade Deactivation Modal */}
      <Dialog open={showCascadeModal} onOpenChange={setShowCascadeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Parents</DialogTitle>
            <DialogDescription>
              You are about to set {pendingDeactivation.size} parent{pendingDeactivation.size > 1 ? 's' : ''} as inactive.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Would you also like to set their students as inactive?
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowCascadeModal(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatusUpdate(false, false)}
            >
              Parents Only
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleBulkStatusUpdate(false, true)}
            >
              Parents & Students
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Action Bar */}
      <div className="flex sm:hidden gap-2.5 mb-4">
        <Button asChild className="flex-1 flex-col h-auto py-4 gap-2">
          <Link href="/admin/parents/new">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <span>Add Parent</span>
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
            <span>Loading parents...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden sm:block py-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={parents.length > 0 && selectedParents.size === parents.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Children</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parents.map((parent) => (
                  <TableRow
                    key={parent.id}
                    className={`cursor-pointer ${!parent.isActive ? 'opacity-65 bg-gray-50' : ''}`}
                    onClick={() => router.push(`/admin/parents/${parent.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedParents.has(parent.id)}
                        onCheckedChange={() => toggleParentSelection(parent.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-semibold text-base ${
                          parent.isActive
                            ? 'bg-gradient-to-br from-[var(--aca-teal)] to-[var(--aca-teal-dark)]'
                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {parent.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-700">{parent.name}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`mailto:${parent.email}`}
                        className="inline-flex items-center gap-1.5 text-[var(--aca-teal)] hover:text-[var(--aca-teal-dark)] text-sm"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {parent.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-sm text-gray-600">
                        {parent.students.filter(s => s.isActive).length}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={parent.isActive ? 'success' : 'muted'}>
                        {parent.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => sendBalanceEmail(parent.id)}
                          disabled={sendingEmailFor === parent.id || !parent.isActive}
                          className={`${emailSuccess === parent.id ? 'bg-green-50 text-green-600' : 'bg-[var(--aca-teal-subtle)] text-[var(--aca-teal)] hover:bg-[var(--aca-teal)] hover:text-white'} ${!parent.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {sendingEmailFor === parent.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span className="hidden sm:inline">Sending...</span>
                            </>
                          ) : emailSuccess === parent.id ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Sent!</span>
                            </>
                          ) : (
                            <>
                              <Mail className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Email Balance</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => router.push(`/admin/add-payment?parent=${parent.id}`)}
                          disabled={!parent.isActive}
                          className={`bg-[var(--aca-teal-subtle)] text-[var(--aca-teal)] hover:bg-[var(--aca-teal)] hover:text-white ${!parent.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Add Payment</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {parents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4 text-gray-400">
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center">
                          <Users className="h-12 w-12 opacity-30" />
                        </div>
                        {search ? (
                          <>
                            <p className="font-semibold text-gray-600">No parents match &ldquo;{search}&rdquo;</p>
                            <p className="text-sm">Try a different search term</p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-gray-600">No parents yet</p>
                            <p className="text-sm">Add your first parent to get started</p>
                            <Button asChild size="sm">
                              <Link href="/admin/parents/new">Add Parent</Link>
                            </Button>
                          </>
                        )}
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
                {totalCount} {totalCount === 1 ? 'parent' : 'parents'}
              </span>
              {parents.length > 0 && (
                <button
                  className="text-xs font-semibold text-[var(--aca-teal)]"
                  onClick={toggleSelectAll}
                >
                  {selectedParents.size === parents.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </CardHeader>
            {parents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-3.5">
                <Users className="h-10 w-10 opacity-50" />
                <p className="text-sm font-medium">
                  {search ? `No parents match "${search}"` : 'No parents yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {parents.map((parent) => (
                  <div
                    key={parent.id}
                    className={`flex items-center gap-3.5 px-4 py-3.5 ${
                      !parent.isActive ? 'opacity-70 bg-gray-50' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedParents.has(parent.id)}
                      onCheckedChange={() => toggleParentSelection(parent.id)}
                      className="shrink-0"
                    />
                    <Link
                      href={`/admin/parents/${parent.id}`}
                      className="flex items-center gap-3.5 flex-1 min-w-0"
                    >
                      <div className={`w-[46px] h-[46px] rounded-[13px] flex items-center justify-center text-white font-bold text-[17px] shrink-0 shadow-md ${
                        parent.isActive
                          ? 'bg-gradient-to-br from-[var(--aca-teal)] to-[var(--aca-teal-dark)]'
                          : 'bg-gradient-to-br from-gray-400 to-gray-500'
                      }`}>
                        {parent.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-700 text-[15px] flex items-center gap-1.5">
                          {parent.name}
                          {!parent.isActive && (
                            <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-gray-400 mt-1.5">
                          <span className="px-2 py-0.5 rounded-lg font-bold text-[10px] bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800">
                            {parent.students.filter(s => s.isActive).length}
                          </span>
                          <span className="truncate text-[12px]">{parent.email}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
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
