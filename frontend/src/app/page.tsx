import Navigation from "@/components/Navigation";
import MinifigGallery from "@/components/Gallery/MinifigGallery";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/background_img.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-purple-900/70 to-gray-900/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600/90 via-purple-600/80 to-red-600/70 text-white backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <Image
                  src="/figbit_logo.png"
                  alt="Figbit Logo"
                  width={120}
                  height={120}
                  className="w-20 h-20 md:w-30 md:h-30 drop-shadow-lg"
                />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
                Build Your Dream
                <br />
                <span className="text-yellow-300">LEGO Minifig</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 drop-shadow-md">
                Discover, customize, and create amazing LEGO minifigures
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/builder"
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-8 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Cross-Minifig Builder
                </Link>
                <Link
                  href="#gallery"
                  className="bg-white/20 backdrop-blur-sm border-2 border-white hover:bg-white hover:text-gray-900 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300"
                >
                  Browse Gallery
                </Link>
                <Link
                  href="/signup"
                  className="bg-white/20 backdrop-blur-sm border-2 border-white hover:bg-white hover:text-gray-900 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300"
                >
                  Sign Up Free
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div id="gallery" className="bg-white/95 backdrop-blur-sm">
          <MinifigGallery />
        </div>
      </div>
    </div>
  );
}
