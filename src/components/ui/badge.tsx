import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-3 py-0.5 text-xs font-bold uppercase tracking-wide w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        // Gold: Primary badge
        default: "bg-[var(--aca-gold-subtle)] text-[var(--aca-gold-dark)] [a&]:hover:bg-[var(--aca-gold-light)]",
        // Navy: Secondary badge
        secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        // Teal: Accent badge
        teal: "bg-[var(--aca-teal-subtle)] text-[var(--aca-teal-dark)] [a&]:hover:bg-[var(--aca-teal-light)]",
        // Success: Green
        success: "bg-[var(--success-bg)] text-[#166534] border-[var(--success-border)] [a&]:hover:bg-[var(--success-light)]",
        // Warning: Orange/Yellow
        warning: "bg-[var(--warning-bg)] text-[#92400e] border-[var(--warning-border)] [a&]:hover:bg-[var(--warning-light)]",
        // Destructive: Red
        destructive: "bg-[var(--error-bg)] text-[var(--error)] border-[var(--error-border)] [a&]:hover:bg-[var(--error-light)] focus-visible:ring-destructive/20",
        // Outline: Border only
        outline: "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Muted: Gray
        muted: "bg-muted text-muted-foreground [a&]:hover:bg-muted/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
