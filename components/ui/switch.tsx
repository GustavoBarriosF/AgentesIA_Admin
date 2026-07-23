"use client"

import { cn } from "@/lib/utils"
import { type ButtonHTMLAttributes } from "react"

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  size?: "sm" | "default"
}

function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  size = "default",
  onClick,
  ...props
}: SwitchProps) {
  const isOn = checked ?? false

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e)
        if (!disabled) onCheckedChange?.(!isOn)
      }}
      data-slot="switch"
      data-size={size}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        size === "default" ? "h-[18.4px] w-[32px]" : "h-[14px] w-[24px]",
        isOn ? "bg-primary" : "bg-input dark:bg-input/80",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-sm transition-transform",
          size === "default" ? "size-4" : "size-3",
          isOn ? "translate-x-[calc(100%-2px)]" : "translate-x-0"
        )}
      />
    </button>
  )
}

export { Switch }
