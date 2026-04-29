import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Navigation } from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Seiten-Komponenten
function SponsorsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Sponsoren</h1>
      <Dashboard />
    </div>
  );
}

function RCBPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">RCB Informationen</h1>
      <div className="bg-card border rounded-lg p-6">
        <p className="text-muted-foreground">RCB-Seite - Inhalte folgen</p>
      </div>
    </div>
  );
}

function ManagementPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Management & Datenbank</h1>
      <Dashboard />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/sponsoren" component={SponsorsPage} />
      <Route path="/rcb" component={RCBPage} />
      <Route path="/management" component={ManagementPage} />
      <Route path="/" component={SponsorsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Navigation />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
