import { Fragment, type ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  mobileLabel?: string;
}

export function AdminTable<T extends { id: string }>({
  columns,
  rows,
  mobileCard,
}: {
  columns: AdminTableColumn<T>[];
  rows: T[];
  mobileCard?: (row: T) => ReactNode;
}) {
  return (
    <>
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="grid gap-3 md:hidden">
        {rows.map((row) =>
          mobileCard ? (
            <Fragment key={row.id}>{mobileCard(row)}</Fragment>
          ) : (
            <Card key={row.id}>
              <CardContent className="space-y-2 p-4">
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">{col.mobileLabel ?? col.header}</span>
                    <span className={cn('text-right', col.className)}>{col.cell(row)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </>
  );
}
