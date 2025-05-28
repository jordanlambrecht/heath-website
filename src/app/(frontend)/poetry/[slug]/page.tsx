// src/app/(frontend)/poetry/[slug]/page.tsx

import type { Metadata } from 'next'
import { cache, Fragment } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Poem as PoemType, Media as MediaType } from '@/payload-types'
import RichText from '@/components/RichText'
import Link from 'next/link'
import Image from 'next/image'
import { formatRelativeDate } from '@/utilities/formatDate'
import Spoiler from '@/components/Spoiler'

type PoemPageProps = {
  params: Promise<{ slug: string }>
}

// Cache individual poem data
const queryPoemBySlug = cache(async (slug: string) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  try {
    const result = await payload.find({
      collection: 'poems',
      where: {
        slug: {
          equals: slug,
        },
      },
      depth: 1,
      draft,
      limit: 1,
      pagination: false,
      overrideAccess: draft,
    })
    return result.docs?.[0] || null
  } catch (error) {
    console.error(`Error fetching poem with slug ${slug}:`, error)
    return null
  }
})

const queryAllPublishedPoemsForNav = cache(async () => {
  const payload = await getPayload({ config: configPromise })
  try {
    const poems = await payload.find({
      collection: 'poems',
      depth: 0,
      limit: 0,
      sort: 'title',
      where: {
        _status: {
          equals: 'published',
        },
      },
      overrideAccess: false,
      select: {
        id: true,
        title: true,
        slug: true,
      },
    })
    return poems.docs
  } catch (error) {
    console.error('Error fetching all published poems for navigation:', error)
    return []
  }
})

export default async function PoemPage({ params: paramsPromise }: PoemPageProps) {
  const { slug } = await paramsPromise
  const poem: PoemType | null = await queryPoemBySlug(slug)
  const allPublishedPoems = await queryAllPublishedPoemsForNav()

  if (!poem) {
    return notFound()
  }

  let currentIndex = -1
  if (allPublishedPoems && allPublishedPoems.length > 0) {
    currentIndex = allPublishedPoems.findIndex((p) => p.slug === slug)
  }

  const prevPoem = currentIndex > 0 ? allPublishedPoems[currentIndex - 1] : null
  const nextPoem =
    currentIndex !== -1 && currentIndex < allPublishedPoems.length - 1
      ? allPublishedPoems[currentIndex + 1]
      : null

  const heroImage = poem.heroImage as MediaType | undefined
  const descriptionEnabled =
    poem.description?.enableDescription && poem.description?.displayDescription
  const analysisEnabled = poem.analysis?.enable && poem.analysis?.display?.displayAnalysis

  const DescriptionSection = () => (
    <>
      {descriptionEnabled && poem.description?.description && (
        <div className="text-text max-w-none my-6 p-4 bg-background rounded-md border border-gray-200 dark:border-slate-700">
          <p className="text-sm italic">{poem.description.description}</p>
        </div>
      )}
    </>
  )

  const AnalysisSection = () => (
    <>
      {analysisEnabled && poem.analysis?.analysisText && (
        <div className="my-8">
          {poem.analysis?.display?.treatAsSpoiler ? (
            <Spoiler buttonText={poem.analysis.analysisTitle || 'Analysis'}>
              {poem.analysis?.display?.displayTitle && poem.analysis.analysisTitle && (
                <h3 className="text-xl font-semibold mb-2 text-accent">
                  {poem.analysis.analysisTitle}
                </h3>
              )}
              <RichText data={poem.analysis.analysisText} />
            </Spoiler>
          ) : (
            <div className="p-4 bg-background rounded-md border border-gray-200 dark:border-slate-700">
              {poem.analysis?.display?.displayTitle && poem.analysis.analysisTitle && (
                <h3 className="text-xl font-semibold mb-3 text-accent">
                  {poem.analysis.analysisTitle}
                </h3>
              )}
              <RichText data={poem.analysis.analysisText} />
            </div>
          )}
        </div>
      )}
    </>
  )

  return (
    <div className="md:ml-24 md:max-w-3xl container">
      {' '}
      <article className="bg-softer rounded-xl py-8 px-6 text-text border-2 border-foreground">
        {heroImage?.url && (
          <div className="mb-6 rounded-lg overflow-hidden aspect-video relative">
            <Image
              src={heroImage.url}
              alt={heroImage.alt || poem.title || 'Poem hero image'}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
            />
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">{poem.title}</h1>

        <div className="mb-4 text-sm text-text/80 space-x-2">
          {poem.publishedAt && (
            <span className="inline-block rounded bg-background py-1 px-2 my-1 ">
              Written {formatRelativeDate(poem.publishedAt)}
            </span>
          )}
          {poem.categories && poem.categories.length > 0 && (
            <span className="inline-block rounded bg-background py-1 px-2 my-1">
              Categories:{' '}
              {poem.categories.map((cat, index) => (
                <Fragment key={typeof cat === 'object' ? cat.id : cat}>
                  {typeof cat === 'object' && cat.title ? (
                    // Assuming you might want to link categories later
                    // <Link href={`/poetry/category/${cat.slug}`} className="hover:text-primary">{cat.title}</Link>
                    <span className="font-medium">{cat.title}</span>
                  ) : null}
                  {index < (poem.categories?.length || 0) - 1 && ', '}
                </Fragment>
              ))}
            </span>
          )}
        </div>

        {descriptionEnabled && poem.description?.descriptionLocation === 'top' && (
          <DescriptionSection />
        )}
        {analysisEnabled && poem.analysis?.display?.analysisLocation === 'top' && (
          <AnalysisSection />
        )}

        {poem.content && <RichText data={poem.content} enableProse />}

        {descriptionEnabled && poem.description?.descriptionLocation === 'bottom' && (
          <DescriptionSection />
        )}
        {analysisEnabled && poem.analysis?.display?.analysisLocation === 'bottom' && (
          <AnalysisSection />
        )}
      </article>
      {(prevPoem || nextPoem) && (
        <nav className="mt-12 flex justify-between items-center border-t border-gray-200 dark:border-slate-700 pt-6 pb-8">
          <div>
            {prevPoem && (
              <Link href={`/poetry/${prevPoem.slug}`}>
                <div className="text-secondary hover:text-primary transition-colors duration-200 ease-in-out group">
                  <span className="inline-block transition-transform group-hover:-translate-x-1 motion-reduce:transform-none">
                    &larr;
                  </span>{' '}
                  <span className="inline-block">Previous</span>
                  <span className="block text-xs text-text/70 group-hover:text-primary/90 truncate max-w-xs">
                    {prevPoem.title}
                  </span>
                </div>
              </Link>
            )}
          </div>
          <div>
            {nextPoem && (
              <Link href={`/poetry/${nextPoem.slug}`}>
                <div className="text-secondary hover:text-primary transition-colors duration-200 ease-in-out group text-right">
                  <span> Next </span>
                  <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                    &rarr;
                  </span>
                  <span className="block text-xs text-text/70 group-hover:text-primary/90 truncate max-w-xs">
                    {nextPoem.title}
                  </span>
                </div>
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}

export async function generateMetadata({
  params: paramsPromise,
}: PoemPageProps): Promise<Metadata> {
  const { slug } = await paramsPromise
  const poem: PoemType | null = await queryPoemBySlug(slug)

  if (!poem) {
    return {
      title: 'Poem Not Found',
      description: 'The requested poem could not be found.',
    }
  }

  const metaTitle = poem.meta?.title || poem.title
  const metaDescription =
    poem.meta?.description ||
    (poem.description?.enableDescription ? poem.description.description : undefined)
  const heroImage = poem.heroImage as MediaType | undefined
  const metaImage = poem.meta?.image as MediaType | undefined
  const ogImage =
    metaImage?.sizes?.og?.url || metaImage?.url || heroImage?.sizes?.og?.url || heroImage?.url

  // Construct a base URL for absolute image paths
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  return {
    title: `${metaTitle} | Poetry`,
    description: metaDescription,
    openGraph: {
      title: metaTitle || undefined,
      description: metaDescription || undefined,
      url: `${siteUrl}/poetry/${poem.slug}`,
      images: ogImage
        ? [
            {
              url: `${siteUrl}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`, //  absolute URL
              width:
                metaImage?.sizes?.og?.width ||
                metaImage?.width ||
                heroImage?.sizes?.og?.width ||
                1200,
              height:
                metaImage?.sizes?.og?.height ||
                metaImage?.height ||
                heroImage?.sizes?.og?.height ||
                630,
              alt: metaImage?.alt || heroImage?.alt || metaTitle || 'Poem image',
            },
          ]
        : [],
    },
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const poems = await payload.find({
    collection: 'poems',
    depth: 0,
    limit: 0,
    where: {
      _status: {
        equals: 'published',
      },
    },
    overrideAccess: false,
    select: { slug: true },
  })
  return poems.docs.map(({ slug }) => ({ slug }))
}
