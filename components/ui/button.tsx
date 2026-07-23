"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-1.5",
    "rounded-xl border border-transparent text-sm font-semibold whitespace-nowrap",
    "transition-all duration-150 outline-none select-none cursor-pointer",
    "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1",
    "active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm shadow-secondary/20 hover:bg-secondary/90",
        outline:
          "border-border bg-background text-foreground hover:bg-muted hover:border-border/80",
        ghost:
          "text-foreground hover:bg-muted",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15",
        "destructive-solid":
          "bg-destructive text-white shadow-sm hover:bg-destructive/90",
        link:
          "text-primary underline-offset-4 hover:underline px-0",
      },
      size: {
        xs:      "h-6 px-2 text-xs rounded-lg gap-1",
        sm:      "h-8 px-3 text-sm",
        default: "h-9 px-4",
        lg:      "h-10 px-5 text-base",
        icon:    "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0 rounded-lg",
        "icon-lg": "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
