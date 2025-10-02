import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IconFileText } from "@tabler/icons-react";

interface InvoiceStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  variant?: "default" | "success" | "warning" | "destructive";
}

export function InvoiceStatsCard({ title, value, description, variant = "default" }: InvoiceStatsCardProps) {
  const badgeVariant = variant === "success" ? "default" : variant === "warning" ? "secondary" : variant === "destructive" ? "destructive" : "outline";
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <IconFileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

