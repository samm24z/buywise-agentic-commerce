import React from 'react';
import { Headphones, Watch, Keyboard } from 'lucide-react';

interface ExampleQueriesProps {
  onSelectExample: (query: string) => void;
}

const EXAMPLES = [
  {
    text: 'Gaming headphones under ₹5,000',
    icon: Headphones,
  },
  {
    text: 'Smartwatch under ₹8,000',
    icon: Watch,
  },
  {
    text: 'Mechanical keyboard under ₹10,000',
    icon: Keyboard,
  },
];

export const ExampleQueries: React.FC<ExampleQueriesProps> = ({ onSelectExample }) => {
  return (
    <div className="max-w-2xl mx-auto mt-4 px-2">
      <div className="flex items-center justify-center flex-wrap gap-2 text-xs text-zinc-400">
        <span className="text-zinc-500 font-medium mr-1">Popular queries:</span>
        {EXAMPLES.map((example, idx) => {
          const Icon = example.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectExample(example.text)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 transition-colors duration-150 cursor-pointer"
            >
              <Icon className="w-3.5 h-3.5 text-zinc-400" />
              <span>{example.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
