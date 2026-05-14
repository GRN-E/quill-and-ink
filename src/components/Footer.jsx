import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Github, Mail } from 'lucide-react';
import Logo from './Logo';

const PRODUCT_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
];

const LEGAL_LINKS = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/contact', label: 'Contact' },
];

const RESOURCE_LINKS = [
  { to: '/docs', label: 'Documentation' },
  { to: '/examples', label: 'Examples' },
  { to: '/changelog', label: 'Changelog' },
];

const SOCIALS = [
  { href: 'https://twitter.com', label: 'Twitter', Icon: Twitter },
  { href: 'https://instagram.com', label: 'Instagram', Icon: Instagram },
  { href: 'https://github.com', label: 'GitHub', Icon: Github },
  { href: 'mailto:hello@inkly.tech', label: 'Email', Icon: Mail },
];

function SocialIcon(props) {
  const external = props.href.startsWith('http');
  const iconElement = React.createElement(props.Icon, { size: 16 });
  return React.createElement(
    'a',
    {
      href: props.href,
      'aria-label': props.label,
      target: external ? '_blank' : undefined,
      rel: external ? 'noopener noreferrer' : undefined,
      className:
        'w-9 h-9 inline-flex items-center justify-center rounded-md text-ink-500 hover:text-ink-950 hover:bg-white hover:shadow-subtle transition-base',
    },
    iconElement
  );
}

function LinkColumn(props) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-ink-950 uppercase tracking-wider mb-4">
        {props.title}
      </h3>
      <ul className="space-y-3">
        {props.links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-sm text-ink-600 hover:text-ink-950 transition-base"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink-50 border-t border-ink-200 mt-24">
      <div className="container-prose py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          <div className="col-span-2 max-w-sm">
            <Logo size="md" />
            <p className="mt-4 text-sm text-ink-600 leading-relaxed">
              Turn your handwriting into a beautiful font.
              Draw your alphabet, save it forever, and write
              anywhere in your own hand.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map((social) => (
                <SocialIcon
                  key={social.label}
                  href={social.href}
                  label={social.label}
                  Icon={social.Icon}
                />
              ))}
            </div>
          </div>

          <LinkColumn title="Product" links={PRODUCT_LINKS} />
          <LinkColumn title="Resources" links={RESOURCE_LINKS} />
          <LinkColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-12 pt-8 border-t border-ink-200 flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center justify-between">
          <p className="text-xs text-ink-500">
            © {year} Inkly. Made with care in Ulaanbaatar.
          </p>
          <p className="text-xs text-ink-500">
            Your handwriting, your font, your words.
          </p>
        </div>
      </div>
    </footer>
  );
}
