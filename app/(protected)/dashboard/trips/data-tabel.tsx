'use client';

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove } from '@dnd-kit/sortable';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Import the CreateTripForm component
import { CreateTripForm } from './create-trip';
import { Trip } from './columns';

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
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  // Update to use data with unknown structure
  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map((item: any, index) => item.id || index) || [],
    [data],
  );

  const table = useReactTable({
    data,
    columns,
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
    columns,
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
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  const handleTripSuccess = () => {
    // Close the dialog after successful trip creation
    setDialogOpen(false);

    // Trigger a data refresh - we should implement a proper data fetching mechanism
    // This could be calling a function passed from the parent component
    // For example, if using React Query or a custom hook:
    // refetchTripData();

    // For now, let's use a simple approach to avoid the issue:
    // Add a small delay before updating state to prevent Maximum update depth error
    setTimeout(() => {
      // This timeout prevents React from entering an infinite update loop
      // In a production app, you would use a proper state management solution like
      // React Query, SWR, or Redux to handle data fetching and updates
      console.log('Trip created successfully, data should be refreshed');

      // If the parent component passed a refetch function:
      // if (refetchTrips) {
      //   refetchTrips();
      // }
    }, 0);
  };

  const renderTable = (tableInstance: any) => (
    <div className="overflow-hidden rounded-lg border">
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        id={sortableId}
      >
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
      </DndContext>
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
    <Tabs defaultValue="unassigned" className="flex w-full flex-col justify-start gap-6">
      {/* Header with tabs */}
      <div className="flex justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-semibold">Manage Trips</h1>
          <p className="text-[14px] text-black/70 mt-1">
            Create, view and manage your trips at ease.
          </p>
          <TabsList className="mt-4">
            <TabsTrigger value="unassigned">Unassigned Trips</TabsTrigger>
            <TabsTrigger value="active">Active Trips</TabsTrigger>
            <TabsTrigger value="past">Past Trips</TabsTrigger>
          </TabsList>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="rounded-lg">
              <PlusIcon />
              <span className="hidden font-semibold lg:inline">Create Trip</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
              <DialogDescription>
                Fill out the form below to create a new trip. Click submit when you're done.
              </DialogDescription>
            </DialogHeader>
            {/* Use the CreateTripForm component */}
            <CreateTripForm onSuccess={handleTripSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Unassigned Trips Table */}
      <TabsContent
        value="unassigned"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        {renderTable(table)}
        {renderPagination(table)}
      </TabsContent>

      {/* Active Trips Table */}
      <TabsContent
        value="active"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        {renderTable(activeTripsTable)}
        {renderPagination(activeTripsTable)}
      </TabsContent>

      {/* Past Trips Table */}
      <TabsContent value="past" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        {renderTable(pastTripsTable)}
        {renderPagination(pastTripsTable)}
      </TabsContent>
    </Tabs>
  );
}
