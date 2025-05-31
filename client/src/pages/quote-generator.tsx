import { useState } from "react";
import QuoteForm from "@/components/quote-form";
import { HardHat } from "lucide-react";

export default function QuoteGenerator() {
  const [quoteNumber, setQuoteNumber] = useState("LZQ-001");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-construction-orange">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 construction-blue rounded-lg flex items-center justify-center">
                <HardHat className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-construction-gray">Lazope Construction</h1>
                <p className="text-sm text-gray-600">Quote Generator</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-sm text-gray-600">Quote #</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{quoteNumber}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuoteForm onQuoteNumberGenerated={setQuoteNumber} />
      </main>
    </div>
  );
}
