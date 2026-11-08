import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CustomerInput } from "@/lib/schemas";
import type { DateRange } from "@/types";


export type BookingStep = 1 | 2 | 3;

export interface BookingDraftState {
  vehicleId: string | null;
  dates: DateRange;
  customer: CustomerInput;
  step: BookingStep;
}

export const emptyCustomer: CustomerInput = { customerName: "", customerEmail: "", customerPhone: "" };

const initialState: BookingDraftState = {
  vehicleId: null,
  dates: { startDate: "", endDate: "" },
  customer: emptyCustomer,
  step: 1,
};

const bookingDraftSlice = createSlice({
  name: "bookingDraft",
  initialState,
  reducers: {
    startDraft(state, action: PayloadAction<{ vehicleId: string; startDate?: string; endDate?: string }>) {
      const { vehicleId, startDate, endDate } = action.payload;
      const urlDates = startDate && endDate ? { startDate, endDate } : undefined;

      if (state.vehicleId !== vehicleId) {
        return { ...initialState, vehicleId, dates: urlDates ?? initialState.dates };
      }
      if (urlDates) state.dates = urlDates;
    },
    saveDates(state, action: PayloadAction<DateRange>) {
      state.dates = action.payload;
      state.step = 2;
    },
    saveCustomer(state, action: PayloadAction<CustomerInput>) {
      state.customer = action.payload;
      state.step = 3;
    },
    goToStep(state, action: PayloadAction<BookingStep>) {
      state.step = action.payload;
    },
    resetDraft: () => initialState,
  },
});

export const { startDraft, saveDates, saveCustomer, goToStep, resetDraft } = bookingDraftSlice.actions;
export default bookingDraftSlice.reducer;
