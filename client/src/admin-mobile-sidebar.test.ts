import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./admin-mobile-sidebar.css", import.meta.url), "utf8");
const sidebarComponent = readFileSync(new URL("./components/ui/sidebar.tsx", import.meta.url), "utf8");

describe("mobile Admin sidebar layering", () => {
  it("keeps the mobile sheet sidebar opaque and above its separate backdrop", () => {
    expect(styles).toContain('@media (max-width: 767px)');
    expect(styles).toContain('.admin-sidebar[data-mobile="true"]');
    expect(styles).toContain('z-index: 70 !important');
    expect(styles).toContain('opacity: 1 !important');
    expect(styles).toContain('background-color: #061d36 !important');
    expect(styles).toContain('filter: none !important');
    expect(styles).toContain('backdrop-filter: none !important');
    expect(styles).toContain('body:has(.admin-dashboard-shell) [data-slot="sheet-overlay"]');
    expect(styles).toContain('z-index: 60 !important');
    expect(styles).toContain('display: none');
    expect(sidebarComponent).toContain('className={cn("bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden", className)}');
  });
});
