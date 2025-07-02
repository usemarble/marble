import { Loader } from "lucide-react";

function PageLoader() {
  return (
    <div aria-busy="true" className="w-full h-full grid place-content-center">
      <div className="p-2">
        <Loader className="size-4 animate-spin transition" />
      </div>
    </div>
  );
}

export default PageLoader;
