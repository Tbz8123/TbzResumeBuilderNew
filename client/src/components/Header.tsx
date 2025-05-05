import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { ChevronDown, Menu, X, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_ITEMS } from "@/lib/constants";
import { motion } from "framer-motion";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleMouseEnter = (item: string) => {
    setActiveDropdown(item);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {NAV_ITEMS.map((item) => (
            <div 
              key={item.name}
              className="relative"
              onMouseEnter={() => handleMouseEnter(item.name)}
              onMouseLeave={handleMouseLeave}
            >
              <a 
                href={item.href}
                className="text-gray-700 hover:text-primary transition flex items-center py-2 font-medium"
              >
                {item.name}
                {item.dropdownItems && (
                  <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </a>
              
              {/* Dropdown Menu */}
              {item.dropdownItems && activeDropdown === item.name && (
                <motion.div 
                  className="absolute z-50 left-0 mt-2 w-64 bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="py-2">
                    {item.dropdownItems.map((dropdownItem) => (
                      <a
                        key={dropdownItem.name}
                        href={dropdownItem.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary hover:text-white transition"
                      >
                        {dropdownItem.name}
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </nav>

        {/* Account Button */}
        <div className="flex items-center space-x-4">
          <Button className="bg-primary hover:bg-primary-dark text-white font-medium rounded-full" asChild>
            <a href="#account">
              <User className="mr-2 h-4 w-4" />
              My Account
            </a>
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80%] sm:w-[350px]">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <Logo size="small" />
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex flex-col space-y-1">
                {NAV_ITEMS.map((item) => (
                  <div key={item.name} className="py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between font-medium text-lg"
                        >
                          {item.name}
                          {item.dropdownItems && (
                            <ChevronDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      {item.dropdownItems && (
                        <DropdownMenuContent className="w-full">
                          {item.dropdownItems.map((dropdownItem) => (
                            <DropdownMenuItem key={dropdownItem.name}>
                              <a
                                href={dropdownItem.href}
                                className="w-full"
                                onClick={() => setIsOpen(false)}
                              >
                                {dropdownItem.name}
                              </a>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      )}
                    </DropdownMenu>
                  </div>
                ))}
              </nav>
              <div className="mt-auto pt-6">
                <Button className="w-full bg-primary text-white" asChild>
                  <a href="#account">
                    <User className="mr-2 h-4 w-4" />
                    My Account
                  </a>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
