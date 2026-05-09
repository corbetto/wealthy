import { SummaryCards } from "@/components/dashboard/summary-cards";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { AssetAllocation } from "@/components/dashboard/asset-allocation";
import { TopHoldings } from "@/components/dashboard/top-holdings";

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your complete wealth overview</p>
      </div>

      <SummaryCards />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PortfolioChart />
        </div>
        <div>
          <AssetAllocation />
        </div>
      </div>

      <TopHoldings />
    </div>
  );
}
