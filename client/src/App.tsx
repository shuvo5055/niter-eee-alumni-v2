/** Official NITER identity: the global shell keeps the provided NITER logo and purple institutional chrome consistent on every public route. */
import "./archive-refinement.css";
import "./official-brand.css";
import "./official-brand-accessibility.css";
import "./thesis-library-header.css";
import "./thesis-mobile-identity.css";
import "./thesis-navigation-left.css";
import "./thesis-separate-menu-bar.css";
import "./homepage-mobile.css";
import "./niter-logo-blend.css";
import "./desktop-consistent-mobile.css";
import "./mobile-layout-repair.css";
import "./header-footer-refinement.css";
import "./admin.css";
import "./admin-institutional-refinement.css";
import "./admin-mobile-alumni.css";
import "./admin-login.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import SiteShell from "./components/SiteShell";
import Home from "./pages/Home";
import Alumni from "./pages/Alumni";
import Batches from "./pages/Batches";
import BatchDetail from "./pages/BatchDetail";
import Districts from "./pages/Districts";
import DistrictDetail from "./pages/DistrictDetail";
import Jobs from "./pages/Jobs";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";

function PublicRouter() {
  return <SiteShell><Switch><Route path="/" component={Home}/><Route path="/alumni" component={Alumni}/><Route path="/alumni/:slug" component={Profile}/><Route path="/batches" component={Batches}/><Route path="/batches/:batch" component={BatchDetail}/><Route path="/districts" component={Districts}/><Route path="/districts/:district" component={DistrictDetail}/><Route path="/jobs" component={Jobs}/><Route path="/gallery" component={Gallery}/><Route path="/about" component={About}/><Route path="/contact" component={Contact}/><Route component={NotFound}/></Switch></SiteShell>;
}

function Router() {
  return <Switch><Route path="/admin/login" component={AdminLogin}/><Route path="/admin" component={Admin}/><Route path="/admin/:section" component={Admin}/><Route component={PublicRouter}/></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster/><Router/></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
