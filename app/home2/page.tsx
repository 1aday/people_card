'use client'

import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Star, Users2, Sparkles, Zap, Shield, LineChart } from "lucide-react"
import Image from "next/image"

export default function Home2() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black to-slate-900 -z-10" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(white,transparent_85%)] -z-10" />

      {/* Hero Section */}
      <section className="py-20 sm:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-7xl/none bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
                Create Beautiful People Cards<br />in Seconds
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-300 md:text-xl">
                Transform your team profiles into stunning visual cards. Perfect for company websites, 
                team pages, and professional presentations.
              </p>
            </div>
            <div className="space-x-4">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-black/50 backdrop-blur-xl border-t border-gray-800">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-purple-500/10 p-2">
                <Zap className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Instant Generation</h3>
              <p className="text-gray-400">
                Generate professional profile cards in seconds using AI-powered data extraction.
              </p>
            </div>
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-blue-500/10 p-2">
                <Users2 className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Team Management</h3>
              <p className="text-gray-400">
                Organize and manage your team profiles with ease. Group, tag, and categorize.
              </p>
            </div>
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-green-500/10 p-2">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Enterprise Ready</h3>
              <p className="text-gray-400">
                Built for scale with enterprise-grade security and collaboration features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="flex space-x-8 opacity-70">
              <Image src="/company1.svg" alt="Company 1" width={120} height={40} />
              <Image src="/company2.svg" alt="Company 2" width={120} height={40} />
              <Image src="/company3.svg" alt="Company 3" width={120} height={40} />
              <Image src="/company4.svg" alt="Company 4" width={120} height={40} />
            </div>
            <div className="flex items-center space-x-2 text-amber-400">
              <Star className="fill-current" />
              <Star className="fill-current" />
              <Star className="fill-current" />
              <Star className="fill-current" />
              <Star className="fill-current" />
            </div>
            <p className="text-xl text-gray-300">
              "The best tool we've found for creating professional team profiles"
            </p>
            <div className="text-sm text-gray-400">
              — Sarah Johnson, Head of People at TechCorp
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-black/50 backdrop-blur-xl border-t border-gray-800">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="space-y-4">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                1
              </div>
              <h3 className="text-xl font-semibold text-white">Import Data</h3>
              <p className="text-gray-400">
                Upload your team's information or connect with LinkedIn profiles.
              </p>
            </div>
            <div className="space-y-4">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                2
              </div>
              <h3 className="text-xl font-semibold text-white">Customize Cards</h3>
              <p className="text-gray-400">
                Choose from beautiful templates and customize to match your brand.
              </p>
            </div>
            <div className="space-y-4">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                3
              </div>
              <h3 className="text-xl font-semibold text-white">Share & Embed</h3>
              <p className="text-gray-400">
                Export cards or embed them directly on your website.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                100K+
              </div>
              <div className="mt-2 text-gray-400">Cards Generated</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                98%
              </div>
              <div className="mt-2 text-gray-400">Customer Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                5000+
              </div>
              <div className="mt-2 text-gray-400">Active Companies</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-black to-slate-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
                Ready to Transform Your Team Page?
              </h2>
              <p className="mx-auto max-w-[600px] text-gray-400 md:text-xl">
                Join thousands of companies using People Card Creator to showcase their teams.
              </p>
            </div>
            <div className="space-x-4">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                Get Started for Free
              </Button>
              <Button variant="outline" size="lg">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 