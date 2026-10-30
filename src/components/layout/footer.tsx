import Link from 'next/link';
import { StructuraLogo } from '@/components/brand/structura-logo';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'GitHub', href: 'https://github.com' },
    { label: 'Changelog', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-primary transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <StructuraLogo size="sm" showTagline={true} />
            </Link>
            <p className="text-xs text-txt-muted max-w-xs mt-2 leading-relaxed">
              AI-powered repository intelligence. Explore architecture, trace dependencies, and understand any codebase with confidence.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-txt-primary font-mono mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-xs text-txt-muted hover:text-txt-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-txt-muted">
            © {new Date().getFullYear()} Structura. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-xs text-txt-muted">
            <span>Colors: #3B82F6 • #8B5CF6 • #0F172A</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
