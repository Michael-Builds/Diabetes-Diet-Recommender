import { Menu } from "lucide-react";
import { useState } from "react";
import Notifications from "../Notifications";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const Layout = ({ children }: any) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <div className="grid h-screen overflow-y-auto bg-[#f0f5f9]">
      {/* Desktop Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 p-3 hidden lg:!block">
        <Sidebar closeSidebar={() => setIsOpen(false)}/>
      </aside>

      {/* Mobile Drawer */}
      <div className={`lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setIsOpen(false)} />
      <aside className={`lg:hidden fixed top-0 left-0 h-screen w-64 p-3 z-50 transform transition-transform duration-200 ${isOpen ? "translate-x-0" : "-translate-x-full"}`} >
        <Sidebar closeSidebar={() => setIsOpen(false)} />
      </aside>


      {/* Right Drawer */}
      <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={toggleDrawer} />
      <aside className={`fixed top-0 -right-3 h-screen w-[18rem] lg:w-[25rem] z-50 transform transition-transform duration-200 ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="bg-white h-full p-4 ">
          <Notifications />
        </div>
      </aside>

      <header className="fixed  top-0 left-0 right-0 lg:left-64 p-3 z-30">
        <div className="relative ">
          <button className="absolute left-3 top-1/2 -translate-y-1/2 lg:hidden" onClick={() => setIsOpen(true)} >
            <Menu size={24} color={"gray"} />
          </button>
          <Topbar toggleDrawer={toggleDrawer} />
        </div>
      </header>

      <main className="mt-16 p-3 lg:ml-64">
        {children}
      </main>
    </div>
  );
};

export default Layout;