'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Pagination from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
  Receipt,
  Search,
  X,
  ChevronRight,
  Plus,
  Minus,
  ArrowUpDown,
} from 'lucide-react'
import {
  getTransactions,
  getTransactionCount,
  getTransactionStats,
  type TransactionWithStudent,
} from '@/actions/transactions'
import type { TransactionType } from '@prisma/client'

type SortField = 'date' | 'amount' | 'student'
type SortDirection = 'asc' | 'desc'
type FilterType = 'all' | 'payment' | 'lunch_card' | 'adjustment' | 'lunch_used'

const ITEMS_PER_PAGE = 25

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

  const isInitialMount = useRef(true)

  const [stats, setStats] = useState({
    totalLunchesAdded: 0,
    totalLunchesUsed: 0,
    paymentCount: 0,
    adjustmentCount: 0,
    usedCount: 0,
  })

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await getTransactionStats()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [])

  const fetchTransactions = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }
    try {
      const filters = {
        transactionType: filter as TransactionType | 'all',
        search: debouncedSearch || undefined,
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
  }, [filter, debouncedSearch, sortField, sortDirection, currentPage])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchTransactions(isInitialMount.current)
    isInitialMount.current = false
  }, [fetchTransactions])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [filter, sortField, sortDirection, debouncedSearch])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (value: string) => {
    const [field, dir] = value.split('-') as [SortField, SortDirection]
    setSortField(field)
    setSortDirection(dir)
  }

  const { totalLunchesAdded, totalLunchesUsed, paymentCount, adjustmentCount } = stats

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
      <div className="max-w-[1200px]">
        {/* Page Header Skeleton */}
        <div className="mb-7 flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-[14px]" />
          <div>
            <Skeleton className="h-7 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>

        {/* Stats Pills Skeleton */}
        <div className="hidden sm:flex flex-wrap gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card className="mb-5">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 w-full sm:w-[300px]" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-full sm:w-[180px]" />
            </div>
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <Card className="hidden md:block">
          <div className="p-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 p-4 border-b border-gray-100">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </Card>

        {/* Mobile List Skeleton */}
        <Card className="md:hidden">
          <CardContent className="p-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 p-4 border-b border-gray-100">
                <Skeleton className="h-11 w-1 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px]">
      {/* Page Header */}
      <div className="mb-7">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--aca-teal-subtle)] to-white border border-gray-100 rounded-[14px] flex items-center justify-center text-[var(--aca-teal)] shadow-sm">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-[26px] font-semibold text-[var(--aca-navy)] tracking-tight m-0">
              Transactions
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Balance history and payment records
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Stats Pills */}
      <div className="hidden sm:flex flex-wrap gap-2 mb-6 items-center">
        <Badge variant="success" className="px-3 py-1.5 text-[13px] font-semibold rounded-full">
          {totalLunchesAdded} Added
        </Badge>
        <Badge variant="destructive" className="px-3 py-1.5 text-[13px] font-semibold rounded-full">
          {totalLunchesUsed} Used
        </Badge>
        <Badge className="px-3 py-1.5 text-[13px] font-semibold rounded-full bg-blue-100 text-blue-800 border-blue-200">
          {paymentCount} Payments
        </Badge>
        {adjustmentCount > 0 && (
          <Badge variant="teal" className="px-3 py-1.5 text-[13px] font-semibold rounded-full">
            {adjustmentCount} Adjustments
          </Badge>
        )}
      </div>

      {/* Mobile Stats Pills */}
      <div className="flex sm:hidden flex-wrap gap-2 mb-4 justify-center">
        <Badge variant="success" className="px-2.5 py-1 text-xs font-semibold rounded-full">
          {totalLunchesAdded} Added
        </Badge>
        <Badge variant="destructive" className="px-2.5 py-1 text-xs font-semibold rounded-full">
          {totalLunchesUsed} Used
        </Badge>
        <Badge className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border-blue-200">
          {paymentCount} Payments
        </Badge>
        {adjustmentCount > 0 && (
          <Badge variant="teal" className="px-2.5 py-1 text-xs font-semibold rounded-full">
            {adjustmentCount} Adjustments
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-5">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-full sm:max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search students or parents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-1.5 bg-gray-50 p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
            {(['all', 'payment', 'lunch_card', 'lunch_used', 'adjustment'] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 text-xs sm:text-[13px] px-3 sm:px-4 ${
                  filter === f
                    ? 'bg-white text-[var(--aca-teal)] shadow-sm hover:bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white'
                }`}
              >
                {f === 'all' ? 'All' : f === 'payment' ? 'Payments' : f === 'lunch_card' ? 'Lunch Cards' : f === 'lunch_used' ? 'Used' : 'Adjustments'}
              </Button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <span className="text-[13px] font-semibold text-gray-400 whitespace-nowrap flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort:
            </span>
            <Select value={`${sortField}-${sortDirection}`} onValueChange={handleSortChange}>
              <SelectTrigger className="flex-1 sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                <SelectItem value="amount-desc">Amount (High-Low)</SelectItem>
                <SelectItem value="amount-asc">Amount (Low-High)</SelectItem>
                <SelectItem value="student-asc">Student (A-Z)</SelectItem>
                <SelectItem value="student-desc">Student (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <Card className="hidden md:block overflow-hidden mb-5">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-gray-400">Date</TableHead>
              <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-gray-400">Student</TableHead>
              <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-gray-400">Type</TableHead>
              <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-gray-400">Lunches</TableHead>
              <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-gray-400">Balance</TableHead>
              <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-gray-400">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Receipt className="h-10 w-10 text-gray-300" />
                    <p className="font-medium text-gray-600">No transactions found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow
                  key={tx.id}
                  onClick={() => window.location.href = `/admin/transactions/${tx.id}`}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="whitespace-nowrap">
                    <span className="block font-semibold text-gray-700">
                      {new Date(tx.createdAt!).toLocaleDateString()}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(tx.createdAt!).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/students/${tx.studentId}`}
                      className="block text-[var(--aca-teal)] font-semibold hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tx.student.name}
                    </Link>
                    <span className="block text-[11px] text-gray-400 font-mono">
                      {tx.student.barcode}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(tx.transactionType)} className="text-[11px] font-semibold">
                      {getTypeLabel(tx.transactionType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 font-mono font-bold text-sm px-2.5 py-1 rounded ${
                      tx.lunchesChange >= 0
                        ? 'text-green-600 bg-green-50'
                        : 'text-red-600 bg-red-50'
                    }`}>
                      {tx.lunchesChange >= 0 ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {Math.abs(tx.lunchesChange)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-gray-500 flex items-center gap-1.5">
                      {tx.previousLunches}
                      <span className="text-gray-300">→</span>
                      {tx.newLunches}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-400 text-[13px] max-w-[200px] truncate">
                    {tx.notes || '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile List View */}
      <Card className="md:hidden overflow-hidden mb-5">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-[13px] text-gray-500 font-medium">
            {totalCount} transactions
          </span>
        </div>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-5 text-gray-400 gap-3">
            <Receipt className="h-10 w-10" />
            <p className="text-sm">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx, index) => (
              <Link
                key={tx.id}
                href={`/admin/transactions/${tx.id}`}
                className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors"
                style={{ animationDelay: `${index * 0.02}s` }}
              >
                <div className={`w-1 h-11 rounded flex-shrink-0 mt-0.5 ${
                  tx.lunchesChange >= 0
                    ? 'bg-gradient-to-b from-green-500 to-green-300'
                    : 'bg-gradient-to-b from-red-500 to-red-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-700 text-[15px]">{tx.student.name}</span>
                    <span className={`font-mono font-bold text-base ${
                      tx.lunchesChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.lunchesChange >= 0 ? '+' : ''}{tx.lunchesChange}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Badge
                      variant={getTypeBadgeVariant(tx.transactionType)}
                      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5"
                    >
                      {getTypeLabel(tx.transactionType)}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(tx.createdAt!).toLocaleDateString()} • {new Date(tx.createdAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {tx.notes && (
                    <div className="text-xs text-gray-400 mt-1.5 pt-1.5 border-t border-dashed border-gray-200 truncate">
                      {tx.notes}
                    </div>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0 mt-3.5" />
              </Link>
            ))}
          </div>
        )}
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
  )
}
