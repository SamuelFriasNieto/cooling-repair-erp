import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerStatsAction } from "../actions";
import { Users, UserPlus, TrendingUp, MapPin } from "lucide-react";

export async function CustomerStats() {
  try {
    const [result, error] = await getCustomerStatsAction();
    
    if (error || !result?.success) {
      throw new Error("Error al cargar estadísticas");
    }

    const { total, thisMonth, thisYear, topCities } = result.stats;

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              Clientes registrados
            </p>
          </CardContent>
        </Card>

        {/* Clientes este mes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Nuevos clientes
            </p>
          </CardContent>
        </Card>

        {/* Clientes este año */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Año</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisYear}</div>
            <p className="text-xs text-muted-foreground">
              Clientes registrados
            </p>
          </CardContent>
        </Card>

        {/* Ciudad principal */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ciudad Principal</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topCities[0]?.city || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {topCities[0]?.count || 0} clientes
            </p>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="p-6">
            <p className="text-destructive">Error al cargar las estadísticas de clientes</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
