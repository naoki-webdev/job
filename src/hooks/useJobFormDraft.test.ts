import { act, renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useJobFormDraft } from "./useJobFormDraft";

describe("job draft recovery", () => {
  it("recovers a user's input after reopening without exposing it to another user", () => {
    const data = new Map<string,string>();
    Object.defineProperty(window,"localStorage",{ configurable:true, value: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string,value: string) => data.set(key,value), removeItem: (key: string) => data.delete(key), clear: () => data.clear() } });
    const masters = { locations: [], positions: [], techStacks: [] };
    const { result, rerender } = renderHook(({ owner, open }) => useJobFormDraft({ ...masters, draftOwnerId: owner, open, initialJob: null }), { initialProps: { owner:1,open:true } });
    act(() => result.current.handleChange("company_name","途中の会社"));
    rerender({ owner:1, open:false }); rerender({ owner:1,open:true });
    expect(result.current.formValues.company_name).toBe("途中の会社");
    rerender({ owner:2,open:true });
    expect(result.current.formValues.company_name).toBe("");
    rerender({ owner:1,open:true });
    act(() => window.dispatchEvent(new CustomEvent("job-draft-saved",{ detail:"new" })));
    rerender({ owner:1,open:false }); rerender({ owner:1,open:true });
    expect(result.current.formValues.company_name).toBe("");
  });
});
