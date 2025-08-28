import { Button } from "@/components/ui/button";
import { FileText, Image, Video } from "lucide-react";

interface HeroSectionProps {
  scrollToSection: (id: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ scrollToSection }) => {
  return (
    <section className="bg-gradient-hero py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Detect Bias and{" "}
              <span className="bg-gradient-brand bg-clip-text text-transparent">
                Deepfakes
              </span>{" "}
              with Clarity
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              Paste an article link, upload an image, or scan a video. Get highlights, 
              explanations, and a neutral rewrite in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="btn-secondary-outline group"
                onClick={() => scrollToSection("article-analysis")}
              >
                <FileText className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Analyze Article
              </Button>
              <Button
                className="btn-secondary-outline group"
                onClick={() => scrollToSection("image-analysis")}
              >
                <Image className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Check Image
              </Button>
              <Button
                className="btn-secondary-outline group"
                onClick={() => scrollToSection("video-analysis")}
              >
                <Video className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Scan Video
              </Button>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?cs=srgb&dl=pexels-tara-winstead-8386440.jpg&fm=jpg"
              alt="AI Media Bias Detection"
              className="w-full h-auto rounded-2xl shadow-brand"
            />
            <div className="absolute -inset-4 bg-gradient-brand opacity-20 rounded-3xl blur-xl -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
