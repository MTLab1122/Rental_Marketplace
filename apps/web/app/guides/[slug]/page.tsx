import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EDITORIAL_GUIDES } from '../../../lib/seo-data';
import { constructMetadata, buildGuideTitle } from '../../../lib/seo';
import {
  generateBreadcrumbSchema,
  generateFaqSchema,
  generateArticleSchema,
} from '../../../lib/structured-data';
import JsonLd from '../../../components/JsonLd';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = EDITORIAL_GUIDES.find((g) => g.slug === slug);

  if (!guide) {
    return constructMetadata({
      title: 'Guide Not Found | RentPeshawar',
      noIndex: true,
    });
  }

  return constructMetadata({
    title: buildGuideTitle(guide.title),
    description: guide.directAnswer,
    canonical: `/guides/${guide.slug}`,
    type: 'article',
    publishedTime: guide.publishedDate,
    modifiedTime: guide.updatedDate,
    keywords: [
      guide.title,
      guide.category,
      'Peshawar rental advice',
      'tenant rights Peshawar',
      'hostel guide',
    ],
  });
}

export default async function EditorialGuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = EDITORIAL_GUIDES.find((g) => g.slug === slug);

  if (!guide) {
    notFound();
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Rental Guides', url: '/guides' },
    { name: guide.title, url: `/guides/${guide.slug}` },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const faqSchema = generateFaqSchema(guide.faqs);
  const articleSchema = generateArticleSchema({
    title: guide.title,
    description: guide.directAnswer,
    slug: guide.slug,
    datePublished: guide.publishedDate,
    dateModified: guide.updatedDate,
    authorName: guide.author,
  });

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={articleSchema} />

      {/* Semantic Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-navy-500 flex items-center gap-2 flex-wrap"
      >
        <Link href="/" className="hover:text-peshawar-600 transition">
          Home
        </Link>
        <span>/</span>
        <Link href="/guides" className="hover:text-peshawar-600 transition">
          Rental Guides
        </Link>
        <span>/</span>
        <span className="text-navy-900 font-semibold truncate max-w-sm">{guide.title}</span>
      </nav>

      {/* Article Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-m3-sm text-[11px] font-black uppercase tracking-wider bg-peshawar-50 text-peshawar-700 border border-peshawar-200">
            {guide.category}
          </span>
          <span className="text-xs text-navy-400 font-medium">
            {guide.readingTimeMinutes} min read
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-navy-950 leading-tight">
          {guide.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-navy-500 border-b border-navy-100 pb-4">
          <span>
            By <strong>{guide.author}</strong>
          </span>
          <span>•</span>
          <span>
            Updated:{' '}
            {new Date(guide.updatedDate).toLocaleDateString('en-PK', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </header>

      {/* AEO Direct-Answer Snippet Box */}
      <section
        aria-label="Direct Answer Summary"
        className="bg-peshawar-50 border-l-4 border-peshawar-600 p-6 rounded-r-m3-lg space-y-2 shadow-xs"
      >
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-peshawar-900">
          <span></span> Quick Answer (AEO Summary)
        </div>
        <p className="text-sm sm:text-base text-navy-900 leading-relaxed font-semibold">
          {guide.directAnswer}
        </p>
      </section>

      {/* Table of Contents */}
      {guide.tableOfContents && guide.tableOfContents.length > 0 && (
        <nav
          aria-label="Table of Contents"
          className="bg-navy-50 p-5 rounded-m3-lg border border-navy-100 space-y-3"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-navy-600">
            Table of Contents
          </div>
          <ul className="space-y-1.5 text-xs sm:text-sm">
            {guide.tableOfContents.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-peshawar-700 hover:text-peshawar-900 hover:underline transition font-medium"
                >
                  → {item.title}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#frequently-asked-questions"
                className="text-peshawar-700 hover:text-peshawar-900 hover:underline transition font-medium"
              >
                → Frequently Asked Questions
              </a>
            </li>
          </ul>
        </nav>
      )}

      {/* Main Content Sections */}
      <div className="space-y-8">
        {guide.sections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-3 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-navy-900">{section.heading}</h2>
            <p className="text-sm sm:text-base text-navy-700 leading-relaxed whitespace-pre-line">
              {section.content}
            </p>
          </section>
        ))}
      </div>

      {/* FAQ Section */}
      <section
        id="frequently-asked-questions"
        aria-labelledby="faq-title"
        className="bg-white p-6 sm:p-8 rounded-m3-lg border border-navy-100 shadow-sm space-y-4 scroll-mt-20"
      >
        <h2 id="faq-title" className="text-xl font-bold text-navy-900">
          Frequently Asked Questions
        </h2>
        <div className="divide-y divide-navy-100">
          {guide.faqs.map((faq, idx) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-navy-900">{faq.question}</h3>
              <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Internal Linking: Related Localities */}
      {guide.relatedLocalities && guide.relatedLocalities.length > 0 && (
        <section className="bg-navy-50 p-6 rounded-m3-lg border border-navy-100 space-y-3">
          <h3 className="text-sm font-bold text-navy-900">
            Relevant Peshawar Neighborhoods Mentioned in this Guide
          </h3>
          <div className="flex flex-wrap gap-2">
            {guide.relatedLocalities.map((locSlug) => (
              <Link
                key={locSlug}
                href={`/rentals/peshawar/${locSlug}`}
                className="px-3.5 py-1.5 bg-white hover:bg-navy-100 text-peshawar-700 rounded-m3-sm text-xs font-bold border border-navy-200 transition"
              >
                Browse Rentals in {locSlug.replace('-', ' ').toUpperCase()} →
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
