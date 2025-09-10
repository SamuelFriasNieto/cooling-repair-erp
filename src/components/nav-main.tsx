"use client";

import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/config/routes.config";
import { TEXTS } from "@/config/texts.config";
import { title } from "process";
import { redirect } from "next/navigation";

export function NavMain() {
  const NavItems = [
    {
      title: ROUTES.dashboard.self.name,
      url: ROUTES.dashboard.self.path,
      icon: ROUTES.dashboard.self.icon,
    },
    {
      title: ROUTES.budget.self.name,
      url: ROUTES.budget.self.path,
      icon: ROUTES.budget.self.icon,
    },
    {
      title: ROUTES.invoices.self.name,
      url: ROUTES.invoices.self.path,
      icon: ROUTES.invoices.self.icon,
    },
    {
      title: ROUTES.customers.self.name,
      url: ROUTES.customers.self.path,
      icon: ROUTES.customers.self.icon,
    },
    {
      title: ROUTES.products.self.name,
      url: ROUTES.products.self.path,
      icon: ROUTES.products.self.icon,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton onClick={() => redirect(ROUTES.customerRegistration.self.path)}
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>{TEXTS.actions.createBudget.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {NavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
