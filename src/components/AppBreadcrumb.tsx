"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Fragment } from "react";
import { TbHomeFilled } from "react-icons/tb";
import {  ROUTES } from "@/config/routes.config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { flattenRoutes } from "@/lib/routes.lib";
import { capitalizeFirstLetterFromEachWord } from "@/lib/presenters.lib";

export type AppBreadcrumbProps = {
  className?: string;
  homeLink?: string;
  color?: boolean;
  invertedColor?: boolean;
};

export default function AppBreadcrumb({
  className,
  homeLink = "/",
  color = false,
  invertedColor = false,
}: AppBreadcrumbProps) {
  const path = usePathname();
  const segments = path.split("/").filter(Boolean);
  const isMobile = useIsMobile();

  const flatRoutes = flattenRoutes(ROUTES);

  const lastSegment = segments[segments.length - 1];
  const lastSegmentRoute = flatRoutes.find((route) =>
    route.path.endsWith(lastSegment),
  );
  const LastSegmentIcon = lastSegmentRoute?.icon;
  const { name, fullName } = lastSegmentRoute ?? {};
  const lastSegmentRouteDisplay =
    name ?? capitalizeFirstLetterFromEachWord(lastSegment);
  return (
    <div className={cn("", className)}>
      <Breadcrumb>
        <BreadcrumbList
          className={cn(
            "text-foreground/70",
            color && "text-accent-primary-foreground/60",
            invertedColor && "text-background",
          )}
        >
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className={cn(
                color && "hover:text-accent-primary-foreground",
                invertedColor && "text-background hover:text-accent-primary",
              )}
            >
              <Link
                href={homeLink}
                // className={cn(
                //   color && "hover:text-accent-primary-foreground",
                //   invertedColor && "text-background hover:text-accent-primary",
                // )}
              >
                <TbHomeFilled className="size-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {isMobile ? (
            <>
              {segments.length > 1 && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1">
                        <BreadcrumbEllipsis className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {segments.slice(0, -1).map((segment, index) => {
                          const href =
                            "/" + segments.slice(0, index + 1).join("/");
                          const routeData = flatRoutes.find((route) =>
                            route.path.endsWith(`/${segment}`),
                          );
                          const Icon = routeData?.icon;
                          const { name, fullName, getLabel } = routeData ?? {};
                          const display =
                            getLabel?.(segment) ??
                            name ??
                            capitalizeFirstLetterFromEachWord(segment);
                          console.log({ href });
                          return (
                            <Fragment key={href}>
                              <DropdownMenuItem className="gap-1" asChild>
                                <BreadcrumbItem>
                                  {Icon && <Icon className="size-4" />}
                                  <BreadcrumbLink asChild>
                                    <Link href={href}>{display}</Link>
                                  </BreadcrumbLink>
                                </BreadcrumbItem>
                              </DropdownMenuItem>
                              {index < segments.length - 2 && (
                                <DropdownMenuSeparator />
                              )}
                            </Fragment>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage
                  className={cn(
                    "text-foreground flex items-center gap-1",
                    color && "text-accent-primary-foreground",
                    invertedColor && "text-background",
                  )}
                >
                  {LastSegmentIcon && <LastSegmentIcon className="size-4" />}
                  {lastSegmentRouteDisplay}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            segments.map((segment, index) => {
              const href = "/" + segments.slice(0, index + 1).join("/");
              const isLast = index === segments.length - 1;
              const routeData = flatRoutes.find((route) =>
                route.path.endsWith(`/${segment}`),
              );
              const Icon = routeData?.icon;
              const { name, fullName, getLabel } = routeData ?? {};
              const display =
                getLabel?.(segment) ??
                name ??
                capitalizeFirstLetterFromEachWord(segment);
              console.log({ href });

              return (
                <Fragment key={href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage
                        className={cn(
                          "text-foreground flex items-center gap-1",
                          color && "text-accent-primary-foreground",
                          invertedColor && "text-background",
                        )}
                      >
                        {Icon && <Icon className="size-4" />}
                        {display}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        asChild
                        className={cn(
                          color && "hover:text-accent-primary-foreground",
                          invertedColor &&
                            "text-background hover:text-accent-primary",
                        )}
                      >
                        <Link
                          href={href}
                          className={cn(
                            "flex items-center gap-1",
                            // color && "hover:text-accent-primary-foreground",
                            // invertedColor &&
                            //   "text-background hover:text-accent-primary",
                          )}
                        >
                          {Icon && <Icon className="size-4" />}
                          {display}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}