import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminProvider } from "./contexts/AdminContext";
import { CartProvider } from "./contexts/CartContext";
import { Router, Route, Switch } from "wouter";
import Index from "./pages/Index";
import Game from "./pages/Game";
import Catalog from "./pages/Catalog";
import Admin from "./pages/Admin";
import Tickets from "./pages/Tickets";
import PurchasePolicy from "./pages/PurchasePolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AdminProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Switch>
              <Route path="/" component={Index} />
              <Route path="/game/:gameId" component={Game} />
              <Route path="/game/:gameId/category/:categoryId" component={Catalog} />
              <Route path="/admin" component={Admin} />
              <Route path="/tickets" component={Tickets} />
              <Route path="/purchase-policy" component={PurchasePolicy} />
              <Route path="/terms-of-service" component={TermsOfService} />
              <Route component={NotFound} />
            </Switch>
          </Router>
        </TooltipProvider>
      </CartProvider>
    </AdminProvider>
  </QueryClientProvider>
);

export default App;
