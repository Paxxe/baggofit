import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Lightbulb } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductMatches } from "@/components/product-matches";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { guides, type TravelGuide } from "@/lib/data/guides";
import { getMessages, locales } from "@/lib/i18n";

export const instant = false;

export function generateStaticParams() {
  return guides.map(({ slug }) => ({ slug }));
}

type Lang = "en" | "it";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** ~220 words per minute over headings, paragraphs, lists, tips, tables and FAQ. */
function readingMinutes(guide: TravelGuide, language: Lang) {
  const text = [
    ...guide.sections[language].flatMap((section) => [section.heading, ...section.paragraphs, ...(section.list ?? []), section.tip ?? "", ...(section.table?.rows.flat() ?? [])]),
    ...(guide.faq?.[language].flatMap((item) => [item.question, item.answer]) ?? []),
  ].join(" ");
  return Math.max(1, Math.round(text.split(/\s+/).length / 220));
}

const formatDate = (iso: string, language: Lang) => new Intl.DateTimeFormat(language === "it" ? "it-IT" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  const guide = guides.find((item) => item.slug === slug);
  if (!guide) notFound();
  const language = locale as Lang;
  return {
    title: guide.title[language],
    description: guide.description[language],
    alternates: { canonical: `/${locale}/guides/${slug}`, languages: { en: `/en/guides/${slug}`, it: `/it/guides/${slug}` } },
    openGraph: { type: "article", title: guide.title[language], description: guide.description[language], publishedTime: guide.published, modifiedTime: guide.updated ?? guide.published },
  };
}

export default async function GuideDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  const guide = guides.find((item) => item.slug === slug);
  if (!guide) notFound();
  const messages = getMessages(locale);
  const language = locale as Lang;
  const italian = language === "it";
  const url = `${siteUrl}/${locale}/guides/${slug}`;

  // Structured data: the article, its FAQ (rich results) and the breadcrumb trail.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title[language],
      description: guide.description[language],
      inLanguage: language,
      mainEntityOfPage: url,
      ...(guide.published ? { datePublished: guide.published, dateModified: guide.updated ?? guide.published } : {}),
      author: { "@type": "Organization", name: "Baggofit" },
      publisher: { "@type": "Organization", name: "Baggofit" },
    },
    ...(guide.faq
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: guide.faq[language].map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
        }]
      : []),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Baggofit", item: `${siteUrl}/${locale}` },
        { "@type": "ListItem", position: 2, name: italian ? "Guide" : "Guides", item: `${siteUrl}/${locale}/guides` },
        { "@type": "ListItem", position: 3, name: guide.title[language], item: url },
      ],
    },
  ];

  return <>
    <SiteHeader locale={language} messages={messages} switchPath={`/guides/${slug}`} />
    <main className="content-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link className="back-home" href={`/${locale}/guides`}><ArrowLeft size={15} />{italian ? "Tutte le guide" : "All guides"}</Link>
      <article className="guide-article">
        <p className="eyebrow" style={{ marginTop: 26 }}><span className="eyebrow-line" />{guide.category?.[language] ?? (italian ? "Guida Baggofit" : "Baggofit guide")}</p>
        <h1>{guide.title[language]}</h1>
        <p className="content-lede">{guide.description[language]}</p>
        <p className="guide-meta">
          {guide.updated && <span><CalendarDays size={15} />{italian ? "Aggiornato il" : "Updated"} {formatDate(guide.updated, language)}</span>}
          <span><Clock size={15} />{readingMinutes(guide, language)} {italian ? "min di lettura" : "min read"}</span>
        </p>

        {guide.sections[language].map((section) => <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.list && <ul>{section.list.map((item) => <li key={item}>{item}</li>)}</ul>}
          {section.table && <div className="guide-table"><table>
            <thead><tr>{section.table.head.map((cell) => <th key={cell} scope="col">{cell}</th>)}</tr></thead>
            <tbody>{section.table.rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th key={cell} scope="row">{cell}</th> : <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table></div>}
          {section.tip && <aside className="guide-tip"><Lightbulb size={18} /><p>{section.tip}</p></aside>}
          {section.productPicks && guide.products && <div className="guide-products">
            <ProductMatches locale={language} criteria={guide.products.criteria} heading={guide.products.heading[language]} lead={guide.products.intro[language]} listName={`guide_${slug}`} />
          </div>}
        </section>)}

        {guide.faq && <section className="guide-faq">
          <h2>{italian ? "Domande frequenti" : "Frequently asked questions"}</h2>
          {guide.faq[language].map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}
        </section>}

        {guide.cta && <div className="guide-cta">
          <p>{guide.cta.text[language]}</p>
          <Link className="button button-primary" href={`/${locale}${guide.cta.href}`} data-track="cta_click" data-track-location={`guide_${slug}`} data-track-target={guide.cta.href}>{guide.cta.label[language]}<ArrowRight size={16} /></Link>
        </div>}
      </article>
    </main>
    <SiteFooter locale={language} messages={messages} />
  </>;
}
