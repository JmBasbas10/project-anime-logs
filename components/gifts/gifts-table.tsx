import type { GiftLog } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

interface Props {
  gifts: GiftLog[]
}

export function GiftsTable({ gifts }: Props) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gifts.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                No gift logs found
              </TableCell>
            </TableRow>
          )}
          {gifts.map((gift) => (
            <TableRow key={gift.id}>
              <TableCell className="font-medium">{gift.player_name}</TableCell>
              <TableCell>
                <Badge variant="outline">{gift.gift_item}</Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {gift.gift_value.toLocaleString()}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(gift.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
