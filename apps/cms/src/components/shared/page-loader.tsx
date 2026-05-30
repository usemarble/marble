import { ActivityIndicator } from "@/components/ui/activity-indicator";

function PageLoader() {
  return (
    <div aria-busy="true" className="grid h-full w-full place-content-center">
      <div className="p-2">
        <ActivityIndicator />
      </div>
    </div>
  );
}

export default PageLoader;
