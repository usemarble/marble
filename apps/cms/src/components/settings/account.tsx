import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import React from "react";

function Account() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-6 grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>Name</Label>
          <Input />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Email</Label>
          <Input />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Address</Label>
        <Input />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <Label>Country</Label>
          <Input />
        </div>
        <div className="flex flex-col gap-2">
          <Label>City</Label>
          <Input />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Zip / Postal code</Label>
          <Input />
        </div>
      </div>
    </div>
  );
}

export default Account;
