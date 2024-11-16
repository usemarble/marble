import Link from "next/link";
import Container from "./container";
import { Button } from "@repo/ui/components/button";
import { ThemeSwitch } from "./theme-switch";
import { Zap } from "lucide-react";
import { Logo } from "./icons";

function Header() {
  return (
    <header className="bg-background/90 sticky top-0 z-50 border-b py-4 backdrop-blur-md">
      <Container>
        <nav className="flex justify-between">
          <Link
            href={"/"}
            className="text-xl font-bold tracking-tight flex items-center gap-1"
          >
            <Logo />
            <span>TILES.</span>
          </Link>
          <ul className="flex items-center gap-6 text-sm">
            <li>
              <Button size="sm" asChild className="group px-4">
                <Link href={"/app"}>
                  <Zap className="fill-background mr-2 size-4" />
                  <span>Get started</span>
                </Link>
              </Button>
            </li>
            <li>
              <ThemeSwitch />
            </li>
          </ul>
        </nav>
      </Container>
    </header>
  );
}

export default Header;
