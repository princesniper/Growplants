"use client";

import Image from "next/image";
import { ArrowRight, Mail } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { BLOG_POSTS } from "@/data/homepageData";

export function BlogPreviewSection() {
  const featured = BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0];
  const sidePosts = BLOG_POSTS.filter((p) => p.id !== featured.id).slice(0, 2);

  return (
    <section className="section-padding bg-[#F3F8F1]">
      <Container>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div className="space-y-2">
            <p className="text-xs font-bold tracking-widest uppercase text-[#C6A15B]">Gardening Blog</p>
            <h2 className="text-2xl md:text-4xl font-bold text-[#16382B]">Tips, Guides &amp; Inspiration</h2>
          </div>
          <p className="text-sm font-medium text-slate-500">The Care Journal — coming soon</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Featured */}
          <article className="lg:col-span-2 lg:row-span-2">
            <div className="group block h-full rounded-lg overflow-hidden bg-white border border-slate-200 hover:border-[#16382B]/30 hover:shadow-md transition-all">
              <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                <Image src={featured.image} alt={featured.title} fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <span className="absolute bottom-3 left-3 px-3 py-1.5 rounded-md bg-[#C6A15B] text-[#0E241C] text-sm font-semibold">{featured.category}</span>
              </div>
              <div className="p-5 md:p-6 space-y-2">
                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-[#16382B] transition-colors">{featured.title}</h3>
                <p className="text-xs text-slate-500">by {featured.author} | {featured.date} | {featured.readTime} min</p>
                <p className="text-sm text-slate-600 line-clamp-2">{featured.excerpt}</p>
              </div>
            </div>
          </article>

          {/* Side + newsletter */}
          <div className="flex flex-col gap-4">
            {sidePosts.map((post) => (
              <article key={post.id}>
                <div className="group block rounded-lg overflow-hidden bg-white border border-slate-200 hover:border-[#16382B]/30 hover:shadow-md transition-all">
                  <div className="flex gap-3 p-3">
                    <div className="relative size-20 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <Image src={post.image} alt={post.title} fill sizes="80px" className="object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#C6A15B] font-semibold">{post.category}</p>
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-[#16382B] transition-colors line-clamp-2 mt-0.5">{post.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-1">{post.excerpt}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {/* Newsletter mini box */}
            <div className="rounded-lg bg-[#16382B] text-white p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-full bg-white/15 flex items-center justify-center"><Mail className="size-4" aria-hidden="true" /></div>
                <p className="text-sm font-semibold">📬 Get articles in your inbox</p>
              </div>
              <p className="text-sm text-white/80">Weekly gardening tips and care guides</p>
              <Button asChild size="sm" className="w-fit gap-1.5 bg-[#C6A15B] hover:bg-[#A8843F] text-[#0E241C] mt-1">
                <a href="#newsletter">Subscribe free <ArrowRight className="size-3.5" aria-hidden="true" /></a>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
