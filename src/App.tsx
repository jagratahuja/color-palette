import { useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';

interface Color {
  hex: string;
  copied: boolean;
}

function App() {
  const [colors, setColors] = useState<Color[]>(generatePalette());

  function generateRandomColor(): string {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return '#' + randomColor.padStart(6, '0').toUpperCase();
  }

  function generatePalette(): Color[] {
    return Array.from({ length: 5 }, () => ({
      hex: generateRandomColor(),
      copied: false,
    }));
  }

  function handleGenerate() {
    setColors(generatePalette());
  }

  async function handleCopy(index: number, hex: string) {
    await navigator.clipboard.writeText(hex);

    setColors(prev => prev.map((color, i) =>
      i === index ? { ...color, copied: true } : color
    ));

    setTimeout(() => {
      setColors(prev => prev.map((color, i) =>
        i === index ? { ...color, copied: false } : color
      ));
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Color Palette Generator
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Generate beautiful color palettes for your next project
            </p>
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="w-5 h-5" />
              Generate Palette
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {colors.map((color, index) => (
              <div
                key={index}
                className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div
                  className="h-40 w-full transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="p-4 space-y-3">
                  <div className="text-center">
                    <p className="text-lg font-mono font-semibold text-white">
                      {color.hex}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(index, color.hex)}
                    className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg transition-all duration-200 font-medium"
                  >
                    {color.copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-700 bg-gray-900/50 backdrop-blur-sm py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            Built with ♥ by <span className="text-blue-400 font-semibold">Jagrat Ahuja</span>
          </p>
          <p className="text-gray-500 text-sm mt-1">
            © 2026 All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
