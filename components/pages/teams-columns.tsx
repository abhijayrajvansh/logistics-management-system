import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../ui/badge';

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export const columns: ColumnDef<User>[] = [
  {
    id: 'serialNumber',
    header: 'No.',
    cell: ({ row }) => <span className="pl-4">{row.index + 1}</span>,
  },
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.id}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'roles',
    header: 'Roles',
    cell: ({ row }) => {
      const roles = row.original.roles;
      return (
        <div className="flex gap-1">
          {roles.map((role) => (
            <Badge key={role} variant="secondary">
              {role}
            </Badge>
          ))}
        </div>
      );
    },
  },
];
