import { TableBody, TableRow, TableCell } from '@/components/ui/table'

export function TableSkeleton({ rows = 8, cols }: { rows?: number; cols: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}>
              <div className="h-4 rounded shimmer" style={{ width: `${60 + ((i * j + j) % 4) * 10}%` }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}
