import { ArrowLeft, TrendingUp, TrendingDown, Info, Calendar, Coins, Wallet, DollarSign } from "lucide-react";
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface PriceChange {
  date: string;
  price: number;
}

interface CoinDetail {
  id: string;
  creatorName: string;
  creatorAvatar: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  coinsOwned: number;
  coinValue: number;
  totalValue: number;
  totalInvested: number;
  category: string;
  priceHistory: PriceChange[];
  description: string;
  lastPriceChange: string;
}

const mockCoins: CoinDetail[] = [
  {
    id: "1",
    creatorName: "Ibai",
    creatorAvatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    coinName: "Ibai Coin",
    coinSymbol: "IBAI",
    coinImage: "https://images.unsplash.com/photo-1624365168785-c65be9114821?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 1000,
    coinValue: 2.5,
    totalValue: 2500,
    totalInvested: 2000,
    category: "Gaming",
    description: "Moneda oficial del creador de contenido Ibai. Invierte en el futuro del gaming y entretenimiento.",
    lastPriceChange: "2025-10-15",
    priceHistory: [
      { date: "2024-11-11", price: 2.5 },
      { date: "2024-10-11", price: 2.3 },
      { date: "2024-09-11", price: 2.1 },
      { date: "2024-08-11", price: 2.0 },
      { date: "2024-07-11", price: 1.8 },
    ],
  },
  {
    id: "2",
    creatorName: "El Rubius",
    creatorAvatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
    coinName: "Rubius Coin",
    coinSymbol: "RUBIUS",
    coinImage: "https://images.unsplash.com/photo-1624365169873-d42588f4e866?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 700,
    coinValue: 3.8,
    totalValue: 2660,
    totalInvested: 2800,
    category: "Gaming",
    description: "Apoya a uno de los creadores más influyentes del gaming en español.",
    lastPriceChange: "2025-10-20",
    priceHistory: [
      { date: "2024-11-11", price: 3.8 },
      { date: "2024-10-11", price: 4.0 },
      { date: "2024-09-11", price: 3.9 },
      { date: "2024-08-11", price: 3.7 },
      { date: "2024-07-11", price: 3.5 },
    ],
  },
  {
    id: "3",
    creatorName: "AuronPlay",
    creatorAvatar:
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop",
    coinName: "Auron Coin",
    coinSymbol: "AURON",
    coinImage: "https://images.unsplash.com/photo-1665060221110-6dbe583fa329?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 500,
    coinValue: 4.2,
    totalValue: 2100,
    totalInvested: 1800,
    category: "Entertainment",
    description: "Invierte en el rey del entretenimiento y el humor en YouTube.",
    lastPriceChange: "2025-09-28",
    priceHistory: [
      { date: "2024-11-11", price: 4.2 },
      { date: "2024-10-11", price: 4.0 },
      { date: "2024-09-11", price: 3.8 },
      { date: "2024-08-11", price: 3.6 },
      { date: "2024-07-11", price: 3.4 },
    ],
  },
  {
    id: "4",
    creatorName: "ElSpreen",
    creatorAvatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
    coinName: "Spreen Coin",
    coinSymbol: "SPREEN",
    coinImage: "https://images.unsplash.com/photo-1707075891530-30f9b3a6577c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 850,
    coinValue: 1.8,
    totalValue: 1530,
    totalInvested: 1700,
    category: "Gaming",
    description: "La nueva generación del gaming. Apoya a ElSpreen en su camino.",
    lastPriceChange: "2025-10-05",
    priceHistory: [
      { date: "2024-11-11", price: 1.8 },
      { date: "2024-10-11", price: 1.9 },
      { date: "2024-09-11", price: 2.0 },
      { date: "2024-08-11", price: 2.1 },
      { date: "2024-07-11", price: 2.0 },
    ],
  },
  {
    id: "5",
    creatorName: "Germán",
    creatorAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    coinName: "German Coin",
    coinSymbol: "GERMAN",
    coinImage: "https://images.unsplash.com/photo-1632071865819-512bac164112?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 300,
    coinValue: 5.1,
    totalValue: 1530,
    totalInvested: 1500,
    category: "Comedy",
    description: "Invierte en uno de los pioneros del contenido en español.",
    lastPriceChange: "2025-10-10",
    priceHistory: [
      { date: "2024-11-11", price: 5.1 },
      { date: "2024-10-11", price: 5.0 },
      { date: "2024-09-11", price: 4.8 },
      { date: "2024-08-11", price: 4.6 },
      { date: "2024-07-11", price: 4.5 },
    ],
  },
  {
    id: "6",
    creatorName: "Coscu",
    creatorAvatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    coinName: "Coscu Coin",
    coinSymbol: "COSCU",
    coinImage: "https://images.unsplash.com/photo-1624365168785-c65be9114821?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 450,
    coinValue: 2.9,
    totalValue: 1305,
    totalInvested: 1400,
    category: "Gaming",
    description: "La moneda del CoscuArmy. Únete a la comunidad.",
    lastPriceChange: "2025-09-18",
    priceHistory: [
      { date: "2024-11-11", price: 2.9 },
      { date: "2024-10-11", price: 3.0 },
      { date: "2024-09-11", price: 3.1 },
      { date: "2024-08-11", price: 3.0 },
      { date: "2024-07-11", price: 2.8 },
    ],
  },
  {
    id: "7",
    creatorName: "Luzu",
    creatorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    coinName: "Luzu Coin",
    coinSymbol: "LUZU",
    coinImage: "https://images.unsplash.com/photo-1624365169873-d42588f4e866?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 600,
    coinValue: 1.95,
    totalValue: 1170,
    totalInvested: 1200,
    category: "Entertainment",
    description: "Apoya a Luzu en sus proyectos de entretenimiento.",
    lastPriceChange: "2025-10-22",
    priceHistory: [
      { date: "2024-11-11", price: 1.95 },
      { date: "2024-10-11", price: 2.0 },
      { date: "2024-09-11", price: 2.1 },
      { date: "2024-08-11", price: 2.0 },
      { date: "2024-07-11", price: 1.9 },
    ],
  },
  {
    id: "8",
    creatorName: "Reven",
    creatorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    coinName: "Reven Coin",
    coinSymbol: "REVEN",
    coinImage: "https://images.unsplash.com/photo-1665060221110-6dbe583fa329?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 200,
    coinValue: 3.2,
    totalValue: 640,
    totalInvested: 600,
    category: "Sports",
    description: "Invierte en el futuro del contenido deportivo.",
    lastPriceChange: "2025-10-01",
    priceHistory: [
      { date: "2024-11-11", price: 3.2 },
      { date: "2024-10-11", price: 3.0 },
      { date: "2024-09-11", price: 2.9 },
      { date: "2024-08-11", price: 2.8 },
      { date: "2024-07-11", price: 2.7 },
    ],
  },
];

interface CoinDetailPageProps {
  coinId: string;
  onBack: () => void;
}

export function CoinDetailPage({ coinId, onBack }: CoinDetailPageProps) {
  const coin = mockCoins.find((c) => c.id === coinId);

  if (!coin) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>
        <div className="text-center py-12 text-slate-500">
          Moneda no encontrada
        </div>
      </div>
    );
  }

  const profitLoss = coin.totalValue - coin.totalInvested;
  const profitLossPercentage = ((profitLoss / coin.totalInvested) * 100).toFixed(2);
  
  // Calculate price change from previous to current
  const previousPrice = coin.priceHistory[1]?.price || coin.coinValue;
  const priceChange = coin.coinValue - previousPrice;
  const priceChangePercentage = ((priceChange / previousPrice) * 100).toFixed(2);

  // Format price history for chart (reverse to show oldest first)
  const chartData = [...coin.priceHistory].reverse().map((item) => ({
    date: new Date(item.date).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
    price: item.price,
  }));

  // Calculate days until next price change allowed
  const lastChangeDate = new Date(coin.lastPriceChange);
  const nextChangeDate = new Date(lastChangeDate);
  nextChangeDate.setMonth(nextChangeDate.getMonth() + 1);
  const today = new Date();
  const daysUntilNextChange = Math.ceil((nextChangeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Volver a My Wallet</span>
      </button>

      {/* Header */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Coin Image */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-4 border-slate-700/50 flex items-center justify-center overflow-hidden">
              <img
                src={coin.coinImage}
                alt={coin.coinName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Coin Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-slate-100">{coin.coinName}</h1>
                  <span className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-slate-300">
                    {coin.coinSymbol}
                  </span>
                  <span className="px-3 py-1 bg-slate-800/30 border border-slate-700/30 rounded text-slate-400 text-sm">
                    {coin.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={coin.creatorAvatar}
                    alt={coin.creatorName}
                    className="w-8 h-8 rounded-full border-2 border-slate-800/50"
                  />
                  <span className="text-slate-400">
                    Creador: <span className="text-slate-200">{coin.creatorName}</span>
                  </span>
                </div>
                <p className="text-slate-400 max-w-2xl">{coin.description}</p>
              </div>

              {/* Current Price */}
              <div className="text-right">
                <div className="text-slate-400 text-sm mb-1">Precio Actual</div>
                <div className="text-slate-100 text-3xl mb-1">{coin.coinValue.toFixed(2)}u</div>
                <div className={`flex items-center gap-1 justify-end ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-sm">
                    {priceChange >= 0 ? '+' : ''}{priceChangePercentage}% desde último cambio
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Price Notice */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-blue-400 mb-1">Precio Fijo Establecido por el Creador</div>
            <p className="text-slate-400 text-sm">
              Esta moneda tiene un precio fijo establecido por {coin.creatorName}. El precio no fluctúa por el mercado y solo puede ser modificado una vez al mes por el creador.
            </p>
            {daysUntilNextChange > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-400/70" />
                <span className="text-slate-400">
                  Próximo cambio de precio disponible en: <span className="text-blue-400">{daysUntilNextChange} días</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* My Holdings */}
        <div className="lg:col-span-1 bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
          <h2 className="text-slate-100 mb-6">Mis Tenencias</h2>
          
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-400/70 mb-2">
                <Coins className="w-4 h-4" />
                <span className="text-sm">Monedas en posesión</span>
              </div>
              <div className="text-emerald-400 text-2xl mb-1">
                {coin.coinsOwned.toLocaleString()}
              </div>
              <div className="text-emerald-400/60 text-sm">{coin.coinSymbol}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                <DollarSign className="w-4 h-4" />
                <span>Valor por moneda</span>
              </div>
              <div className="text-slate-200 text-xl">{coin.coinValue.toFixed(2)}u</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                <Wallet className="w-4 h-4" />
                <span>Valor total</span>
              </div>
              <div className="text-slate-200 text-xl">{coin.totalValue.toLocaleString()}u</div>
            </div>

            <div className="border-t border-slate-800/50 pt-4">
              <div className="text-slate-500 text-sm mb-2">Invertido</div>
              <div className="text-slate-300 mb-3">{coin.totalInvested.toLocaleString()}u</div>

              <div className="text-slate-500 text-sm mb-2">Ganancia/Pérdida</div>
              <div className={profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {profitLoss >= 0 ? '+' : ''}{profitLoss.toLocaleString()}u
                <span className="text-sm ml-2">
                  ({profitLoss >= 0 ? '+' : ''}{profitLossPercentage}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Price History Chart */}
        <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
          <h2 className="text-slate-100 mb-6">Historial de Precio</h2>
          
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}u`, 'Precio']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-slate-400 text-sm">
            El gráfico muestra el historial de cambios de precio establecidos por el creador. Cada punto representa un cambio de precio oficial.
          </div>
        </div>
      </div>

      {/* Price History Table */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
        <h2 className="text-slate-100 mb-6">Historial de Cambios de Precio</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="text-left text-slate-400 text-sm pb-3 pr-4">Fecha</th>
                <th className="text-left text-slate-400 text-sm pb-3 pr-4">Precio</th>
                <th className="text-left text-slate-400 text-sm pb-3 pr-4">Cambio</th>
                <th className="text-left text-slate-400 text-sm pb-3">% Cambio</th>
              </tr>
            </thead>
            <tbody>
              {coin.priceHistory.map((history, index) => {
                const prevPrice = coin.priceHistory[index + 1]?.price;
                const change = prevPrice ? history.price - prevPrice : 0;
                const changePercentage = prevPrice ? ((change / prevPrice) * 100).toFixed(2) : '0.00';

                return (
                  <tr key={index} className="border-b border-slate-800/30 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="text-slate-300">
                        {new Date(history.date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                      {index === 0 && (
                        <span className="text-xs text-emerald-400">Actual</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="text-slate-200">{history.price.toFixed(2)}u</div>
                    </td>
                    <td className="py-3 pr-4">
                      {prevPrice && (
                        <div className={change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}u
                        </div>
                      )}
                      {!prevPrice && (
                        <div className="text-slate-600">-</div>
                      )}
                    </td>
                    <td className="py-3">
                      {prevPrice && (
                        <div className={`flex items-center gap-1 ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{change >= 0 ? '+' : ''}{changePercentage}%</span>
                        </div>
                      )}
                      {!prevPrice && (
                        <div className="text-slate-600">-</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
