import { Link } from "wouter";
import Logo from "@/components/Logo";
import { 
  FacebookIcon, 
  TwitterIcon, 
  InstagramIcon, 
  LinkedinIcon 
} from "lucide-react";

const Footer = () => {
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
              Professional resume and cover letter builder to help you land your dream job.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <TwitterIcon className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <LinkedinIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="text-white font-bold mb-4 text-lg">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">Resume Builder</a></li>
              <li><a href="#" className="hover:text-white transition">Cover Letter Builder</a></li>
              <li><a href="#" className="hover:text-white transition">Resume Templates</a></li>
              <li><a href="#" className="hover:text-white transition">Resume Examples</a></li>
              <li><a href="#" className="hover:text-white transition">Pricing</a></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="text-white font-bold mb-4 text-lg">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">Resume Writing Tips</a></li>
              <li><a href="#" className="hover:text-white transition">Career Advice</a></li>
              <li><a href="#" className="hover:text-white transition">Interview Preparation</a></li>
              <li><a href="#" className="hover:text-white transition">Job Search Guide</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h3 className="text-white font-bold mb-4 text-lg">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">About Us</a></li>
              <li><a href="#" className="hover:text-white transition">Contact</a></li>
              <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center">
          <p>&copy; {new Date().getFullYear()} TbzResumeBuilder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
