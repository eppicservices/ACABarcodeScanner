"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import type { StudentWithParent } from "@/actions/students"

export const columns: ColumnDef<StudentWithParent>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student" />
    ),
    cell: ({ row }) => {
      const student = row.original
      return (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-white font-semibold text-sm ${
              student.isActive
                ? "bg-gradient-to-br from-[var(--aca-teal)] to-[var(--aca-teal-dark)]"
                : "bg-gradient-to-br from-gray-400 to-gray-500"
            }`}
          >
            {student.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-gray-700">{student.name}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const name = row.getValue(id) as string
      const parent = row.original.parent.name
      const barcode = row.original.barcode
      const search = value.toLowerCase()
      return (
        name.toLowerCase().includes(search) ||
        parent.toLowerCase().includes(search) ||
        barcode.toLowerCase().includes(search)
      )
    },
  },
  {
    accessorKey: "barcode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Barcode" />
    ),
    cell: ({ row }) => (
      <code className="bg-gray-100 px-2.5 py-1 rounded text-xs text-[var(--aca-teal)] font-mono tracking-wide">
        {row.getValue("barcode")}
      </code>
    ),
  },
  {
    accessorKey: "schoolLevel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Level" />
    ),
    cell: ({ row }) => {
      const level = row.getValue("schoolLevel") as string
      return (
        <Badge
          className={
            level === "elementary"
              ? "bg-blue-100 text-blue-800 border-blue-200"
              : "bg-[var(--aca-gold-subtle)] text-[var(--aca-gold-dark)] border-[var(--aca-gold)]"
          }
        >
          {level === "elementary" ? "Elementary" : "High School"}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "parent",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parent" />
    ),
    cell: ({ row }) => {
      const parent = row.original.parent
      return <span className="text-gray-500">{parent.name}</span>
    },
    accessorFn: (row) => row.parent.name,
  },
  {
    accessorKey: "balance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Balance" />
    ),
    cell: ({ row }) => {
      const student = row.original
      if (student.studentType !== "regular") {
        return (
          <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white border-amber-400 font-bold">
            UNLIMITED
          </Badge>
        )
      }
      const balance = row.getValue("balance") as number
      return (
        <span
          className={`font-mono font-bold text-[15px] ${
            balance <= 0
              ? "text-[var(--error)]"
              : balance < 10
              ? "text-[var(--error)]"
              : "text-[var(--success)]"
          }`}
        >
          {balance}
        </span>
      )
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean
      return (
        <Badge variant={isActive ? "success" : "muted"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(String(row.getValue(id)))
    },
  },
]
