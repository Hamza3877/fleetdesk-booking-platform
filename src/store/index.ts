import { configureStore } from "@reduxjs/toolkit";
import bookingDraft from "@/store/bookingDraftSlice";

/** A new store per browser tab. It is created in <Providers> (src/components/providers). */
export const makeStore = () => configureStore({ reducer: { bookingDraft } });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
