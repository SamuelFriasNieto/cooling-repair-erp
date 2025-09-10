import { createClient } from "@/lib/supabase/server";
import { CustomerRegistrationT } from "./customerRegistration.definitions";


export async function createCustomerRegistration(
  data: CustomerRegistrationT
) /* : Promise<Solicitud> */ {

    const supabase = await createClient();

  try {
    const customer = await supabase.from("Customers").insert({
        nombre: data.nombre,
        apellido: data.apellido,
        nif: data.nif,
        domicilio: data.domicilio,
        cpostal: data.cpostal,
        localidad: data.localidad,
        provincia: data.provincia,
        telefono: data.telefono,
        email: data.email,
      },
    );

    return {
      message: "Solicitud generada correctamente",
      data: customer,
    };
  } catch (error) {
    console.error("Error al crear la solicitud:");
    throw new Error("Error al crear la solicitud");
  }
}