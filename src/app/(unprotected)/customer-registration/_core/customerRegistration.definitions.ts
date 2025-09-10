import { z } from "zod";

export const CustomerRegistrationSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "Los apellidos son obligatorios"),
  nif: z
    .string().min(1, "N.I.F/C.I.F inválido"),
  domicilio: z.string().min(1, "El domicilio es obligatorio"),
  cpostal: z.string().min(1, "Código postal inválido"),
  localidad: z.string().min(1, "La localidad es obligatoria"),
  provincia: z.string().min(1, "La provincia es obligatoria"),
  telefono: z.string().min(1, "Teléfono inválido"),
  email: z.string().email("Email inválido"),
});

export type CustomerRegistrationT = z.infer<typeof CustomerRegistrationSchema>;