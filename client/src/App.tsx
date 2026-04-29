import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import Dashboard from "./pages/Dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/sponsoren" component={Dashboard} />
      <Route component={Dashboard} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen bg-background">
          <main className="container mx-auto py-8 px-4">
            <Router />
          </main>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}

// Minimal ThemeProvider for static version
function ThemeProvider({ children }: { children: React.ReactNode, defaultTheme?: string }) {
  return <>{children}</>;
}

export default App;
