import { User, Image as ImageIcon, Wallet } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: User, label: "Home" },
    { href: "/gallery", icon: ImageIcon, label: "Gallery" },
    { href: "/profile", icon: Wallet, label: "Mint" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-background/80 backdrop-blur-lg border-t border-white/5">
      <div className="flex items-center justify-around max-w-md mx-auto bg-card/50 rounded-full border border-white/10 p-1 shadow-lg backdrop-blur-md">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-20 h-14 rounded-full transition-all duration-300 cursor-pointer",
                  isActive
                    ? "text-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 mb-1 transition-transform duration-300",
                    isActive ? "scale-110" : "scale-100"
                  )}
                />
                <span className="text-[10px] font-tech font-bold uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
