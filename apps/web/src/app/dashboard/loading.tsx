import { LoadingState } from "@/components/shared/loading-state";

export default function DashboardLoading() {
  return (
    <div className="w-full flex justify-center py-12">
      <LoadingState label="CARGANDO NÚCLEO..." />
    </div>
  );
}
