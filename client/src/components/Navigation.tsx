import { useHashLocation } from "wouter/use-hash-location";
import { Button } from "@/components/ui/button";
import { Users, Info, Settings } from "lucide-react";

export function Navigation() {
  const [location, setLocation] = useHashLocation();

  const isActive = (path: string) => location === path;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Heikki Piali</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isActive("/sponsoren") ? "default" : "ghost"}
            onClick={() => setLocation("/sponsoren")}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Sponsoren
          </Button>
          <Button
            variant={isActive("/rcb") ? "default" : "ghost"}
            onClick={() => setLocation("/rcb")}
            className="gap-2"
          >
            <Info className="h-4 w-4" />
            RCB
          </Button>
          <Button
            variant={isActive("/management") ? "default" : "ghost"}
            onClick={() => setLocation("/management")}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Management
          </Button>
        </div>
      </div>
    </nav>
  );
}
