"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useServerAction } from "zsa-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CustomerRegistrationSchema, CustomerRegistrationT } from "../_core/customerRegistration.definitions";
import { createCustomerRegistrationAction } from "../actions";
export function CustomerRegistrationForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerRegistrationT>({
    resolver: zodResolver(CustomerRegistrationSchema),
  });

  const {isPending, execute, data} = useServerAction(createCustomerRegistrationAction, {
    onError: ({err}) => {
      toast.error( err.message);
      console.log(err.message)
    },
    onSuccess:({data}) => {
      toast.success("Formulario enviado correctamente");
      console.log("CustomerRegistration enviada:", data);
    }
  });

  const onSubmit = (CustomerRegistration: CustomerRegistrationT) => {
    console.log("Datos validados:", CustomerRegistration);
    execute({
      CustomerRegistration
    })
  };



  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            Darse de alta
          </CardTitle>
          <CardDescription>Rellena aquí tus datos de cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6">
              <div className="flex gap-3">
                <div className="grid gap-1 w-full">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" {...register("nombre")} />
                  {errors.nombre && (
                    <p className="text-sm text-red-500">
                      {errors.nombre.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-1 w-full">
                  <Label htmlFor="apellido">Apellidos</Label>
                  <Input id="apellido" {...register("apellido")} />
                  {errors.apellido && (
                    <p className="text-sm text-red-500">
                      {errors.apellido.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="nif">N.I.F/C.I.F</Label>
                <Input id="nif" {...register("nif")} />
                {errors.nif && (
                  <p className="text-sm text-red-500">{errors.nif.message}</p>
                )}
              </div>
              <div className="grid gap-1">
                <Label htmlFor="domicilio">Domicilio</Label>
                <Input id="domicilio" {...register("domicilio")} />
                {errors.domicilio && (
                  <p className="text-sm text-red-500">
                    {errors.domicilio.message}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <div className="grid gap-1 w-full">
                  <Label htmlFor="cpostal">C. Postal</Label>
                  <Input id="cpostal" {...register("cpostal")} />
                  {errors.cpostal && (
                    <p className="text-sm text-red-500">
                      {errors.cpostal.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-1 w-full">
                  <Label htmlFor="localidad">Localidad</Label>
                  <Input id="localidad" {...register("localidad")} />
                  {errors.localidad && (
                    <p className="text-sm text-red-500">
                      {errors.localidad.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-1 w-full">
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input id="provincia" {...register("provincia")} />
                  {errors.provincia && (
                    <p className="text-sm text-red-500">
                      {errors.provincia.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="sm:flex block gap-3">
                <div className="grid mb-3 sm:mb-0 gap-1 w-full">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" {...register("telefono")} />
                  {errors.telefono && (
                    <p className="text-sm text-red-500">
                      {errors.telefono.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-1 w-full">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <Button  disabled={isPending} type="submit" className="w-full ">
                Enviar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        Enviando los datos de este formulario aceptas nuestra{" "}
        <a href="#">Política de Privacidad</a>.
      </div>
    </div>
  );
}