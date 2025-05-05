import { Link } from "wouter";
import Logo from "@/components/Logo";
import { 
  FacebookIcon, 
  TwitterIcon, 
  InstagramIcon, 
  LinkedinIcon 
} from "lucide-react";
import { BRAND } from "@/lib/constants";

const Footer = () => {
  const productLinks = [
    { name: "Resume Builder", href: "#resume-builder" },
    { name: "Cover Letter Builder", href: "#cover-letter" },
    { name: "Resume Templates", href: "#templates" },
    { name: "Resume Examples", href: "#examples" },
    { name: "Pricing", href: "#pricing" },
  ];

  const resourceLinks = [
    { name: "Resume Writing Tips", href: "#writing-tips" },
    { name: "Career Advice", href: "#career-advice" },
    { name: "Interview Preparation", href: "#interview-prep" },
    { name: "Job Search Guide", href: "#job-search" },
    { name: "Blog", href: "#blog" },
  ];

  const companyLinks = [
    { name: "About Us", href: "#about" },
    { name: "Contact", href: "#contact" },
    { name: "Help Center", href: "#help" },
    { name: "Privacy Policy", href: "#privacy" },
    { name: "Terms of Service", href: "#terms" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-400 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Logo & About */}
          <div>
            <div className="mb-4">
              <Logo />
            </div>
            <p className="mb-4">
              {BRAND.description}
            </p>
            <div className="flex space-x-4">
              <a href={BRAND.social.facebook} className="text-gray-400 hover:text-white transition">
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a href={BRAND.social.twitter} className="text-gray-400 hover:text-white transition">
                <TwitterIcon className="w-5 h-5" />
              </a>
              <a href={BRAND.social.instagram} className="text-gray-400 hover:text-white transition">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href={BRAND.social.linkedin} className="text-gray-400 hover:text-white transition">
                <LinkedinIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="text-white font-bold mb-4 text-lg">Product</h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-white transition">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="text-white font-bold mb-4 text-lg">Resources</h3>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-white transition">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h3 className="text-white font-bold mb-4 text-lg">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-white transition">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center">
          <p>&copy; {new Date().getFullYear()} {BRAND.fullName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
