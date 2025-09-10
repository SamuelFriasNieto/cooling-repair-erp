import { CustomerRegistrationSchema, CustomerRegistrationT } from "./customerRegistration.definitions";
import { createCustomerRegistration } from "./customerRegistration.service";


export async function createCustomerRegistrationUseCase(raw: CustomerRegistrationT) {
  const data = CustomerRegistrationSchema.parse(raw);

  const response = await createCustomerRegistration(data);

  return response;
}