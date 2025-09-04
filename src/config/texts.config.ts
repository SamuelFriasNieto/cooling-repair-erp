import { title } from "process";

export const TEXTS = {
    dashboard: {
        title: "Dashboard",
        description: "Visión general de la aplicación",
    },
    budget: {
        title: "Presupuestos",
        description: "Gestión de Presupuestos",
    },
    customers: {
        title: "Clientes",
        description: "Gestión de Clientes",
    },
    products: {
        title: "Productos",
        description: "Gestión de Productos",
    },
    actions: {
        createBudget: {
            title: "Crear Presupuesto",
            description: "Inicia el proceso para crear un nuevo presupuesto.",
        }
    }
} as const;