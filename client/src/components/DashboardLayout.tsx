import { useAuth } from "@/_core/hooks/useAuth";
import "../admin-login.css";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { Bell, ChevronDown, ChevronRight, LayoutDashboard, LogOut, PanelLeft, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

export type DashboardMenuItem = {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  children?: { label: string; path: string }[];
};

const defaultMenuItems: DashboardMenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Alumni Management", path: "/admin/alumni" },
];

export default function DashboardLayout({ children, menuItems = defaultMenuItems }: { children: React.ReactNode; menuItems?: DashboardMenuItem[] }) {
  const { loading, user } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="admin-signin"><aside className="admin-signin__identity"><div className="admin-signin__identity-top"><img src="/manus-storage/niter-official-logo_b5db41d0.jpg" alt="Official NITER logo"/><p><strong>NATIONAL INSTITUTE OF</strong><strong>TEXTILE ENGINEERING &amp;</strong><strong>RESEARCH</strong></p></div><div className="admin-signin__identity-copy"><span>NITER EEE ALUMNI</span><h1>Administrative<br/>Portal</h1><p>A secured workspace for preserving alumni records, managing opportunities, and stewarding the NITER EEE network.</p></div><small>DEPARTMENT OF ELECTRICAL &amp; ELECTRONIC ENGINEERING</small></aside><section className="admin-signin__card"><div className="admin-signin__seal"><ShieldCheck size={24}/></div><p className="admin-kicker">SECURE ADMINISTRATOR ACCESS</p><h2>Welcome back.</h2><p>Continue with your authorized Manus account to access the NITER EEE Alumni administration portal.</p><Button onClick={() => startLogin("/admin")} className="admin-signin__button">Continue securely</Button><div className="admin-signin__note"><span/>Your session stays active on this trusted browser.<span/></div><small>Super Administrators and Editors receive access based on their assigned role.</small></section></div>;

  return <SidebarProvider className="admin-dashboard-shell"><AdminDashboardFrame menuItems={menuItems}>{children}</AdminDashboardFrame></SidebarProvider>;
}

function AdminDashboardFrame({ children, menuItems }: { children: React.ReactNode; menuItems: DashboardMenuItem[] }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ "Alumni Management": true, "Batch Management": true, "District Management": true, "Job Management": true });
  const activeItem = useMemo(() => menuItems.flatMap(item => [{ label: item.label, path: item.path }, ...(item.children ?? [])]).find(item => location === item.path) ?? menuItems.find(item => location.startsWith(item.path)), [location, menuItems]);
  const isAdmin = user?.role === "admin";

  return <>
    <Sidebar collapsible="icon" className="admin-sidebar border-r-0">
      <SidebarHeader className="admin-sidebar__brand">
        <button className="admin-brand" onClick={() => setLocation("/admin")} aria-label="Open admin dashboard">
          <img src="/manus-storage/niter-official-logo_b5db41d0.jpg" alt="NITER logo" />
          <span><strong>NITER EEE</strong><small>ALUMNI ADMIN</small></span>
        </button>
      </SidebarHeader>
      <SidebarContent className="admin-sidebar__content">
        <p className="admin-sidebar__label">MANAGEMENT</p>
        <SidebarMenu className="admin-sidebar__menu">
          {menuItems.map(item => {
            const active = location === item.path || location.startsWith(`${item.path}/`);
            const expanded = openGroups[item.label] ?? active;
            if (!item.children?.length) return <SidebarMenuItem key={item.label}><SidebarMenuButton isActive={active} onClick={() => setLocation(item.path)} tooltip={item.label} className="admin-nav-button"><item.icon /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>;
            return <SidebarMenuItem key={item.label} className="admin-nav-cluster">
              <SidebarMenuButton isActive={active} onClick={() => { setOpenGroups(current => ({ ...current, [item.label]: !expanded })); setLocation(item.path); }} tooltip={item.label} className="admin-nav-button"><item.icon /><span>{item.label}</span>{expanded ? <ChevronDown className="admin-nav-chevron" /> : <ChevronRight className="admin-nav-chevron" />}</SidebarMenuButton>
              {expanded && <div className="admin-nav-submenu">{item.children.map(child => <button key={child.label} className={location === child.path ? "is-active" : ""} onClick={() => setLocation(child.path)}>{child.label}</button>)}</div>}
            </SidebarMenuItem>;
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="admin-sidebar__footer">
        <div className="admin-role-note"><ShieldCheck size={15} /><span>SECURED<br />WORKSPACE</span></div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button className="admin-profile-trigger"><Avatar><AvatarFallback>{user?.name?.slice(0, 1).toUpperCase() || "A"}</AvatarFallback></Avatar><span><strong>{user?.name || "Admin"}</strong><small>{isAdmin ? "Super Administrator" : "Editor"}</small></span><ChevronDown size={15} /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="admin-profile-menu"><DropdownMenuItem onClick={() => logout()}><LogOut size={15} />Sign out</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset className="admin-dashboard-inset">
      <header className="admin-topbar">
        <div className="admin-topbar__left"><SidebarTrigger className="admin-sidebar-toggle"><PanelLeft size={18} /></SidebarTrigger><div><p>ADMINISTRATION / {activeItem?.label?.toUpperCase() || "DASHBOARD"}</p><strong>{activeItem?.label || "Dashboard"}</strong></div></div>
        <div className="admin-topbar__right"><button className="admin-notification" aria-label="Notifications"><Bell size={18} /><i /></button><DropdownMenu><DropdownMenuTrigger asChild><button className="admin-avatar-summary"><Avatar><AvatarFallback>{user?.name?.slice(0, 1).toUpperCase() || "A"}</AvatarFallback></Avatar><span><strong>{user?.name || "Admin"}</strong><small>{isAdmin ? "Super Administrator" : "Editor"}</small></span><ChevronDown size={15} /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="admin-profile-menu"><DropdownMenuItem onClick={() => logout()}><LogOut size={15} />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
      </header>
      <main className="admin-main">{children}</main>
    </SidebarInset>
  </>;
}
