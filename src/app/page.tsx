import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/landing/hero';
import { ProblemSection } from '@/components/landing/problem-section';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { ProductPreview } from '@/components/landing/product-preview';
import { CTASection } from '@/components/landing/cta-section';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <ProblemSection />
      <Features />
      <HowItWorks />
      <ProductPreview />
      <CTASection />
      <Footer />
    </main>
  );
}
