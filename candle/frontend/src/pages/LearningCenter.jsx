import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  BarChart2,
  Target,
  Brain,
  AlertTriangle,
  Signal,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Info,
} from 'lucide-react';

// ─── CONTENT DATA ───────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'stock-basics',
    icon: BookOpen,
    title: 'Stock Basics',
    tag: 'Beginner',
    tagVariant: 'secondary',
    content: [
      { type: 'heading', text: 'What Is a Stock?' },
      { type: 'paragraph', text: 'A stock represents a single unit of ownership in a company. When you buy a share of Apple (AAPL), you own a tiny slice of Apple Inc. If the company grows more valuable, your slice is worth more. If it shrinks, so does yours.' },
      { type: 'paragraph', text: 'In CANDLE, you don\'t buy stocks — you predict how they\'ll perform around their earnings reports. But understanding what a stock actually is helps you reason about why prices move.' },
      { type: 'heading', text: 'Market Cap: Size Matters' },
      { type: 'paragraph', text: 'Market capitalisation (market cap) is the total value of all a company\'s shares combined. It tells you the size of the company in the market\'s eyes.' },
      {
        type: 'table',
        headers: ['Category', 'Market Cap Range', 'Examples', 'Prediction Behaviour'],
        rows: [
          ['Large Cap', '$10B+', 'AAPL, MSFT, JPM', 'More predictable, dense analyst coverage'],
          ['Mid Cap', '$2B – $10B', 'PLTR, ROKU, SNAP', 'More volatile, bigger surprises possible'],
          ['Small Cap', '< $2B', 'Various', 'Least covered, highest surprise potential'],
        ],
      },
      { type: 'tip', text: 'When predicting a large-cap stock, analyst consensus is usually well-informed. For small-caps, the consensus can be way off — factor that into your confidence level.' },
      { type: 'heading', text: 'Price vs. Value' },
      { type: 'paragraph', text: 'A stock\'s price is just the number on the screen. Its value is what the business is actually worth based on earnings, growth, and future potential. These two numbers are often different — and the gap between them is exactly why earnings reports matter so much.' },
      { type: 'heading', text: 'Volume & Liquidity' },
      { type: 'paragraph', text: 'Volume is how many shares traded in a day. High volume means lots of buyers and sellers — the stock is liquid. Low-volume stocks can move dramatically on earnings because fewer people are watching.' },
      { type: 'heading', text: 'Why Prices Move Before Earnings' },
      { type: 'paragraph', text: 'Stocks often drift up or down in the days leading up to an earnings report. This is the market pricing in expectations. If traders broadly expect a Beat, the price may already rise before the report drops.' },
      { type: 'warning', text: 'Don\'t confuse pre-earnings price movement with the earnings result itself. A stock can rise going into earnings and still fall after — if the result doesn\'t match the elevated expectations.' },
    ],
  },
  {
    id: 'earnings-financials',
    icon: BarChart2,
    title: 'Earnings & Financials',
    tag: 'Beginner',
    tagVariant: 'secondary',
    content: [
      { type: 'heading', text: 'What Is an Earnings Report?' },
      { type: 'paragraph', text: 'Every publicly traded company is required to report its financial results four times a year (quarterly). These reports reveal how much money the company made, how much it spent, and what it expects going forward.' },
      { type: 'paragraph', text: 'Earnings season is when most companies release these reports in a concentrated window — usually in January, April, July, and October. This is the heartbeat of CANDLE.' },
      { type: 'heading', text: 'EPS: The Number Everyone Watches' },
      { type: 'paragraph', text: 'EPS stands for Earnings Per Share. It\'s the company\'s profit divided by the number of shares outstanding. It\'s the single most watched number in an earnings report.' },
      { type: 'example', title: 'EPS in Action', text: 'If analysts expect Microsoft (MSFT) to report EPS of $2.80 and Microsoft reports $3.05, that\'s a Beat. The actual number exceeded what the market expected. Your prediction of "Beat" would be correct.' },
      { type: 'heading', text: 'Revenue: The Top Line' },
      { type: 'paragraph', text: 'Revenue is the total money a company brought in from sales — before any expenses are subtracted. It\'s called the "top line" because it sits at the top of the income statement. Revenue shows whether the business is actually growing.' },
      { type: 'heading', text: 'Guidance: The Forward Look' },
      { type: 'paragraph', text: 'Guidance is management\'s own forecast for the next quarter or fiscal year. This is often MORE important than the current quarter\'s results. The stock market is forward-looking — it prices in the future, not the past.' },
      { type: 'warning', text: 'A company can Beat on EPS and Revenue but issue weak guidance — and the stock will fall. Guidance is the single most underestimated factor for prediction accuracy.' },
      { type: 'heading', text: 'YoY vs. QoQ Growth' },
      {
        type: 'table',
        headers: ['Metric', 'Compares To', 'Best Used For'],
        rows: [
          ['YoY Growth', 'Same quarter, last year', 'Understanding long-term trends'],
          ['QoQ Growth', 'Previous quarter', 'Spotting short-term momentum or slowdown'],
        ],
      },
      { type: 'heading', text: 'Analyst Expectations' },
      { type: 'paragraph', text: 'Before each earnings report, Wall Street analysts publish estimates for EPS, Revenue, and other metrics. These are aggregated into a "consensus" — the average expectation. Beat / Meet / Miss is defined relative to this consensus.' },
      { type: 'tip', text: 'If most analysts recently revised their estimates upward, the consensus bar is higher. A company might still technically Beat but by less than expected — making the reaction muted.' },
    ],
  },
  {
    id: 'beat-meet-miss',
    icon: Target,
    title: 'Beat · Meet · Miss',
    tag: 'Core',
    tagVariant: 'default',
    content: [
      { type: 'heading', text: 'The Foundation of Every Prediction' },
      { type: 'paragraph', text: 'Every prediction you make in CANDLE boils down to one question: will this company\'s earnings result come in above, in line with, or below what analysts expect? That\'s Beat, Meet, or Miss.' },
      {
        type: 'table',
        headers: ['Outcome', 'What It Means', 'Typical Signal'],
        rows: [
          ['🟢 Beat', 'Actual EPS > Analyst Consensus EPS', 'Company outperformed expectations'],
          ['🟡 Meet', 'Actual EPS ≈ Analyst Consensus EPS', 'Company matched expectations'],
          ['🔴 Miss', 'Actual EPS < Analyst Consensus EPS', 'Company underperformed expectations'],
        ],
      },
      { type: 'heading', text: 'Why a Stock Can Fall After a Beat' },
      { type: 'paragraph', text: 'This is one of the most important and counterintuitive lessons. A stock CAN fall even after reporting a Beat. The market doesn\'t just react to the number — it reacts to the surprise relative to what was already priced in.' },
      { type: 'example', title: 'Buy the Rumor, Sell the News', text: 'Imagine a stock has already risen 15% in the two weeks before earnings because traders were confident in a Beat. The company reports a Beat — but only a small one. The result was already priced in. Traders sell to lock in profits. The stock drops despite a Beat.' },
      { type: 'warning', text: 'In CANDLE, Beat / Meet / Miss is evaluated purely on whether the actual result exceeded, matched, or fell short of consensus. Pre-earnings price movement doesn\'t change your prediction outcome — but understanding it helps you choose the right prediction.' },
      { type: 'heading', text: 'Small Beat vs. Big Beat' },
      { type: 'paragraph', text: 'Not all Beats are equal. A company beating EPS by $0.01 is technically a Beat, but the market may barely react. A company beating by $0.50 when consensus was $2.00 is a massive Beat. The magnitude of the surprise matters enormously.' },
      { type: 'heading', text: 'The Surprise Factor' },
      { type: 'paragraph', text: 'The earnings surprise is: (Actual EPS − Consensus EPS) ÷ Consensus EPS. A 5% positive surprise is meaningful. A 20%+ surprise is rare and usually moves the stock significantly.' },
      { type: 'tip', text: 'Companies that have a history of beating estimates by a small margin often do so again — analysts sometimes deliberately set the bar slightly low. If a stock has beaten by 2–5% for four consecutive quarters, a small Beat is the most likely outcome.' },
    ],
  },
  {
    id: 'prediction-strategy',
    icon: Brain,
    title: 'Prediction Strategy',
    tag: 'Strategy',
    tagVariant: 'outline',
    content: [
      { type: 'heading', text: 'When to Choose Beat' },
      { type: 'paragraph', text: 'Predict Beat when you believe the company will report EPS above analyst consensus. Strong signals include: consistent history of beating estimates, positive pre-earnings guidance revisions, industry tailwinds, and management that tends to guide conservatively.' },
      { type: 'heading', text: 'When to Choose Meet' },
      { type: 'paragraph', text: 'Predict Meet when you think the company will land right around consensus. This is often right when: the stock is a large, mature company with very efficient analyst coverage, recent guidance matched expectations closely, and there\'s no unusual catalyst.' },
      { type: 'heading', text: 'When to Choose Miss' },
      { type: 'paragraph', text: 'Predict Miss when you have reason to believe the company will fall short. This is the hardest and riskiest prediction. Strong signals include: company recently warned or lowered guidance, significant industry headwinds, or consensus estimates that seem unrealistically optimistic.' },
      { type: 'heading', text: 'Conservative vs. Aggressive Predictions' },
      { type: 'paragraph', text: 'A conservative prediction plays it safe — predicting Beat for companies with strong track records, or Meet for stable blue-chips. An aggressive prediction takes a contrarian stance — predicting Miss when sentiment is bullish, or Beat on a small-cap with limited coverage.' },
      { type: 'example', title: 'Strategy in Practice', text: 'A conservative player might predict Beat on AAPL (which has beaten consensus in 80%+ of recent quarters). An aggressive player might predict Miss on a hyped stock where the consensus estimate was recently raised sharply — betting the bar is now too high.' },
      { type: 'heading', text: 'Using Confidence Levels Wisely' },
      { type: 'paragraph', text: 'Your confidence level reflects how sure you are. Set high confidence when you have strong, evidence-based reasoning. Set low confidence when you\'re making a speculative or contrarian call. High confidence on a wrong prediction costs more than low confidence on the same wrong prediction.' },
      { type: 'tip', text: 'If you find yourself always predicting Beat at high confidence, you\'re likely being overconfident. Check your Analytics page to see how well-calibrated you are.' },
      { type: 'heading', text: 'Risk Management' },
      { type: 'paragraph', text: 'Spread your predictions across different sectors and company sizes. Don\'t go all-in on one thesis. Diversification in predictions smooths out your results over time.' },
    ],
  },
  {
    id: 'common-mistakes',
    icon: AlertTriangle,
    title: 'Common Mistakes',
    tag: 'Tips',
    tagVariant: 'destructive',
    content: [
      { type: 'heading', text: 'Overconfidence' },
      { type: 'warning', text: 'The #1 mistake. New predictors tend to assign high confidence to almost every prediction. The market is unpredictable — even experienced analysts are wrong regularly. If your confidence is always above 80%, you\'re not calibrating properly.' },
      { type: 'heading', text: 'Ignoring Guidance' },
      { type: 'warning', text: 'Many predictors focus only on whether EPS will Beat or Miss. But a company can Beat on EPS and crater on guidance — and the market will punish it. Always factor in what management is saying about the future.' },
      { type: 'heading', text: 'Following the Hype' },
      { type: 'warning', text: 'Social media and news headlines create noise. A stock trending on Twitter doesn\'t mean it\'s more likely to Beat. High-hype stocks often have elevated consensus estimates — making a Beat harder, not easier.' },
      { type: 'heading', text: 'Recency Bias' },
      { type: 'warning', text: 'If a company Beat last quarter, you might assume it\'ll Beat again. Sometimes that\'s right — but not always. A company that Beat three quarters in a row might be approaching a quarter where the bar has been raised too high.' },
      { type: 'heading', text: 'Ignoring the Sector' },
      { type: 'warning', text: 'Companies don\'t exist in a vacuum. If the entire tech sector is facing headwinds, even a strong company may struggle. Always consider the broader environment.' },
      { type: 'heading', text: 'Not Reviewing Your Predictions' },
      { type: 'warning', text: 'The fastest way to improve is to study your mistakes. After each earnings season, go through your predictions — especially the wrong ones. Your Analytics and My Predictions pages are built for exactly this.' },
    ],
  },
  {
    id: 'market-signals',
    icon: Signal,
    title: 'Market Signals',
    tag: 'Advanced',
    tagVariant: 'outline',
    content: [
      { type: 'advanced-banner', text: 'This section covers more advanced signals. These are not required to make good predictions, but understanding them can give you an edge.' },
      { type: 'heading', text: 'Pre-Earnings Price Movement' },
      { type: 'paragraph', text: 'Stocks often drift in a predictable direction before earnings — this is called the "pre-earnings announcement drift" (PEAD). If a stock has historically beaten estimates, it may drift upward before the next report. A significant upward drift suggests the market is already expecting good results.' },
      { type: 'heading', text: 'Analyst Upgrades & Downgrades' },
      { type: 'paragraph', text: 'When an analyst upgrades a stock (e.g., Hold to Buy), it signals expected better performance. Multiple upgrades before earnings can indicate growing confidence in a Beat. Pay attention to the timing — upgrades right before earnings are more meaningful.' },
      { type: 'heading', text: 'Volume Spikes' },
      { type: 'paragraph', text: 'An unusual spike in trading volume before earnings suggests large institutional investors are taking positions. If volume is surging and the price is rising, informed traders may be betting on a Beat. Volume alone isn\'t conclusive, but combined with price direction, it adds context.' },
      { type: 'heading', text: 'Sentiment Indicators' },
      { type: 'paragraph', text: 'Options market activity can reveal sentiment. A high ratio of call options to put options before earnings suggests bullish sentiment. However, extreme bullish sentiment can sometimes be a contrarian signal — when everyone is betting on a Beat, the risk of disappointment increases.' },
      { type: 'tip', text: 'Use these signals as additional context, not standalone decision drivers. The strongest predictions combine fundamental analysis with these market signals.' },
    ],
  },
];

// ─── BLOCK RENDERERS ────────────────────────────────────────────────────────
function Heading({ text }) {
  return (
    <h3 className="text-lg font-semibold tracking-tight mt-6 mb-2 first:mt-0">
      {text}
    </h3>
  );
}

function Paragraph({ text }) {
  return (
    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
      {text}
    </p>
  );
}

function TipBlock({ text }) {
  return (
    <div className="my-4 flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
      <Lightbulb className="size-5 text-green-600 shrink-0 mt-0.5" />
      <p className="text-sm text-green-800 leading-relaxed">{text}</p>
    </div>
  );
}

function WarningBlock({ text }) {
  return (
    <div className="my-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800 leading-relaxed">{text}</p>
    </div>
  );
}

function ExampleBlock({ title, text }) {
  return (
    <div className="my-4 rounded-lg border bg-muted/50 p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        Example
      </p>
      <p className="text-sm font-medium mb-1.5">{title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function AdvancedBanner({ text }) {
  return (
    <div className="my-4 flex gap-3 rounded-lg border border-purple-200 bg-purple-50 p-4">
      <Info className="size-5 text-purple-600 shrink-0 mt-0.5" />
      <p className="text-sm text-purple-800 leading-relaxed font-medium">{text}</p>
    </div>
  );
}

function TableBlock({ headers, rows }) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left px-4 py-2.5 text-muted-foreground font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={`border-t ${ri % 2 === 1 ? 'bg-muted/30' : ''}`}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-sm">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderBlock(block, idx) {
  switch (block.type) {
    case 'heading':         return <Heading key={idx} text={block.text} />;
    case 'paragraph':       return <Paragraph key={idx} text={block.text} />;
    case 'tip':             return <TipBlock key={idx} text={block.text} />;
    case 'warning':         return <WarningBlock key={idx} text={block.text} />;
    case 'example':         return <ExampleBlock key={idx} title={block.title} text={block.text} />;
    case 'advanced-banner': return <AdvancedBanner key={idx} text={block.text} />;
    case 'table':           return <TableBlock key={idx} headers={block.headers} rows={block.rows} />;
    default:                return null;
  }
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
// Accepts activeSection + onSectionChange from AppLayout (driven by sidebar).
// Falls back to internal state if used standalone.
function LearningCenter({ activeSection: propSection, onSectionChange }) {
  const [internalSection, setInternalSection] = useState('stock-basics');

  const activeSection = propSection || internalSection;
  const setActiveSection = onSectionChange || setInternalSection;

  const current = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];
  const currentIndex = SECTIONS.findIndex((s) => s.id === activeSection);
  const prev = currentIndex > 0 ? SECTIONS[currentIndex - 1] : null;
  const next = currentIndex < SECTIONS.length - 1 ? SECTIONS[currentIndex + 1] : null;

  const Icon = current.icon;

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Center</h1>
          <p className="text-muted-foreground">
            Master the art of earnings predictions
          </p>
        </div>
      </div>

      {/* Content Card */}
      <Card className="max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-5" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {current.title}
                  <Badge variant={current.tagVariant}>{current.tag}</Badge>
                </CardTitle>
                <CardDescription>
                  Section {currentIndex + 1} of {SECTIONS.length}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="text-left">
          {current.content.map((block, idx) => renderBlock(block, idx))}
        </CardContent>
      </Card>

      {/* Prev / Next Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => prev && setActiveSection(prev.id)}
          disabled={!prev}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all
            ${prev
              ? 'bg-white border-gray-200 hover:bg-muted text-foreground'
              : 'opacity-30 cursor-not-allowed bg-white border-gray-200 text-muted-foreground'
            }`}
        >
          <ChevronLeft className="size-4" />
          {prev ? prev.title : 'Previous'}
        </button>

        <button
          onClick={() => next && setActiveSection(next.id)}
          disabled={!next}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all
            ${next
              ? 'bg-white border-gray-200 hover:bg-muted text-foreground'
              : 'opacity-30 cursor-not-allowed bg-white border-gray-200 text-muted-foreground'
            }`}
        >
          {next ? next.title : 'Next'}
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

export default LearningCenter;