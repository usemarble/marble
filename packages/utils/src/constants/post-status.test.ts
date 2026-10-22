import { describe, expect, it } from "vitest";
import {
  POST_STATUS_POLICY,
  POST_STATUSES,
  POST_WRITE_STATUSES,
  PUBLIC_POST_STATUSES,
} from "./post-status";

describe("post status rollout contracts", () => {
  it("requires an explicit policy decision for each stored status", () => {
    expect(
      POST_STATUSES.filter((status) => POST_STATUS_POLICY[status].editable)
    ).toEqual(POST_WRITE_STATUSES);
    expect(
      POST_STATUSES.filter(
        (status) => POST_STATUS_POLICY[status].publicContract
      )
    ).toEqual(PUBLIC_POST_STATUSES);
    expect(POST_WRITE_STATUSES).toEqual(["published", "draft"]);
    expect(PUBLIC_POST_STATUSES).toEqual(["published", "draft"]);
  });
});
