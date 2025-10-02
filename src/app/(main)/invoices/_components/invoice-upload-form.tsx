"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  IconUpload, 
  IconFileText, 
  IconCalculator, 
  IconPhoto, 
  IconX, 
  IconEye,
  IconWand,
  IconAlertCircle,
  IconCheck
} from "@tabler/icons-react";
import { CreateInvoiceSchema, type CreateInvoice } from "../_core/invoices.schemas";
import { uploadInvoiceWithFileAction } from "../actions";
import { InvoiceOCRService, type ExtractedInvoiceData } from "../_core/invoice-ocr.service";

export function InvoiceUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [ocrCompleted, setOcrCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CreateInvoice>({
    resolver: zodResolver(CreateInvoiceSchema),
    defaultValues: {
      status: "pending",
      type: "expense",
      vatRate: 21, // IVA estándar en España
    }
  });

  // Watch para calcular automáticamente montos
  const netAmount = watch("netAmount");
  const vatRate = watch("vatRate");

  // Calcular IVA y total automáticamente
  const calculateAmounts = (net: number, rate: number) => {
    if (net && rate) {
      const vat = (net * rate) / 100;
      const total = net + vat;
      setValue("vatAmount", parseFloat(vat.toFixed(2)));
      setValue("totalAmount", parseFloat(total.toFixed(2)));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setOcrCompleted(false);
      setExtractedData(null);
      
      // Crear preview para imágenes
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  // Función para extraer datos automáticamente
  const extractDataFromFile = async () => {
    if (!file) {
      toast.error("No hay archivo seleccionado");
      return;
    }

    setIsExtracting(true);
    setExtractionProgress(0);
    
    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setExtractionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      toast.info("Extrayendo datos del archivo...");
      
      const extractedData = await InvoiceOCRService.extractInvoiceData(file);
      
      clearInterval(progressInterval);
      setExtractionProgress(100);
      
      setExtractedData(extractedData);
      setOcrCompleted(true);

      if (extractedData.confidence > 0.5) {
        toast.success(`Datos extraídos con ${Math.round(extractedData.confidence * 100)}% de confianza`);
        
        // Rellenar formulario automáticamente
        if (extractedData.companyName) setValue("companyName", extractedData.companyName);
        if (extractedData.invoiceNumber) setValue("invoiceNumber", extractedData.invoiceNumber);
        if (extractedData.issueDate) setValue("issueDate", extractedData.issueDate);
        if (extractedData.dueDate) setValue("dueDate", extractedData.dueDate);
        if (extractedData.totalAmount) setValue("totalAmount", extractedData.totalAmount);
        if (extractedData.netAmount) setValue("netAmount", extractedData.netAmount);
        if (extractedData.vatAmount) setValue("vatAmount", extractedData.vatAmount);
        if (extractedData.vatRate) setValue("vatRate", extractedData.vatRate);
        if (extractedData.description) setValue("description", extractedData.description);
      } else {
        toast.warning("Datos extraídos con baja confianza. Revisa los campos manualmente.");
      }
    } catch (error) {
      toast.error("Error al extraer datos del archivo");
      console.error('OCR Error:', error);
    } finally {
      setIsExtracting(false);
      setTimeout(() => setExtractionProgress(0), 2000);
    }
  };

  const onSubmit = async (data: CreateInvoice) => {
    if (!file) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Añadir todos los campos del formulario
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const result = await uploadInvoiceWithFileAction(formData);
      
      if (result.success) {
        toast.success("Factura subida exitosamente");
        reset();
        setFile(null);
        setPreview(null);
      } else {
        throw new Error("Error al subir factura");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir factura");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de la factura */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFileText className="h-5 w-5" />
                Información de la Factura
              </CardTitle>
              <CardDescription>
                Completa los datos básicos de la factura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Empresa</Label>
                <Input
                  id="companyName"
                  placeholder="Nombre de la empresa emisora"
                  {...register("companyName")}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Número de Factura</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="Ej: FAC-2024-001"
                  {...register("invoiceNumber")}
                />
                {errors.invoiceNumber && (
                  <p className="text-sm text-destructive">{errors.invoiceNumber.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Fecha de Emisión</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    {...register("issueDate")}
                  />
                  {errors.issueDate && (
                    <p className="text-sm text-destructive">{errors.issueDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...register("dueDate")}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select onValueChange={(value) => setValue("status", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="paid">Pagada</SelectItem>
                      <SelectItem value="overdue">Vencida</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select onValueChange={(value) => setValue("type", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Gasto</SelectItem>
                      <SelectItem value="income">Ingreso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción adicional de la factura"
                  {...register("description")}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Montos y archivo */}
        <div className="space-y-4">
          {/* Cálculos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCalculator className="h-5 w-5" />
                Cálculos de IVA
              </CardTitle>
              <CardDescription>
                Los montos se calcularán automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="netAmount">Monto Neto (€)</Label>
                  <Input
                    id="netAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("netAmount", { 
                      valueAsNumber: true,
                      onChange: (e) => {
                        const net = parseFloat(e.target.value) || 0;
                        calculateAmounts(net, vatRate || 21);
                      }
                    })}
                  />
                  {errors.netAmount && (
                    <p className="text-sm text-destructive">{errors.netAmount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatRate">IVA (%)</Label>
                  <Select onValueChange={(value) => {
                    const rate = parseFloat(value);
                    setValue("vatRate", rate);
                    calculateAmounts(netAmount || 0, rate);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar IVA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (Exento)</SelectItem>
                      <SelectItem value="4">4% (Súper reducido)</SelectItem>
                      <SelectItem value="10">10% (Reducido)</SelectItem>
                      <SelectItem value="21">21% (General)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vatAmount">IVA (€)</Label>
                  <Input
                    id="vatAmount"
                    type="number"
                    step="0.01"
                    readOnly
                    className="bg-muted"
                    {...register("vatAmount", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total (€)</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    readOnly
                    className="bg-muted font-bold"
                    {...register("totalAmount", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Archivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUpload className="h-5 w-5" />
                Archivo de Factura
              </CardTitle>
              <CardDescription>
                Sube el archivo PDF o imagen de la factura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Seleccionar archivo</Label>
                <div className="relative">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex items-center text-white justify-center h-10 px-4 py-2 border border-input bg-black rounded-md text-sm font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    <IconUpload className="mr-2 h-4 w-4" />
                    {file ? file.name : "Elegir archivo"}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos permitidos: PDF, JPG, PNG, WebP (máximo 10MB)
                </p>
              </div>

              {file && (
                <div className="space-y-4">
                  {/* Botón de extracción automática */}
                  <div className="space-y-3">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={extractDataFromFile}
                      disabled={isExtracting || ocrCompleted}
                      className="w-full"
                    >
                      {isExtracting ? (
                        <>
                          <IconCalculator className="mr-2 h-4 w-4 animate-spin" />
                          Extrayendo datos...
                        </>
                      ) : ocrCompleted ? (
                        <>
                          <IconCheck className="mr-2 h-4 w-4" />
                          Datos extraídos
                        </>
                      ) : (
                        <>
                          <IconWand className="mr-2 h-4 w-4" />
                          Extraer datos automáticamente
                        </>
                      )}
                    </Button>

                    {/* Progreso de extracción */}
                    {isExtracting && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Procesando archivo...</span>
                          <span>{extractionProgress}%</span>
                        </div>
                        <Progress value={extractionProgress} className="w-full" />
                      </div>
                    )}

                    {/* Resultados de extracción */}
                    {extractedData && (
                      <Alert>
                        <IconAlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span>Datos extraídos</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Los campos se han rellenado automáticamente. Revisa y corrige si es necesario.
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              )}

              {preview && (
                <div className="space-y-2">
                  <Label>Vista previa</Label>
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="max-w-full h-48 object-contain border rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botón de envío */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            setFile(null);
            setPreview(null);
          }}
        >
          Limpiar
        </Button>
        <Button type="submit" disabled={isUploading || !file}>
          {isUploading ? "Subiendo..." : "Guardar Factura"}
        </Button>
      </div>
    </form>
  );
}
