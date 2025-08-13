import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100 p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Schliemann Image */}
        <div className="relative w-108 h-64 mx-auto mb-8 rounded-lg overflow-hidden shadow-2xl">
          <Image
            src="/schliemann.jpg"
            alt="Heinrich Schliemann excavating ancient ruins"
            fill
            className="object-cover sepia-[0.3] contrast-110"
            priority
          />
        </div>

        {/* 404 Message */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-stone-700">404</h1>
          <h2 className="text-2xl font-semibold text-stone-600 mb-4">
            Not Found in Excavation
          </h2>
          <p className="text-lg text-stone-500 mx-auto mb-4">
            The ancient artifact you&apos;re looking for has been lost to time.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Return to Excavation Site
            </Link>
            <Link
              href="/list"
              className="bg-stone-600 hover:bg-stone-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Browse Ancient Lexicon
            </Link>
          </div>
        </div>

        {/* Archaeological Quote */}
        <div className="mt-6 p-4 border-l-4 border-amber-500 bg-white/50 rounded-r-lg">
          <blockquote className="italic text-stone-600 text-sm">
            &quot;I have gazed on the face of Agamemnon, but this page remains buried...&quot;
          </blockquote>
          <cite className="text-xs text-stone-400 mt-2 block">
            — Not quite Heinrich Schliemann
          </cite>
        </div>
      </div>
    </div>
  );
}
