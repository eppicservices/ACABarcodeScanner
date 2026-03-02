"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import {
  Users,
  Plus,
  GraduationCap,
  AlertTriangle,
  DollarSign,
  UserPlus,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import {
  getStudentsWithParents,
  getStudentStats,
  updateStudentsStatus,
  type StudentWithParent,
} from "@/actions/students"

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentWithParent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudents, setSelectedStudents] = useState<StudentWithParent[]>([])
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const router = useRouter()

  const [stats, setStats] = useState({
    activeCount: 0,
    inactiveCount: 0,
    lowBalanceCount: 0,
    elementaryCount: 0,
    highSchoolCount: 0,
    unlimitedCount: 0,
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [studentsData, statsData] = await Promise.all([
      getStudentsWithParents(),
      getStudentStats(),
    ])
    setStudents(studentsData)
    setStats(statsData)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRowClick = (student: StudentWithParent) => {
    router.push(`/admin/students/${student.id}`)
  }

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedStudents.length === 0) return
    setBulkUpdating(true)
    try {
      await updateStudentsStatus(
        selectedStudents.map((s) => s.id),
        isActive
      )
      await fetchData()
      setSelectedStudents([])
    } catch (err) {
      console.error("Bulk status update failed:", err)
    } finally {
      setBulkUpdating(false)
    }
  }

  const {
    activeCount,
    inactiveCount,
    lowBalanceCount,
    elementaryCount,
    highSchoolCount,
    unlimitedCount,
  } = stats

  return (
    <div className="w-full max-w-[1200px]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-7">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--aca-teal-subtle)] to-white border border-gray-100 rounded-[14px] flex items-center justify-center text-[var(--aca-teal)] shadow-sm">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--aca-navy)] tracking-tight">
              Students
            </h1>
            <p className="text-sm text-gray-400 hidden sm:block">
              Manage student accounts and lunch balances
            </p>
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
      </div>

      {/* Mobile Stats Pills */}
      <div className="flex sm:hidden flex-wrap gap-2 mb-4 justify-center">
        <Badge variant="muted">{activeCount} Active</Badge>
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          {elementaryCount} Elem
        </Badge>
        <Badge variant="default">{highSchoolCount} HS</Badge>
        {unlimitedCount > 0 && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            {unlimitedCount} Unlimited
          </Badge>
        )}
        {lowBalanceCount > 0 && (
          <Badge variant="warning">{lowBalanceCount} Low</Badge>
        )}
        {inactiveCount > 0 && <Badge variant="muted">{inactiveCount} Inactive</Badge>}
      </div>

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

      {/* Bulk Actions Bar */}
      {selectedStudents.length > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--aca-teal-subtle)] border border-[var(--aca-teal)] rounded-lg">
          <span className="text-sm font-semibold text-[var(--aca-teal)]">
            {selectedStudents.length} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              disabled={bulkUpdating}
              onClick={() => handleBulkStatusUpdate(true)}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              {bulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Set Active
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkUpdating}
              onClick={() => handleBulkStatusUpdate(false)}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              {bulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Set Inactive
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <Card className="py-0 overflow-hidden">
        <CardHeader className="py-3.5 px-5 border-b bg-gray-50">
          <span className="text-sm text-gray-500 font-medium">
            {students.length} {students.length === 1 ? "student" : "students"} total
          </span>
        </CardHeader>
        <CardContent className="p-4">
          <DataTable
            columns={columns}
            data={students}
            searchKey="name"
            searchPlaceholder="Search by name, barcode, or parent..."
            filterableColumns={[
              {
                id: "schoolLevel",
                title: "Level",
                options: [
                  { label: "Elementary", value: "elementary" },
                  { label: "High School", value: "high_school" },
                ],
              },
              {
                id: "isActive",
                title: "Status",
                options: [
                  { label: "Active", value: "true" },
                  { label: "Inactive", value: "false" },
                ],
              },
            ]}
            isLoading={loading}
            onRowClick={handleRowClick}
            onSelectionChange={setSelectedStudents}
            pageSize={25}
          />
        </CardContent>
      </Card>
    </div>
  )
}
