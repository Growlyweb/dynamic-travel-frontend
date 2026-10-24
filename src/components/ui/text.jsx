// src/components/ui/text.jsx
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const text = cva("", {
    variants: {
        variant: {
            h1: "text-2xl font-semibold tracking-tight",
            h2: "text-lg font-semibold",
            body: "text-sm",
            label: "text-sm font-medium leading-none",
            muted: "text-xs text-muted-foreground",
            metric: "text-3xl font-bold tabular-nums tracking-tight",
            code: "font-mono text-xs",
        },
    },
    defaultVariants: { variant: "body" },
})

export function Text({ as: Comp = "p", variant, className, ...props }) {
    return <Comp className={cn(text({ variant }), className)} {...props} />
}