import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&_tr:last-child]:border-0 [&_tr:nth-child(odd)]:bg-slate-50/40 dark:[&_tr:nth-child(odd)]:bg-slate-900/10 [&_tr_td:nth-child(1)]:text-sky-700 dark:[&_tr_td:nth-child(1)]:text-sky-300 [&_tr_td:nth-child(2)]:text-violet-700 dark:[&_tr_td:nth-child(2)]:text-violet-300 [&_tr_td:nth-child(3)]:text-cyan-700 dark:[&_tr_td:nth-child(3)]:text-cyan-300 [&_tr_td:nth-child(4)]:text-emerald-700 dark:[&_tr_td:nth-child(4)]:text-emerald-300 [&_tr_td:nth-child(5)]:text-amber-700 dark:[&_tr_td:nth-child(5)]:text-amber-300 [&_tr_td:nth-child(6)]:text-rose-700 dark:[&_tr_td:nth-child(6)]:text-rose-300",
        className
      )}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "min-h-10 px-3 py-2.5 text-center align-middle text-xs font-medium leading-snug text-muted-foreground whitespace-normal [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "min-h-10 px-3 py-2.5 text-center align-middle text-sm leading-snug whitespace-normal [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow }
