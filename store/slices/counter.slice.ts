import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CounterState {
  value: number;
  status: 'idle' | 'onloading' | 'offloading' | 'onloading on steriods' | 'trucks released';
  availablity: boolean;
}

const initialState: CounterState = {
  value: 0,
  status: 'idle',
  availablity: true,
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
      state.status = 'onloading';
    },
    decrement: (state) => {
      state.value -= 1;
      state.status = 'offloading';
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
      state.status = 'onloading on steriods';
    },
    setStatus: (state, action: PayloadAction<CounterState['status']>) => {
      state.status = action.payload;
    },
    reset: (state) => {
      state.value = 0;
      state.status = 'idle';
      state.availablity = true;
    },
    release: (state) => {
      state.status = 'trucks released';
      state.availablity = false;
    }
  },
});

export const { increment, decrement, incrementByAmount, setStatus, reset, release } = counterSlice.actions;

// Selectors
export const selectCount = (state: { counter: CounterState }) => state.counter.value;
export const selectStatus = (state: { counter: CounterState }) => state.counter.status;
export const selectAvailablity = (state: { counter: CounterState }) => state.counter.availablity;

export default counterSlice.reducer;
