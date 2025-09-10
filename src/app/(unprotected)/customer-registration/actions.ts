"use server";

import { z } from "zod";
import { createServerAction } from "zsa";
import { CustomerRegistrationSchema } from "./_core/customerRegistration.definitions";
import { createCustomerRegistrationUseCase } from "./_core/customerRegistration.use-case";

export const createCustomerRegistrationAction = createServerAction()
.input(
    z.object({
        CustomerRegistration: CustomerRegistrationSchema,
    })
).handler(async ({ input }) => {
    const { CustomerRegistration } = input;

        const response = await createCustomerRegistrationUseCase(CustomerRegistration);
        return {...response};
})