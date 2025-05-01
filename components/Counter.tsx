'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  increment,
  decrement,
  incrementByAmount,
  reset,
  release,
  selectCount,
  selectStatus,
  selectAvailablity
} from '@/store/slices/counter.slice';
import { Button } from '@/components/ui/button';

export default function Counter() {
  const count = useAppSelector(selectCount);
  const status = useAppSelector(selectStatus);
  const availablity = useAppSelector(selectAvailablity);
  const dispatch = useAppDispatch();

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Counter: {count}</h2>
        <p className="text-sm text-gray-600">Status: {status}</p>
      </div>

      <div className="flex gap-2 justify-center">
        <Button onClick={() => dispatch(reset())} variant="destructive">
          Reset
        </Button>

        {availablity && <>
          <Button onClick={() => dispatch(decrement())} variant="outline">
            Decrease
          </Button>

          <Button onClick={() => dispatch(increment())} variant="default">
            Increase
          </Button>

          <Button onClick={() => dispatch(incrementByAmount(5))} variant="secondary">
            Add 5
          </Button>
        </>}

        <Button className="bg-green-500 hover:bg-green-600" onClick={() => dispatch(release())}>
          Release
        </Button>
      </div>
    </div>
  );
}
