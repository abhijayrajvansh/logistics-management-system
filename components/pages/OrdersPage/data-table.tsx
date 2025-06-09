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
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { CreateOrderForm } from './create-order';
import { FaDownload } from 'react-icons/fa';
import { redirect } from 'next/navigation';
import { PermissionGate } from '@/components/PermissionGate';

export function DataTable<TData, TValue>({
  columns,
  data: initialData,
  inTransitData = [],
  transferredData = [],
  deliveredData = [],
  upcomingTransfersData = [],
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  inTransitData?: TData[];
  transferredData?: TData[];
  deliveredData?: TData[];
  upcomingTransfersData?: TData[];
}) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});

  // Update data when initialData changes
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Create table instances for each status
  const readyAndAssignedTable = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const inTransitTable = useReactTable({
    data: inTransitData,
    columns: columns.filter((col) => col.id !== 'select'), // Remove select column
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const transferredTable = useReactTable({
    data: transferredData,
    columns: columns.filter((col) => col.id !== 'select'), // Remove select column
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const deliveredTable = useReactTable({
    data: deliveredData,
    columns: columns.filter((col) => col.id !== 'select'), // Remove select column
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Add table instance for upcoming transfers
  const upcomingTransfersTable = useReactTable({
    data: upcomingTransfersData,
    columns: columns.filter((col) => col.id !== 'select'), // Remove select column
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleOrderSuccess = () => {
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
            className="hidden size-8 lg:flex"
            size="icon"
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
          <h1 className="text-3xl font-semibold">Manage Orders</h1>
          <p className="text-[14px] text-black/70 mt-1">
            Create, view and manage your orders at ease.
          </p>
        </div>

        <PermissionGate feature="FEATURE_ORDERS_CREATE">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="rounded-lg">
                <PlusIcon />
                <span className="hidden font-semibold lg:inline">Create Order</span>
              </Button>
            </DialogTrigger>
            <DialogContent onOpenAutoFocus={e => e.preventDefault()} className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Fill out the form below to create a new order. Click submit when you're done.
                </DialogDescription>
              </DialogHeader>
              <CreateOrderForm onSuccess={handleOrderSuccess} />
            </DialogContent>
          </Dialog>
        </PermissionGate>
      </div>

      {/* Ready to Transport & Assigned Orders Section */}
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Ready to Transport & Assigned Orders</h2>

          <Button
            disabled={Object.keys(readyAndAssignedTable.getState().rowSelection).length <= 0}
            className="bg-green-500 hover:bg-green-500/80 font-semibold"
            // todo: create as a separate function and pass it to the onClick
            onClick={() => {
              const selectedRows = readyAndAssignedTable.getFilteredSelectedRowModel().rows;
              // const selectedOrderIds = selectedRows.map((row) => (row.original as any).docket_id);
              const selectedOrderIds = selectedRows.map((row) => (row.original as any).id);
              const url = `/dashboard/orders/print?orderIds=${selectedOrderIds.join(',')}`;
              redirect(url);
            }}
          >
            <FaDownload className="mr-2" />
            Download ({Object.keys(readyAndAssignedTable.getState().rowSelection).length})
          </Button>
        </div>
        {renderTable(readyAndAssignedTable)}
        {renderPagination(readyAndAssignedTable)}
      </div>

      {/* Upcoming Transfers Section*/}
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <h2 className="text-xl font-semibold">Upcoming Transfers</h2>
        <p className="text-sm text-gray-500 -mt-2">Orders being transferred to your center</p>
        {renderTable(upcomingTransfersTable)}
        {renderPagination(upcomingTransfersTable)}
      </div>

      {/* In Transit Orders Section */}
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <h2 className="text-xl font-semibold">In Transit Orders</h2>
        {renderTable(inTransitTable)}
        {renderPagination(inTransitTable)}
      </div>

      {/* Transferred Orders Section */}
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <h2 className="text-xl font-semibold">Transferred Orders</h2>
        {renderTable(transferredTable)}
        {renderPagination(transferredTable)}
      </div>

      {/* Delivered Orders Section */}
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <h2 className="text-xl font-semibold">Delivered Orders</h2>
        {renderTable(deliveredTable)}
        {renderPagination(deliveredTable)}
      </div>
    </div>
  );
}
