import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold uppercase tracking-wide transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Primary: Gold (ACA brand)
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-[var(--aca-gold-dark)] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
        // Secondary: Navy (ACA brand)
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-[var(--aca-navy-light)] hover:-translate-y-0.5 hover:shadow-md",
        // Destructive: Red
        destructive: "bg-destructive text-white shadow-sm hover:bg-[var(--error-light)] hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-destructive/20",
        // Outline: Teal border
        outline: "border-2 border-[var(--aca-teal)] text-[var(--aca-teal)] bg-transparent hover:bg-[var(--aca-teal)] hover:text-white",
        // Success: Green
        success: "bg-[var(--success)] text-white shadow-sm hover:bg-[var(--success-light)] hover:-translate-y-0.5 hover:shadow-md",
        // Ghost: Subtle
        ghost: "text-muted-foreground hover:bg-muted hover:text-[var(--aca-navy)] normal-case font-semibold",
        // Link style
        link: "text-[var(--aca-teal)] underline-offset-4 hover:underline normal-case font-semibold",
      },
      size: {
        default: "h-10 px-6 py-2 has-[>svg]:px-4",
        xs: "h-7 gap-1 rounded-md px-3 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-4 text-xs has-[>svg]:px-3",
        lg: "h-12 rounded-md px-8 text-base has-[>svg]:px-6",
        icon: "size-10",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
