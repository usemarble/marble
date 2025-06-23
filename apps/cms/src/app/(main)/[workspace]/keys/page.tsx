import { Button } from "@marble/ui/components/button";
import WorkspaceWrapper from "@/components/layout/workspace-wrapper";

function Page() {
  return (
    <WorkspaceWrapper className="h-full grid place-content-center">
      <div className="flex flex-col gap-4 items-center max-w-80">
        <div className="p-4 border">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
            className="size-16"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
            />
          </svg>
        </div>
        <div className="text-center flex flex-col gap-4 items-center">
          <p className="text-muted-foreground text-sm">
            API keys allow you to programmatically interact with your workspace
            using our api.
          </p>
          <Button size="sm" disabled className="w-fit">
            <span>New API Key</span>
          </Button>
        </div>
      </div>
    </WorkspaceWrapper>
  );
}

export default Page;
