import { createClient } from "@/lib/supabase/server";
import { CustomerRegistrationT } from "./customerRegistration.definitions";

export async function createCustomerRegistration(
  data: CustomerRegistrationT
) /* : Promise<Solicitud> */ {
  const supabase = await createClient();

  try {
    const { data: customer, error } = await supabase.from("customers").insert({
      name: data.nombre,
      surname: data.apellido,
      cif: data.nif,
      address: data.domicilio,
      cp: data.cpostal,
      state: data.localidad,
      city: data.provincia,
      phone: data.telefono,
      email: data.email,
    });

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      message: "Solicitud generada correctamente",
      data: customer,
    };
  } catch (error) {
    console.error("Error al crear la solicitud:", error);
    throw new Error("Error al crear la solicitud");
  }
}
