import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PrayerProvider } from "@/context/PrayerContext";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/Home";
import Qibla from "@/pages/Qibla";
import Admin from "@/pages/Admin";
import TVHome from "@/pages/TVHome";
import MonthlyCalendar from "@/pages/MonthlyCalendar";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tv" component={TVHome} />
      <Route path="/qibla" component={Qibla} />
      <Route path="/monthly" component={MonthlyCalendar} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PrayerProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </PrayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
