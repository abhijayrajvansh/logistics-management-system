import { User, ReferredBy } from '@/types';
import useUsers from '@/hooks/useUsers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ReferralBySelectorProps {
  value: ReferredBy | 'NA';
  onChange: (value: ReferredBy | 'NA') => void;
}

export function ReferralBySelector({ value, onChange }: ReferralBySelectorProps) {
  const { users, isLoading } = useUsers();
  const referralType = value !== 'NA' ? value.type : 'self';

  const handleTypeChange = (type: User['role'] | 'self') => {
    if (type === 'self') {
      onChange('NA');
    } else {
      onChange({
        type,
        userId: '',
      });
    }
  };

  const handleUserChange = (userId: string) => {
    if (value !== 'NA') {
      onChange({
        ...value,
        userId,
      });
    }
  };

  const filteredUsers = users.filter((user) => value !== 'NA' && user.role === value.type);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="referral_type">Referred By</Label>
        <Select
          value={referralType}
          onValueChange={(value: User['role'] | 'self') => handleTypeChange(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select referral type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="self">Self</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="driver">Driver</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value !== 'NA' && (
        <div className="space-y-2">
          <Label htmlFor="referrer_id">Select Referrer</Label>
          <Select disabled={isLoading} value={value.userId} onValueChange={handleUserChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoading ? 'Loading users...' : 'Select user'} />
            </SelectTrigger>
            <SelectContent>
              {filteredUsers.map((user) => (
                <SelectItem key={user.userId} value={user.userId}>
                  {user.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
