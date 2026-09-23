import { useEffect, useState } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "./ui/navigation-menu";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "./ui/sheet";
import { Separator } from "./ui/separator";

export const navigation = [
  ["/", "Understand a workflow", "home"],
  ["/library", "Research library", "library"],
  ["/map", "Library map", "map"],
  ["/collections", "Collections", "collections"],
  ["/briefs", "Research briefs", "briefs"],
  ["/coverage", "Coverage", "coverage"],
  ["/use", "Use the corpus", "use"],
];

export function SiteNavigation({ active }: { active: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return (
    <div className="flex items-center gap-3">
      <Button asChild variant="outline"><a href="/library" data-search-trigger="true">Search</a></Button>
      <div className="hidden xl:block">
        <NavigationMenu aria-label="Main navigation" viewport={false}>
          <NavigationMenuList>
            {navigation.map(([href, title, key]) => (
              <NavigationMenuItem key={key}>
                <NavigationMenuLink
                  href={href}
                  active={active === key}
                  data-active={active === key}
                  aria-current={active === key ? "page" : undefined}
                >
                  {title}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div className="xl:hidden">
        {ready ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <MenuIcon data-icon="inline-start" />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Explore the corpus</SheetTitle>
                <SheetDescription>
                  Sources, accounting context, and research tools.
                </SheetDescription>
              </SheetHeader>
              <Separator />
              <nav
                aria-label="Mobile navigation"
                className="flex flex-col gap-2 px-4"
              >
                {navigation.map(([href, title, key]) => (
                  <SheetClose asChild key={key}>
                    <Button
                      asChild
                      variant={active === key ? "secondary" : "ghost"}
                    >
                      <a
                        href={href}
                        aria-current={active === key ? "page" : undefined}
                      >
                        {title}
                      </a>
                    </Button>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <details>
            <summary>Menu</summary>
            <nav
              aria-label="Mobile navigation"
              className="flex flex-col gap-3 py-3"
            >
              {navigation.map(([href, title, key]) => (
                <a
                  key={key}
                  href={href}
                  aria-current={active === key ? "page" : undefined}
                >
                  {title}
                </a>
              ))}
            </nav>
          </details>
        )}
      </div>
    </div>
  );
}
