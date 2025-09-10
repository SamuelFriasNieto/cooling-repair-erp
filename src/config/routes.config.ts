import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"


export type RouteSelfT = {
  path: string;
  name: string;
  fullName?: string;
  icon?: any;
  type: string;
  permissions?: readonly string[];
  getLabel?: (...args: any[]) => string;
};

export type RouteT = {
  self: RouteSelfT;
  [key: string]: RouteSelfT | RouteT;
};

export type RoutesT = Record<string, RouteT>;

const updatePaths = <T extends RoutesT>(
  routes: T,
  parentPath: string = "",
  visited: Set<RoutesT> = new Set(),
): T => {
  if (visited.has(routes)) {
    return routes;
  }
  visited.add(routes);

  const result: RoutesT = {};

  for (const key in routes) {
    const route = routes[key];
    if (route.self) {
      route.self.path = parentPath + route.self.path;
    }
    result[key] = {
      ...route,
      ...updatePaths(
        route as RoutesT,
        route.self ? route.self.path : parentPath,
        visited,
      ),
    };
  }

  return result as T;
};

export const ROUTES = {
  dashboard: {
    self: {
      name: "Dashboard",
      fullName: "CoolingRepair ERP - Dashboard",
      path: "/dashboard",
      icon: IconDashboard,
      type: "home",
    },
  },
  customerRegistration: {
    self: {
      name: "Registro de Cliente",
      fullName: "Registro de Nuevo Cliente",
      path: "/customer-registration",
      icon: IconUsers,
      type: "section",
    },
  },
  login: {
    self: {
      name: "Inicio de sesión",
      fullName: "Inicio de sesión",
      path: "/login",
      type: "login",
    },
  },
  budget: {
    self: {
      name: "Presupuestos",
      fullName: "Gestión de Presupuestos",
      path: "/budget",
      icon: IconFileDescription,
      type: "budget",
    },
  },
  customers: {
    self: {
      name: "Clientes",
      fullName: "Gestión de Clientes",
      path: "/customers",
      icon: IconUsers,
      type: "section",
    },
  },
  products: {
    self: {
      name: "Productos",
      fullName: "Gestión de Productos",
      path: "/products",
      icon: IconFolder,
      type: "section",
    },
    docId: {
      self: {
        path: "/:docId",
        name: "Orden de trabajo",
        type: "page",
      },
    },
  },
  invoices: {
    self: {
      name: "Facturas",
      fullName: "Gestión de Facturas",
      path: "/invoices",
      icon: IconFileDescription,
      type: "section",
    },
  },
  reports: {
    self: {
      name: "Reportes",
      fullName: "Reportes y Análisis",
      path: "/reports",
      type: "section",
      permissions: ["reports"],
    },
  },
  diagnostics: {
    self: {
      name: "Diagnósticos",
      fullName: "Diagnósticos de Equipos",
      path: "/diagnostics",
      type: "section",
      permissions: ["diagnostics"],
    },
    pending: {
      self: {
        path: "/pending",
        name: "Pendientes",
        fullName: "Diagnósticos Pendientes",
        type: "sub-section",
      },
    },
    completed: {
      self: {
        path: "/completed",
        name: "Completados",
        fullName: "Diagnósticos Completados",
        type: "sub-section",
      },
    },
  },
  quotes: {
    self: {
      name: "Presupuestos",
      fullName: "Gestión de Presupuestos",
      path: "/quotes",
      type: "section",
      permissions: ["quotes"],
    },
    active: {
      self: {
        path: "/active",
        name: "Activos",
        fullName: "Presupuestos Activos",
        type: "sub-section",
      },
    },
    approved: {
      self: {
        path: "/approved",
        name: "Aprobados",
        fullName: "Presupuestos Aprobados",
        type: "sub-section",
      },
    },
    archived: {
      self: {
        path: "/archived",
        name: "Archivados",
        fullName: "Presupuestos Archivados",
        type: "sub-section",
      },
    },
  },
  maintenance: {
    self: {
      name: "Mantenimientos",
      fullName: "Gestión de Mantenimientos",
      path: "/maintenance",
      type: "section",
      permissions: ["maintenance"],
    },
    scheduled: {
      self: {
        path: "/scheduled",
        name: "Programados",
        fullName: "Mantenimientos Programados",
        type: "sub-section",
      },
    },
    preventive: {
      self: {
        path: "/preventive",
        name: "Preventivos",
        fullName: "Mantenimientos Preventivos",
        type: "sub-section",
      },
    },
  },
  settings: {
    self: {
      name: "Configuración",
      fullName: "Configuración del Sistema",
      path: "/settings",
      type: "settings",
      permissions: ["admin"],
    },
  },
  help: {
    self: {
      name: "Ayuda",
      fullName: "Centro de Ayuda",
      path: "/help",
      type: "support",
    },
  },
  search: {
    self: {
      name: "Buscar",
      fullName: "Búsqueda Global",
      path: "/search",
      type: "utility",
    },
  },
} as const;

export type RoutesDefT = typeof ROUTES;

// Actualiza los paths de las rutas recursivamente para que tengan el path completo
updatePaths(ROUTES);

export const EXCLUDED_ROUTES: RouteT[] = [] as const;