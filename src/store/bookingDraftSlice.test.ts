import { describe, expect, it } from "vitest";
import { makeStore } from "@/store";
import { goToStep, resetDraft, saveCustomer, saveDates, startDraft } from "@/store/bookingDraftSlice";

const dates = { startDate: "2030-01-10", endDate: "2030-01-13" };
const customer = { customerName: "Hamza Ali", customerEmail: "h@example.com", customerPhone: "+92 300 1234567" };

describe("bookingDraft", () => {
  it("moves through the steps as data is saved", () => {
    const store = makeStore();
    store.dispatch(startDraft({ vehicleId: "veh_1" }));
    expect(store.getState().bookingDraft.step).toBe(1);

    store.dispatch(saveDates(dates));
    expect(store.getState().bookingDraft.step).toBe(2);

    store.dispatch(saveCustomer(customer));
    expect(store.getState().bookingDraft.step).toBe(3);

    store.dispatch(goToStep(1));
    expect(store.getState().bookingDraft.step).toBe(1);
    // Going back keeps what was already typed.
    expect(store.getState().bookingDraft.customer).toEqual(customer);
  });

  it("keeps the draft when the same vehicle is opened again", () => {
    const store = makeStore();
    store.dispatch(startDraft({ vehicleId: "veh_1" }));
    store.dispatch(saveDates(dates));
    store.dispatch(startDraft({ vehicleId: "veh_1" }));

    expect(store.getState().bookingDraft.dates).toEqual(dates);
  });

  it("pre-fills the dates picked on the vehicle page when a draft starts", () => {
    const store = makeStore();
    store.dispatch(startDraft({ vehicleId: "veh_1", ...dates }));
    expect(store.getState().bookingDraft.dates).toEqual(dates);
    expect(store.getState().bookingDraft.step).toBe(1);
  });

  it("uses newly picked dates when the same vehicle is opened again with them", () => {
    const store = makeStore();
    store.dispatch(startDraft({ vehicleId: "veh_1", ...dates }));
    const later = { startDate: "2030-02-01", endDate: "2030-02-05" };
    store.dispatch(startDraft({ vehicleId: "veh_1", ...later }));
    expect(store.getState().bookingDraft.dates).toEqual(later);
  });

  it("clears the draft when a different vehicle is opened", () => {
    const store = makeStore();
    store.dispatch(startDraft({ vehicleId: "veh_1" }));
    store.dispatch(saveCustomer(customer));
    store.dispatch(startDraft({ vehicleId: "veh_2" }));

    expect(store.getState().bookingDraft.customer.customerName).toBe("");
    expect(store.getState().bookingDraft.vehicleId).toBe("veh_2");
  });

  it("resets everything", () => {
    const store = makeStore();
    store.dispatch(startDraft({ vehicleId: "veh_1" }));
    store.dispatch(resetDraft());
    expect(store.getState().bookingDraft.vehicleId).toBeNull();
  });
});
