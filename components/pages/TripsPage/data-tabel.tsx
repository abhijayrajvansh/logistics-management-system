'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  PlusIcon,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateTripForm } from './create-trip';
import { PermissionGate } from '@/components/PermissionGate';

export function DataTable<TData, TValue>({
  columns,
  data: initialData,
  activeTripData = [],
  pastTripData = [],
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  activeTripData?: TData[];
  pastTripData?: TData[];
}) {
  const [data, setData] = React.useState(() => initialData);

  // Update data when initialData changes
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Create separate column sets for each table type
  const unassignedColumns = columns.filter(
    (col) => !('accessorKey' in col && col.accessorKey === 'currentStatus'),
  );

  const activeColumns = columns.filter((col) => !(col.id === 'actions'));

  const pastColumns = columns.filter(
    (col) => !('accessorKey' in col && col.accessorKey === 'currentStatus'),
  );

  // Update table definitions with specific columns
  const table = useReactTable({
    data,
    columns: unassignedColumns, // Use filtered columns for unassigned trips
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row: any) => row.id?.toString() || '',
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Create separate tables for active and past trips
  const activeTripsTable = useReactTable({
    data: activeTripData,
    columns: activeColumns, // Use all columns including currentStatus
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const pastTripsTable = useReactTable({
    data: pastTripData,
    columns: pastColumns, // Use filtered columns for past trips
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleTripSuccess = () => {
    setDialogOpen(false);
  };

  const renderTable = (tableInstance: any) => (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          {tableInstance.getHeaderGroups().map((headerGroup: any) => (
            <TableRow key={headerGroup.id} className="text-[13px]">
              {headerGroup.headers.map((header: any) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="**:data-[slot=table-cell]:first:w-8 text-[12px]">
          {tableInstance.getRowModel().rows?.length ? (
            tableInstance.getRowModel().rows.map((row: any) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell: any) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderPagination = (tableInstance: any) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex w-full items-center justify-end gap-8">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${tableInstance.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              tableInstance.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-20" id="rows-per-page">
              <SelectValue placeholder={tableInstance.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-sm font-medium">
          Page {tableInstance.getState().pagination.pageIndex + 1} of {tableInstance.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => tableInstance.setPageIndex(0)}
            disabled={!tableInstance.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => tableInstance.previousPage()}
            disabled={!tableInstance.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => tableInstance.nextPage()}
            disabled={!tableInstance.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => tableInstance.setPageIndex(tableInstance.getPageCount() - 1)}
            disabled={!tableInstance.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-semibold">Manage Trips</h1>
          <p className="text-[14px] text-black/70 mt-1">
            Create, view and manage your trips at ease.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <PermissionGate feature="FEATURE_TRIPS_CREATE">
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="rounded-lg">
                <PlusIcon />
                <span className="hidden font-semibold lg:inline">Create Trip</span>
              </Button>
            </DialogTrigger>
          </PermissionGate>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
              <DialogDescription>
                Fill out the form below to create a new trip. Click submit when you're done.
              </DialogDescription>
            </DialogHeader>
            <CreateTripForm onSuccess={handleTripSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Ready to Ship Trips Section */}
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <h2 className="text-xl font-semibold">Ready to Ship Trips</h2>
        {renderTable(table)}
        {renderPagination(table)}
      </div>

      {/* Active Trips Section */}
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <h2 className="text-xl font-semibold">Active Trips</h2>
        {renderTable(activeTripsTable)}
        {renderPagination(activeTripsTable)}
      </div>

      {/* Past Trips Section */}
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <h2 className="text-xl font-semibold">Past Trips</h2>
        {renderTable(pastTripsTable)}
        {renderPagination(pastTripsTable)}
      </div>
    </div>
  );
}
