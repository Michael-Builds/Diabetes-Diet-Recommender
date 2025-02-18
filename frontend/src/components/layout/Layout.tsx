import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Menu } from "lucide-react";

const Layout = ({ children }: any) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="grid h-screen overflow-y-auto bg-[#f0f5f9]">
      {/* Desktop Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 p-3 hidden lg:!block">
        <Sidebar />
      </aside>

      {/* Mobile Drawer */}
      <div className={`lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setIsOpen(false)} />
      <aside className={`lg:hidden fixed top-0 left-0 h-screen w-64 p-3 z-50 transform transition-transform duration-200 ${isOpen ? "translate-x-0" : "-translate-x-full"}`} >
        <Sidebar />
      </aside>

      <header className="fixed top-0 left-0 right-0 lg:left-64 p-3 z-30">
        <div className="relative">
          <button className="absolute left-3 top-1/2 -translate-y-1/2 lg:hidden" onClick={() => setIsOpen(true)} >
            <Menu size={24} />
          </button>
          <Topbar />
        </div>
      </header>

      <main className="mt-16 p-3 lg:ml-64">
        {children}
      </main>
    </div>
  );
};

export default Layout;