import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Coins, TrendingUp, TrendingDown, Calendar, Edit, Save, X, Upload, DollarSign, Users, ArrowRightLeft, Vote, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import React from 'react';

interface CoinStats {
  totalSupply: number;
  circulatingSupply: number;
  totalHolders: number;
  totalPurchased: number;
  totalRedeemed: number;
  totalUsedInVotes: number;
  currentPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  lastPriceChange: string; // Fecha del último cambio de precio
  canChangePrice: boolean;
  revenue: number;
  monthlyData: MonthlyData[];
}

interface MonthlyData {
  month: string;
  purchased: number;
  redeemed: number;
  usedInVotes: number;
  revenue: number;
  holders: number;
}

interface UserCoin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  price: number;
  createdDate: string;
  stats: CoinStats;
}

const mockCoin: UserCoin = {
  id: '1',
  name: 'IbaiCoin',
  symbol: 'IBAI',
  image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=200&h=200&fit=crop',
  price: 2.5,
  createdDate: '2024-01-15',
  stats: {
    totalSupply: 1000000,
    circulatingSupply: 245000,
    totalHolders: 1250,
    totalPurchased: 250000,
    totalRedeemed: 3500,
    totalUsedInVotes: 1500,
    currentPrice: 2.5,
    priceChange24h: 5.2,
    priceChange7d: -2.1,
    priceChange30d: 12.8,
    lastPriceChange: '2024-10-01',
    canChangePrice: true,
    revenue: 625000,
    monthlyData: [
      { month: 'Enero', purchased: 15000, redeemed: 200, usedInVotes: 100, revenue: 37500, holders: 120 },
      { month: 'Febrero', purchased: 18000, redeemed: 250, usedInVotes: 150, revenue: 45000, holders: 230 },
      { month: 'Marzo', purchased: 22000, redeemed: 300, usedInVotes: 200, revenue: 55000, holders: 380 },
      { month: 'Abril', purchased: 28000, redeemed: 350, usedInVotes: 180, revenue: 70000, holders: 520 },
      { month: 'Mayo', purchased: 35000, redeemed: 400, usedInVotes: 220, revenue: 87500, holders: 680 },
      { month: 'Junio', purchased: 42000, redeemed: 450, usedInVotes: 250, revenue: 105000, holders: 850 },
      { month: 'Julio', purchased: 38000, redeemed: 500, usedInVotes: 200, revenue: 95000, holders: 980 },
      { month: 'Agosto', purchased: 32000, redeemed: 480, usedInVotes: 180, revenue: 80000, holders: 1050 },
      { month: 'Septiembre', purchased: 25000, redeemed: 420, usedInVotes: 150, revenue: 62500, holders: 1180 },
      { month: 'Octubre', purchased: 20000, redeemed: 350, usedInVotes: 120, revenue: 50000, holders: 1250 },
    ],
  },
};

type TimeRange = '24h' | '7d' | '30d' | 'all';

type ChartMetric = 'purchased' | 'redeemed' | 'usedInVotes' | 'revenue' | 'holders';

const chartMetrics = [
  { id: 'purchased' as ChartMetric, label: 'Compradas', color: '#3b82f6' },
  { id: 'redeemed' as ChartMetric, label: 'Canjeadas', color: '#a855f7' },
  { id: 'usedInVotes' as ChartMetric, label: 'En Votaciones', color: '#f97316' },
  { id: 'revenue' as ChartMetric, label: 'Ingresos', color: '#10b981' },
  { id: 'holders' as ChartMetric, label: 'Holders', color: '#64748b' },
];

export function MyCoinPage() {
  const [hasCoin, setHasCoin] = useState(true); // Cambiar a false para ver el formulario de creación
  const [coin, setCoin] = useState<UserCoin | null>(hasCoin ? mockCoin : null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPrice, setIsChangingPrice] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedMetrics, setSelectedMetrics] = useState<ChartMetric[]>(['purchased', 'revenue']);
  const [monthRange, setMonthRange] = useState<{ start: number; end: number }>({ start: 0, end: 9 });
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  
  // Form states
  const [coinName, setCoinName] = useState(coin?.name || '');
  const [coinSymbol, setCoinSymbol] = useState(coin?.symbol || '');
  const [coinPrice, setCoinPrice] = useState(coin?.price.toString() || '');
  const [coinImage, setCoinImage] = useState(coin?.image || '');
  const [newPrice, setNewPrice] = useState('');

  // Create Coin Form
  if (!hasCoin || !coin) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-slate-100 mb-2">Mi Moneda</h1>
          <p className="text-slate-400 mb-8">
            Crea tu propia moneda para que los usuarios puedan comprarla y votar en tus predicciones
          </p>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-8">
            <div className="space-y-6">
              {/* Coin Image */}
              <div>
                <label className="block text-slate-300 mb-3">Imagen de la moneda</label>
                <div className="flex items-center gap-6">
                  {coinImage ? (
                    <img
                      src={coinImage}
                      alt="Coin preview"
                      className="w-32 h-32 rounded-full object-cover border-2 border-slate-700/50"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-slate-800/50 border-2 border-slate-700/50 border-dashed flex items-center justify-center">
                      <Coins className="w-12 h-12 text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="URL de la imagen"
                      value={coinImage}
                      onChange={(e) => setCoinImage(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                    <p className="text-slate-500 text-sm mt-2">
                      Recomendado: imagen cuadrada de al menos 200x200px
                    </p>
                  </div>
                </div>
              </div>

              {/* Coin Name */}
              <div>
                <label className="block text-slate-300 mb-3">Nombre de la moneda</label>
                <input
                  type="text"
                  placeholder="Ej: IbaiCoin"
                  value={coinName}
                  onChange={(e) => setCoinName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              {/* Coin Symbol */}
              <div>
                <label className="block text-slate-300 mb-3">Símbolo (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: IBAI"
                  value={coinSymbol}
                  onChange={(e) => setCoinSymbol(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              {/* Coin Price */}
              <div>
                <label className="block text-slate-300 mb-3">Precio inicial (en uVotes)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="2.5"
                    value={coinPrice}
                    onChange={(e) => setCoinPrice(e.target.value)}
                    step="0.1"
                    min="0.1"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">u</span>
                </div>
                <p className="text-slate-500 text-sm mt-2">
                  Podrás cambiar el precio una vez al mes
                </p>
              </div>

              {/* Create Button */}
              <div className="pt-4">
                <button
                  onClick={() => {
                    // Crear moneda
                    setHasCoin(true);
                    setCoin({
                      id: '1',
                      name: coinName,
                      symbol: coinSymbol || coinName.substring(0, 4).toUpperCase(),
                      image: coinImage,
                      price: parseFloat(coinPrice),
                      createdDate: new Date().toISOString().split('T')[0],
                      stats: {
                        totalSupply: 1000000,
                        circulatingSupply: 0,
                        totalHolders: 0,
                        totalPurchased: 0,
                        totalRedeemed: 0,
                        totalUsedInVotes: 0,
                        currentPrice: parseFloat(coinPrice),
                        priceChange24h: 0,
                        priceChange7d: 0,
                        priceChange30d: 0,
                        lastPriceChange: new Date().toISOString().split('T')[0],
                        canChangePrice: false,
                        revenue: 0,
                        monthlyData: [],
                      },
                    });
                  }}
                  disabled={!coinName || !coinPrice || !coinImage}
                  className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl transition-all"
                >
                  Crear Moneda
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Coin Dashboard
  const bestMonth = coin.stats.monthlyData.reduce((prev, current) => 
    current.purchased > prev.purchased ? current : prev, 
    coin.stats.monthlyData[0]
  );

  const canChangePriceDate = new Date(coin.stats.lastPriceChange);
  canChangePriceDate.setMonth(canChangePriceDate.getMonth() + 1);
  const daysUntilPriceChange = Math.ceil((canChangePriceDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <img
              src={coin.image}
              alt={coin.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-700/50"
            />
            <div>
              <h1 className="text-slate-100 mb-1">{coin.name}</h1>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">{coin.symbol}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-500 text-sm">
                  Creada el {new Date(coin.createdDate).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800/50 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 transition-all"
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </>
            )}
          </button>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-300 text-sm mb-2">Nombre</label>
                <input
                  type="text"
                  value={coinName}
                  onChange={(e) => setCoinName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-2">Símbolo</label>
                <input
                  type="text"
                  value={coinSymbol}
                  onChange={(e) => setCoinSymbol(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-300 text-sm mb-2">URL de la imagen</label>
                <input
                  type="text"
                  value={coinImage}
                  onChange={(e) => setCoinImage(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setCoin({ ...coin, name: coinName, symbol: coinSymbol, image: coinImage });
                  setIsEditing(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Guardar cambios</span>
              </button>
            </div>
          </div>
        )}

        {/* Price Section */}
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 border border-slate-800/50 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-slate-400 text-sm mb-2">Precio Actual</div>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-slate-100 text-3xl">{coin.stats.currentPrice}u</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className={`flex items-center gap-1 ${coin.stats.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {coin.stats.priceChange24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {coin.stats.priceChange24h >= 0 ? '+' : ''}{coin.stats.priceChange24h}% (24h)
                  </span>
                  <span className={`flex items-center gap-1 ${coin.stats.priceChange7d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {coin.stats.priceChange7d >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {coin.stats.priceChange7d >= 0 ? '+' : ''}{coin.stats.priceChange7d}% (7d)
                  </span>
                  <span className={`flex items-center gap-1 ${coin.stats.priceChange30d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {coin.stats.priceChange30d >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {coin.stats.priceChange30d >= 0 ? '+' : ''}{coin.stats.priceChange30d}% (30d)
                  </span>
                </div>
              </div>
              {!coin.stats.canChangePrice && (
                <div className="text-slate-500 text-sm">
                  Podrás cambiar el precio en {daysUntilPriceChange} días
                </div>
              )}
            </div>

            {coin.stats.canChangePrice && !isChangingPrice && (
              <button
                onClick={() => setIsChangingPrice(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
              >
                <DollarSign className="w-4 h-4" />
                <span>Cambiar Precio</span>
              </button>
            )}
          </div>

          {/* Change Price Form */}
          {isChangingPrice && (
            <div className="mt-6 pt-6 border-t border-slate-800/50">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-slate-300 text-sm mb-2">Nuevo precio</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder={coin.stats.currentPrice.toString()}
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      step="0.1"
                      min="0.1"
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">u</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsChangingPrice(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setCoin({
                      ...coin,
                      price: parseFloat(newPrice),
                      stats: {
                        ...coin.stats,
                        currentPrice: parseFloat(newPrice),
                        lastPriceChange: new Date().toISOString().split('T')[0],
                        canChangePrice: false,
                      },
                    });
                    setNewPrice('');
                    setIsChangingPrice(false);
                  }}
                  disabled={!newPrice || parseFloat(newPrice) === coin.stats.currentPrice}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl transition-all"
                >
                  Confirmar
                </button>
              </div>
              <p className="text-yellow-500/80 text-sm mt-3 flex items-center gap-2">
                <span>⚠️</span>
                Solo puedes cambiar el precio una vez al mes
              </p>
            </div>
          )}
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Holders</div>
            <div className="text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              {coin.stats.totalHolders.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Circulante</div>
            <div className="text-slate-100">{coin.stats.circulatingSupply.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Compradas</div>
            <div className="text-blue-400">{coin.stats.totalPurchased.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Canjeadas</div>
            <div className="text-purple-400">{coin.stats.totalRedeemed.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">En Votaciones</div>
            <div className="text-orange-400">{coin.stats.totalUsedInVotes.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Ingresos</div>
            <div className="text-emerald-400">{coin.stats.revenue.toLocaleString()}u</div>
          </div>
        </div>

        {/* Best Month */}
        {bestMonth && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-slate-400 text-sm">Mejor mes</div>
                <div className="text-slate-100">
                  {bestMonth.month} - {bestMonth.purchased.toLocaleString()} monedas compradas
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Data */}
      <div className="mb-6">
        <h2 className="text-slate-200 mb-4">Estadísticas Mensuales</h2>
        
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
          {/* Chart Controls */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    chartType === 'line'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  Líneas
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    chartType === 'bar'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  Barras
                </button>
              </div>

              {/* Month Range Selector */}
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-sm">Rango:</span>
                <select
                  value={`${monthRange.start}-${monthRange.end}`}
                  onChange={(e) => {
                    const [start, end] = e.target.value.split('-').map(Number);
                    setMonthRange({ start, end });
                  }}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                >
                  <option value="0-2">Últimos 3 meses</option>
                  <option value="0-5">Últimos 6 meses</option>
                  <option value="0-9">Todos los meses</option>
                  <option value="0-3">Ene - Abr</option>
                  <option value="4-7">May - Ago</option>
                  <option value="7-9">Sep - Oct</option>
                </select>
              </div>
            </div>

            {/* Metric Selectors */}
            <div>
              <div className="text-slate-400 text-sm mb-3">Métricas a mostrar:</div>
              <div className="flex flex-wrap gap-2">
                {chartMetrics.map((metric) => {
                  const isSelected = selectedMetrics.includes(metric.id);
                  return (
                    <button
                      key={metric.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMetrics(selectedMetrics.filter((m) => m !== metric.id));
                        } else {
                          setSelectedMetrics([...selectedMetrics, metric.id]);
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        isSelected
                          ? 'border text-slate-200'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: `${metric.color}20`,
                              borderColor: `${metric.color}40`,
                              color: metric.color,
                            }
                          : {}
                      }
                    >
                      {metric.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart */}
          {selectedMetrics.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <LineChart
                    data={coin.stats.monthlyData.slice(monthRange.start, monthRange.end + 1)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Legend
                      wrapperStyle={{ color: '#94a3b8' }}
                      iconType="line"
                    />
                    {selectedMetrics.map((metricId) => {
                      const metric = chartMetrics.find((m) => m.id === metricId);
                      if (!metric) return null;
                      return (
                        <Line
                          key={metricId}
                          type="monotone"
                          dataKey={metricId}
                          stroke={metric.color}
                          strokeWidth={2}
                          name={metric.label}
                          dot={{ fill: metric.color, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      );
                    })}
                  </LineChart>
                ) : (
                  <BarChart
                    data={coin.stats.monthlyData.slice(monthRange.start, monthRange.end + 1)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Legend
                      wrapperStyle={{ color: '#94a3b8' }}
                      iconType="rect"
                    />
                    {selectedMetrics.map((metricId) => {
                      const metric = chartMetrics.find((m) => m.id === metricId);
                      if (!metric) return null;
                      return (
                        <Bar
                          key={metricId}
                          dataKey={metricId}
                          fill={metric.color}
                          name={metric.label}
                          radius={[4, 4, 0, 0]}
                        />
                      );
                    })}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-slate-500">
              Selecciona al menos una métrica para ver el gráfico
            </div>
          )}
        </div>
      </div>
    </div>
  );
}