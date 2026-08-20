import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, ChevronDown, ChevronRight, LayoutDashboard, LogOut, PanelLeft, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { NITER_OFFICIAL_LOGO_URL } from "@/lib/publicImages";

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

export default function DashboardLayout({ children, menuItems = defaultMenuItems, adminName = "Administrator", onSignOut }: { children: React.ReactNode; menuItems?: DashboardMenuItem[]; adminName?: string; onSignOut?: () => void }) {
  return <SidebarProvider className="admin-dashboard-shell"><AdminDashboardFrame menuItems={menuItems} adminName={adminName} onSignOut={onSignOut}>{children}</AdminDashboardFrame></SidebarProvider>;
}

function AdminDashboardFrame({ children, menuItems, adminName, onSignOut }: { children: React.ReactNode; menuItems: DashboardMenuItem[]; adminName: string; onSignOut?: () => void }) {
  const [location, setLocation] = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ "Alumni Management": true, "Batch Management": true, "District Management": true, "Job Management": true });
  const activeItem = useMemo(() => menuItems.flatMap(item => [{ label: item.label, path: item.path }, ...(item.children ?? [])]).find(item => location === item.path) ?? menuItems.find(item => location.startsWith(item.path)), [location, menuItems]);

  return <>
    <Sidebar collapsible="icon" className="admin-sidebar border-r-0">
      <SidebarHeader className="admin-sidebar__brand">
        <button className="admin-brand" onClick={() => setLocation("/admin")} aria-label="Open admin dashboard">
          <img src={NITER_OFFICIAL_LOGO_URL} alt="NITER logo" />
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
        <div className="admin-role-note"><ShieldCheck size={15} /><span>SECURE<br />ACCESS</span></div>
        <button className="admin-profile-trigger" onClick={onSignOut} aria-label="Sign out from administrator access"><Avatar><AvatarFallback>{adminName.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><span><strong>{adminName}</strong><small>Sign out</small></span><LogOut size={14} /></button>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset className="admin-dashboard-inset">
      <header className="admin-topbar">
        <div className="admin-topbar__left"><SidebarTrigger className="admin-sidebar-toggle"><PanelLeft size={18} /></SidebarTrigger><div><p>ADMINISTRATION / {activeItem?.label?.toUpperCase() || "DASHBOARD"}</p><strong>{activeItem?.label || "Dashboard"}</strong></div></div>
        <div className="admin-topbar__right"><button className="admin-notification" aria-label="Notifications"><Bell size={18} /><i /></button><div className="admin-avatar-summary"><Avatar><AvatarFallback>{adminName.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><span><strong>{adminName}</strong><small>Secure access</small></span></div></div>
      </header>
      <main className="admin-main">{children}</main>
    </SidebarInset>
  </>;
}
