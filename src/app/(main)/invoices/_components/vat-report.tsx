"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  IconChartBar,
  IconDownload,
  IconFileText,
  IconCalculator,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";
import { useServerAction } from "zsa-react";
import {
  VATReportSchema,
  type VATReport,
  type VATSummary,
} from "../_core/invoices.schemas";
import { generateVATReportAction } from "../actions";

export function VATReport() {
  const [report, setReport] = useState<VATSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<VATReport>({
    resolver: zodResolver(VATReportSchema),
    defaultValues: {
      year: new Date().getFullYear(),
    },
  });

  const { execute: generateReport } = useServerAction(generateVATReportAction);

  const selectedQuarter = watch("quarter");
  const selectedYear = watch("year");

  // Calcular fechas del trimestre
  const getQuarterDates = (quarter: string, year: number) => {
    const quarterMap = {
      Q1: {
        start: `${year}-01-01`,
        end: `${year}-03-31`,
        label: "Primer trimestre",
      },
      Q2: {
        start: `${year}-04-01`,
        end: `${year}-06-30`,
        label: "Segundo trimestre",
      },
      Q3: {
        start: `${year}-07-01`,
        end: `${year}-09-30`,
        label: "Tercer trimestre",
      },
      Q4: {
        start: `${year}-10-01`,
        end: `${year}-12-31`,
        label: "Cuarto trimestre",
      },
    };
    return quarterMap[quarter as keyof typeof quarterMap];
  };

  const onSubmit = async (data: VATReport) => {
    setIsGenerating(true);

    try {
      const [result, error] = await generateReport(data);

      if (error) {
        toast.error("Error al generar reporte");
        return;
      }

      if (result?.success) {
        setReport(result.report);
        toast.success("Reporte generado exitosamente");
      }
    } catch (error) {
      toast.error("Error al generar reporte");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQuarterlyReport = (quarter: string) => {
    if (!selectedYear) {
      toast.error("Selecciona un año");
      return;
    }

    const quarterData = getQuarterDates(quarter, selectedYear);
    setValue("quarter", quarter as any);
    setValue("startDate", quarterData.start);
    setValue("endDate", quarterData.end);

    handleSubmit(onSubmit)();
  };

  const exportReportToPDF = () => {
    if (!report) return;

    // Crear contenido HTML para el PDF
    const reportHTML = `
      <html>
        <head>
          <title>Informe de IVA - ${report.period}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin: 20px 0; }
            .amount { font-weight: bold; font-size: 1.2em; }
            .positive { color: green; }
            .negative { color: red; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Informe de IVA</h1>
            <h2>Período: ${report.period}</h2>
          </div>
          
          <div class="summary">
            <h3>Resumen</h3>
            <table>
              <tr><td>IVA a Pagar (Gastos)</td><td class="amount">€${report.totalVATPayable.toFixed(
                2
              )}</td></tr>
              <tr><td>IVA a Cobrar (Ingresos)</td><td class="amount">€${report.totalVATReceivable.toFixed(
                2
              )}</td></tr>
              <tr><td>Posición Neta de IVA</td><td class="amount ${
                report.netVATPosition >= 0 ? "positive" : "negative"
              }">€${report.netVATPosition.toFixed(2)}</td></tr>
              <tr><td>Total Ingresos</td><td class="amount">€${report.totalIncome.toFixed(
                2
              )}</td></tr>
              <tr><td>Total Gastos</td><td class="amount">€${report.totalExpenses.toFixed(
                2
              )}</td></tr>
              <tr><td>Número de Facturas</td><td class="amount">${
                report.invoiceCount
              }</td></tr>
            </table>
          </div>
          
          <div style="margin-top: 40px;">
            <p><strong>Nota:</strong> Este informe incluye solo facturas marcadas como pagadas.</p>
            <p><strong>Generado:</strong> ${new Date().toLocaleDateString(
              "es-ES"
            )}</p>
          </div>
        </body>
      </html>
    `;

    // Abrir en nueva ventana para imprimir/guardar como PDF
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Generación rápida por trimestres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconChartBar className="h-5 w-5" />
            Reportes Trimestrales
          </CardTitle>
          <CardDescription>
            Genera reportes para declaraciones trimestrales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Select onValueChange={(value) => setValue("year", parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => {
              const quarterData = selectedYear ? getQuarterDates(quarter, selectedYear) : null;
              return (
                <Button
                  key={quarter}
                  variant="outline"
                  className="h-20 flex flex-col gap-1"
                  onClick={() => generateQuarterlyReport(quarter)}
                  disabled={isGenerating || !selectedYear}
                >
                  <span className="font-semibold">{quarter}</span>
                  {quarterData && (
                    <span className="text-xs text-muted-foreground">
                      {quarterData.label}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Período personalizado */}
      <Card>
        <CardHeader>
          <CardTitle>Período Personalizado</CardTitle>
          <CardDescription>
            Genera un reporte para un período específico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
                {errors.startDate && (
                  <p className="text-sm text-destructive">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Fin</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
                {errors.endDate && (
                  <p className="text-sm text-destructive">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isGenerating} className="w-full">
              {isGenerating ? "Generando..." : "Generar Reporte"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Resultados del reporte */}
      {report && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <IconFileText className="h-5 w-5" />
                  Informe de IVA
                </CardTitle>
                <CardDescription>Período: {report.period}</CardDescription>
              </div>
              <Button variant="outline" onClick={exportReportToPDF}>
                <IconDownload className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <IconTrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">IVA a Pagar</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    €
                    {report.totalVATPayable.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Facturas de gastos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <IconTrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">IVA a Cobrar</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    €
                    {report.totalVATReceivable.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Facturas de ingresos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <IconCalculator className="h-4 w-4" />
                    <span className="text-sm font-medium">Posición Neta</span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      report.netVATPosition >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    €
                    {report.netVATPosition.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {report.netVATPosition >= 0 ? "A favor" : "A pagar"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Detalle del período */}

            <div className="space-y-4">
              <h4 className="font-semibold">Resumen del Período</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Ingresos:</span>
                  <span className="font-medium">
                    €
                    {report.totalIncome.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Gastos:</span>
                  <span className="font-medium">
                    €
                    {report.totalExpenses.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Número de Facturas:</span>
                  <span className="font-medium">{report.invoiceCount}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                * Solo se incluyen facturas marcadas como pagadas en el cálculo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
