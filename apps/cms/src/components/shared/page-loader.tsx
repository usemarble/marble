"use client";

import { SpinnerIcon } from "@phosphor-icons/react";

function PageLoader() {
  return (
    <div aria-busy="true" className="grid h-full w-full place-content-center">
      <div className="p-2">
        <SpinnerIcon className="size-5 animate-spin transition" />
      </div>
    </div>
  );
}

export default PageLoader;
