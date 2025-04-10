import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: "blue" | "orange" | "purple" | "green";
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  color = "blue",
  isLoading = false,
}: StatsCardProps) {
  // Map color to icon background
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
  };

  const trendMap = {
    positive: "text-green-600",
    negative: "text-red-600",
  };

  // Determine if trend is positive or negative
  const trendType = trend && trend.value >= 0 ? "positive" : "negative";
  const TrendIcon = trendType === "positive" ? ArrowUpIcon : ArrowDownIcon;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <span className={cn("p-2 rounded-full", colorMap[color])}>
            {icon}
          </span>
        </div>
        
        {isLoading ? (
          <div className="mt-2 h-9 w-16 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        )}
        
        {trend && (
          <p className="mt-1 text-sm text-gray-600">
            <span className={cn("flex items-center", trendMap[trendType])}>
              <TrendIcon className="h-3 w-3 mr-1" /> {Math.abs(trend.value)}%
              <span className="ml-1 text-gray-600">{trend.label}</span>
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
