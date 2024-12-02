import React from "react";
import { Container } from "@/components/ui/container";
import Navigation from "@/components/navigation";

export default function BlogPostSkeleton() {
  return (
    <div className="relative bg-gradient-to-r from-blue-800 to-blue-950">
      {/* Navigation */}
      <div className="relative z-20">
        <Container>
          <Navigation className="pt-6" />
        </Container>
      </div>

      {/* Content */}
      <Container className="relative z-20">
        <div className="text-white py-24">
          <div className="h-16 bg-white/10 animate-pulse rounded-lg w-3/4 mb-6" />
          <div className="flex items-center space-x-4">
            <div className="h-5 bg-white/10 animate-pulse rounded w-32" />
            <div className="h-5 bg-white/10 animate-pulse rounded w-24" />
          </div>
        </div>
      </Container>

      {/* Content */}
      <Container>
        <div className="py-8">
          <div className="bg-neutral-800/50 rounded-lg p-8 mb-8 space-y-4">
            <div className="h-4 bg-neutral-700 animate-pulse rounded w-full" />
            <div className="h-4 bg-neutral-700 animate-pulse rounded w-5/6" />
            <div className="h-4 bg-neutral-700 animate-pulse rounded w-4/6" />
            <div className="h-4 bg-neutral-700 animate-pulse rounded w-3/4" />
            <div className="h-4 bg-neutral-700 animate-pulse rounded w-5/6" />
          </div>
        </div>
      </Container>
    </div>
  );
} 