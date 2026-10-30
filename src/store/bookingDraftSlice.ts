import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CustomerInput } from "@/lib/schemas";
import type { DateRange } from "@/types";

/**
 * The booking in progress. The customer moves through three steps (dates, details,
 * review and pay) and what they typed must survive going back and forth, so it lives in Redux.
 *
 * Rule of thumb used in this project:
 *   - Redux Toolkit  -> things only the browser knows (this draft, the current step)
 *   - TanStack Query -> things that come from the server (bookings, vehicles, analytics)
 */

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
    /**
     * Start a draft for a vehicle. Opening the same vehicle again keeps what was typed;
     * opening a different vehicle starts clean. Dates from the URL (the listing filter) pre-fill step 1.
     */
    startDraft(state, action: PayloadAction<{ vehicleId: string; startDate?: string; endDate?: string }>) {
      const { vehicleId, startDate, endDate } = action.payload;
      const urlDates = startDate && endDate ? { startDate, endDate } : undefined;

      // A different vehicle: start clean, but keep the dates the customer just picked.
      if (state.vehicleId !== vehicleId) {
        return { ...initialState, vehicleId, dates: urlDates ?? initialState.dates };
      }
      // The same vehicle: keep what was typed. Dates in the link are the newest choice, so they win.
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
