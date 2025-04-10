import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  isLoading?: boolean;
  filter?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  bgColor,
  isLoading = false,
  filter = "all",
}: StatsCardProps) {
  const [, navigate] = useLocation();
  
  const handleClick = () => {
    navigate(`/certificates?filter=${filter}`);
  };
  
  return (
    <div 
      className="bg-white rounded-lg shadow p-5 cursor-pointer transition-all hover:shadow-md hover:translate-y-[-2px]"
      onClick={handleClick}
    >
      <div className="flex justify-between">
        <div>
          <span className="text-sm text-slate-500 font-medium">{title}</span>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-semibold text-slate-800">{value}</p>
          )}
        </div>
        <div className={`${bgColor} p-2 rounded`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
