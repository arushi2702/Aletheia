import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-700">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                BiasLab
              </span>
            </div>
            <p className="max-w-md">
              Advanced AI-powered platform for detecting bias and deepfakes in digital media. 
              Helping you navigate the modern information landscape with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Platform</h4>
            <nav className="space-y-2">
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Article Analysis
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Image Verification
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Video Scanning
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                API Access
              </a>
            </nav>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Company</h4>
            <nav className="space-y-2">
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                About Us
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Research
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 BiasLab. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Privacy
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Terms
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
