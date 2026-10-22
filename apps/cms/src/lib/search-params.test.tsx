// @vitest-environment happy-dom

import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { usePostPageFilters } from "./search-params";

function Filters() {
  const [{ page, status }, setFilters] = usePostPageFilters();
  return (
    <>
      <output>{status}</output>
      <span>{page}</span>
      <button
        onClick={() => setFilters({ status: "scheduled", page: 1 })}
        type="button"
      >
        Scheduled
      </button>
      <button
        onClick={() => setFilters({ status: "all", page: 1 })}
        type="button"
      >
        All statuses
      </button>
    </>
  );
}

const host = document.createElement("div");
let root: Root;

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());

beforeEach(() => {
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
});

describe("post status URL filters", () => {
  it("restores the scheduled filter and page from a shared URL", () => {
    act(() => {
      root.render(
        <NuqsTestingAdapter searchParams="?status=scheduled&page=2">
          <Filters />
        </NuqsTestingAdapter>
      );
    });
    expect(host.querySelector("output")?.textContent).toBe("scheduled");
    expect(host.querySelector("span")?.textContent).toBe("2");
  });

  it("persists scheduled selection and clears it on reset", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    act(() => {
      root.render(
        <NuqsTestingAdapter
          hasMemory
          onUrlUpdate={onUrlUpdate}
          searchParams="?page=3&search=launch"
        >
          <Filters />
        </NuqsTestingAdapter>
      );
    });
    await act(async () => {
      host.querySelector("button")?.click();
      await vi.waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
    });
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryString: "?search=launch&status=scheduled",
      })
    );
    expect(host.querySelector("output")?.textContent).toBe("scheduled");
    await act(async () => {
      host.querySelectorAll("button")[1]?.click();
      await vi.waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(2));
    });
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: "?search=launch" })
    );
    expect(host.querySelector("output")?.textContent).toBe("all");
  });
});
