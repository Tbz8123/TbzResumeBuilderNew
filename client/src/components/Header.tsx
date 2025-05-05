import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Templates", href: "#templates" },
    { name: "Resume Builder", href: "#resume-builder" },
    { name: "Cover Letter", href: "#cover-letter" },
    { name: "Blog", href: "#blog" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <a className="flex items-center">
            <Logo />
          </a>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <a 
              key={item.name}
              href={item.href}
              className="text-gray-dark hover:text-primary transition font-medium"
            >
              {item.name}
            </a>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center space-x-4">
          <a href="#login" className="hidden md:block text-gray-dark hover:text-primary transition font-medium">
            Login
          </a>
          <Button asChild>
            <a href="#get-started">Get Started</a>
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
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <a 
                    key={item.name}
                    href={item.href}
                    className="text-lg font-medium hover:text-primary transition"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
                <a 
                  href="#login" 
                  className="text-lg font-medium hover:text-primary transition"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </a>
              </nav>
              <div className="mt-auto pt-6">
                <Button className="w-full" asChild>
                  <a href="#get-started">Get Started</a>
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
