'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { RefreshCw, Download, TrendingUp, Package, Fuel, BarChart3, Table2 } from 'lucide-react';

interface HeliumFill {
  fillDate: string;
  cell: string;
  scf: number;
}

interface HeliumFillTotal {
  cell: string;
  totalScf: number;
  fillCount: number;
}

interface PropaneCanister {
  machinery: string;
  date: string;
}

interface DieselEntry {
  machinery: string;
  date: string;
  gallons: number;
}

interface DashboardStats {
  heliumTotalSCF: number;
  heliumFills: number;
  propaneCanisters: number;
  propaneGallonsPumped: number;
  dieselTotal: number;
  dieselEntries: number;
  lastUpdated: string;
}

export default function Dashboard() {
  const [heliumData, setHeliumData] = useState<HeliumFill[]>([]);
  const [heliumFillTotals, setHeliumFillTotals] = useState<HeliumFillTotal[]>([]);
  const [propaneData, setPropaneData] = useState<PropaneCanister[]>([]);
  const [dieselData, setDieselData] = useState<DieselEntry[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    heliumTotalSCF: 0,
    heliumFills: 0,
    propaneCanisters: 0,
    propaneGallonsPumped: 0,
    dieselTotal: 0,
    dieselEntries: 0,
    lastUpdated: new Date().toLocaleString(),
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('combined');
  
  // View toggle states
  const [heliumFillTotalsView, setHeliumFillTotalsView] = useState<'graph' | 'table'>('graph');
  const [propaneByMachineryView, setPropaneByMachineryView] = useState<'graph' | 'table'>('graph');
  const [dieselByMachineryView, setDieselByMachineryView] = useState<'graph' | 'table'>('graph');
  const [heliumByCellView, setHeliumByCellView] = useState<'graph' | 'table'>('graph');
  const [heliumFillRecordsView, setHeliumFillRecordsView] = useState<'graph' | 'table'>('table');
  const [propaneRecordsView, setPropaneRecordsView] = useState<'graph' | 'table'>('table');
  const [dieselRecordsView, setDieselRecordsView] = useState<'graph' | 'table'>('table');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sheets');
      const data = await response.json();
      
      setHeliumData(data.helium || []);
      setHeliumFillTotals(data.heliumFillTotals || []);
      setPropaneData(data.fuel?.propane || []);
      setDieselData(data.fuel?.diesel || []);

      const heliumTotalSCF = (data.helium || []).reduce((sum: number, item: HeliumFill) => sum + item.scf, 0);
      const dieselTotal = (data.fuel?.diesel || []).reduce((sum: number, item: DieselEntry) => sum + item.gallons, 0);

      setStats({
        heliumTotalSCF,
        heliumFills: (data.helium || []).length,
        propaneCanisters: data.fuel?.propaneTotals?.canisters || 0,
        propaneGallonsPumped: data.fuel?.propaneTotals?.gallonsPumped || 0,
        dieselTotal,
        dieselEntries: (data.fuel?.diesel || []).length,
        lastUpdated: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3600000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleExport = (format: 'csv') => {
    if (format === 'csv') {
      const csvContent = generateCSV();
      downloadFile(csvContent, 'logistics-dashboard.csv', 'text/csv');
    }
  };

  const generateCSV = () => {
    let csv = 'Logistics H2 Dashboard Export\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;

    csv += 'HELIUM TRACKER - YEAR TO DATE\n';
    csv += 'Fill Date,Cell #,SCF\n';
    heliumData.forEach(item => {
      csv += `${item.fillDate},${item.cell},${item.scf}\n`;
    });

    csv += '\nHELIUM FILL TOTALS BY CELL\n';
    csv += 'Cell #,Total SCF,Fill Count\n';
    heliumFillTotals.forEach(item => {
      csv += `${item.cell},${item.totalScf},${item.fillCount}\n`;
    });

    csv += '\nPROPANE CANISTERS - YEAR TO DATE\n';
    csv += 'Machinery,Date of Canister Replacement\n';
    propaneData.forEach(item => {
      csv += `${item.machinery},${item.date}\n`;
    });

    csv += '\nDIESEL FUEL - YEAR TO DATE\n';
    csv += 'Machinery,Date Fueled,Gallons Pumped\n';
    dieselData.forEach(item => {
      csv += `${item.machinery},${item.date},${item.gallons}\n`;
    });

    return csv;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate cumulative monthly helium usage (flowing line)
  const getMonthlyHeliumData = () => {
    const monthlyData: Record<string, number> = {
      'January': 0,
      'February': 0,
      'March': 0,
      'April': 0,
      'May': 0,
      'June': 0,
      'July': 0,
      'August': 0,
      'September': 0,
      'October': 0,
      'November': 0,
      'December': 0,
    };

    heliumData.forEach(item => {
      const date = new Date(item.fillDate);
      const month = date.toLocaleString('default', { month: 'long' });
      if (monthlyData.hasOwnProperty(month)) {
        monthlyData[month] += item.scf;
      }
    });

    let cumulative = 0;
    return Object.entries(monthlyData).map(([month, scf]) => {
      cumulative += scf;
      return {
        month: month.slice(0, 3),
        scf: Math.round(cumulative),
        monthlyScf: Math.round(scf),
      };
    });
  };

  // Calculate cumulative monthly fuel usage (flowing line)
  const getMonthlyFuelData = () => {
    const monthlyData: Record<string, number> = {
      'January': 0,
      'February': 0,
      'March': 0,
      'April': 0,
      'May': 0,
      'June': 0,
      'July': 0,
      'August': 0,
      'September': 0,
      'October': 0,
      'November': 0,
      'December': 0,
    };

    dieselData.forEach(item => {
      const date = new Date(item.date);
      const month = date.toLocaleString('default', { month: 'long' });
      if (monthlyData.hasOwnProperty(month)) {
        monthlyData[month] += item.gallons;
      }
    });

    let cumulative = 0;
    return Object.entries(monthlyData).map(([month, gallons]) => {
      cumulative += gallons;
      return {
        month: month.slice(0, 3),
        gallons: Math.round(cumulative),
        monthlyGallons: Math.round(gallons),
      };
    });
  };

  // Calculate machinery totals for propane
  const propaneByMachinery = propaneData.reduce((acc: Record<string, number>, item) => {
    acc[item.machinery] = (acc[item.machinery] || 0) + 1;
    return acc;
  }, {});

  const propaneChartData = Object.entries(propaneByMachinery)
    .map(([machinery, count]) => ({ machinery, canisters: count }))
    .sort((a, b) => b.canisters - a.canisters);

  // Calculate machinery totals for diesel
  const dieselByMachinery = dieselData.reduce((acc: Record<string, number>, item) => {
    acc[item.machinery] = (acc[item.machinery] || 0) + item.gallons;
    return acc;
  }, {});

  const dieselChartData = Object.entries(dieselByMachinery)
    .map(([machinery, gallons]) => ({ machinery, gallons }))
    .sort((a, b) => b.gallons - a.gallons);

  // Calculate cell totals for helium
  const heliumByCell = heliumData.reduce((acc: Record<string, number>, item) => {
    acc[item.cell] = (acc[item.cell] || 0) + item.scf;
    return acc;
  }, {});

  const heliumChartData = Object.entries(heliumByCell)
    .map(([cell, scf]) => ({ cell, scf }))
    .sort((a, b) => b.scf - a.scf);

  const monthlyHeliumData = getMonthlyHeliumData();
  const monthlyFuelData = getMonthlyFuelData();

  const COLORS = ['#3b82f6', '#1e40af', '#0c4a6e', '#075985', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bfdbfe'];

  // Pie chart data for helium fill totals
  const heliumFillTotalsPieData = heliumFillTotals.slice(0, 10).map((item, idx) => ({
    name: item.cell,
    value: Math.round(item.totalScf),
  }));

  // Pie chart data for propane by machinery
  const propanePieData = propaneChartData.slice(0, 10).map((item, idx) => ({
    name: item.machinery,
    value: item.canisters,
  }));

  // Pie chart data for diesel by machinery
  const dieselPieData = dieselChartData.slice(0, 10).map((item, idx) => ({
    name: item.machinery,
    value: Math.round(item.gallons),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Logistics H2 Dashboard</h1>
              <p className="text-sm text-slate-600 mt-1">Year-to-date resource tracking and analytics</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">Last updated: {stats.lastUpdated}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Helium Total SCF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.heliumTotalSCF.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {stats.heliumFills} fills YTD
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-blue-600" />
                Propane Canisters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.propaneCanisters}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {stats.propaneGallonsPumped} gal pumped YTD
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Diesel Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.dieselTotal.toLocaleString()} gal
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {stats.dieselEntries} entries YTD
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Resource Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Helium Fills:</span>
                  <span className="font-semibold text-slate-900">{stats.heliumFills}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Propane:</span>
                  <span className="font-semibold text-slate-900">{stats.propaneCanisters}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Diesel:</span>
                  <span className="font-semibold text-slate-900">{stats.dieselEntries}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="combined">Combined View</TabsTrigger>
            <TabsTrigger value="helium">Helium Tracker</TabsTrigger>
            <TabsTrigger value="fuel">Fuel Log</TabsTrigger>
          </TabsList>

          {/* Combined View */}
          <TabsContent value="combined" className="space-y-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Helium SCF Used YTD (Cumulative)</CardTitle>
                <CardDescription>Total SCF accumulated throughout the year</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={monthlyHeliumData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => value.toLocaleString()}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="scf" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Cumulative SCF"
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Diesel Fuel Used YTD (Cumulative)</CardTitle>
                <CardDescription>Total gallons accumulated throughout the year</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={monthlyFuelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => value.toLocaleString()}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="gallons" 
                      stroke="#0c4a6e" 
                      strokeWidth={3}
                      dot={{ fill: '#0c4a6e', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Cumulative Gallons"
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Helium Distribution by Cell</CardTitle>
                    <CardDescription>SCF distribution across cells</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHeliumByCellView(heliumByCellView === 'graph' ? 'table' : 'graph')}
                    className="gap-2"
                  >
                    {heliumByCellView === 'graph' ? (
                      <>
                        <Table2 className="w-4 h-4" />
                        Table
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4" />
                        Graph
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  {heliumByCellView === 'graph' ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={heliumFillTotalsPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {heliumFillTotalsPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => value.toLocaleString()} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Cell #</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Total SCF</th>
                          </tr>
                        </thead>
                        <tbody>
                          {heliumFillTotals.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-900 font-semibold">{item.cell}</td>
                              <td className="py-3 px-4 text-slate-900">{item.totalScf.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Year-to-Date Summary</CardTitle>
                  <CardDescription>Resource totals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Helium Total SCF</span>
                      <span className="text-xl font-bold text-slate-900">
                        {stats.heliumTotalSCF.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Propane Canisters</span>
                      <span className="text-xl font-bold text-slate-900">
                        {stats.propaneCanisters}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-slate-900 font-semibold">Diesel Total</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {stats.dieselTotal.toLocaleString()} gal
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Helium View */}
          <TabsContent value="helium" className="space-y-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Helium SCF Used YTD (Cumulative)</CardTitle>
                <CardDescription>Total SCF accumulated throughout the year - flowing line graph</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={monthlyHeliumData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => value.toLocaleString()}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="scf" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Cumulative SCF"
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Helium Fill Totals by Cell</CardTitle>
                  <CardDescription>Total SCF and fill count per cell YTD</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHeliumFillTotalsView(heliumFillTotalsView === 'graph' ? 'table' : 'graph')}
                  className="gap-2"
                >
                  {heliumFillTotalsView === 'graph' ? (
                    <>
                      <Table2 className="w-4 h-4" />
                      Table
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      Graph
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {heliumFillTotalsView === 'graph' ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={heliumFillTotals}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="cell" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="totalScf" fill="#3b82f6" name="Total SCF" />
                      <Bar yAxisId="right" dataKey="fillCount" fill="#0ea5e9" name="Fill Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">Cell #</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">Total SCF</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">Fill Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {heliumFillTotals.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-900 font-semibold">{item.cell}</td>
                            <td className="py-3 px-4 text-slate-900">{item.totalScf.toLocaleString()}</td>
                            <td className="py-3 px-4 text-slate-900">{item.fillCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Helium Fill Records</CardTitle>
                  <CardDescription>All helium fills year-to-date</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHeliumFillRecordsView(heliumFillRecordsView === 'graph' ? 'table' : 'graph')}
                  className="gap-2"
                >
                  {heliumFillRecordsView === 'graph' ? (
                    <>
                      <Table2 className="w-4 h-4" />
                      Table
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      Graph
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {heliumFillRecordsView === 'graph' ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        type="number" 
                        dataKey="index" 
                        name="Fill #"
                        label={{ value: 'Fill Number', position: 'insideBottomRight', offset: -5 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="scf" 
                        name="SCF"
                        label={{ value: 'SCF', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value, name) => {
                          if (name === 'SCF') return value.toLocaleString();
                          return value;
                        }}
                      />
                      <Scatter 
                        name="Helium Fills" 
                        data={heliumData.map((item, idx) => ({ ...item, index: idx + 1 }))}
                        fill="#3b82f6"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">Fill Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">Cell #</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">SCF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {heliumData.slice().reverse().map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-900">{item.fillDate}</td>
                            <td className="py-3 px-4 text-slate-900">{item.cell}</td>
                            <td className="py-3 px-4 text-slate-900">{item.scf.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fuel View */}
          <TabsContent value="fuel" className="space-y-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Diesel Fuel Used YTD (Cumulative)</CardTitle>
                <CardDescription>Total gallons accumulated throughout the year - flowing line graph</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={monthlyFuelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => value.toLocaleString()}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="gallons" 
                      stroke="#0c4a6e" 
                      strokeWidth={3}
                      dot={{ fill: '#0c4a6e', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Cumulative Gallons"
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Propane by Equipment</CardTitle>
                    <CardDescription>Canisters used per equipment YTD</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPropaneByMachineryView(propaneByMachineryView === 'graph' ? 'table' : 'graph')}
                    className="gap-2"
                  >
                    {propaneByMachineryView === 'graph' ? (
                      <>
                        <Table2 className="w-4 h-4" />
                        Table
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4" />
                        Graph
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  {propaneByMachineryView === 'graph' ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={propanePieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {propanePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Machinery</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Canisters</th>
                          </tr>
                        </thead>
                        <tbody>
                          {propaneChartData.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-900">{item.machinery}</td>
                              <td className="py-3 px-4 text-slate-900">{item.canisters}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Diesel by Equipment</CardTitle>
                    <CardDescription>Gallons used per equipment YTD</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDieselByMachineryView(dieselByMachineryView === 'graph' ? 'table' : 'graph')}
                    className="gap-2"
                  >
                    {dieselByMachineryView === 'graph' ? (
                      <>
                        <Table2 className="w-4 h-4" />
                        Table
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4" />
                        Graph
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  {dieselByMachineryView === 'graph' ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={dieselPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {dieselPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => value.toLocaleString()} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Machinery</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Gallons</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dieselChartData.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-900">{item.machinery}</td>
                              <td className="py-3 px-4 text-slate-900">{item.gallons.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Propane Canister Replacements</CardTitle>
                  <CardDescription>Equipment and replacement dates YTD</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPropaneRecordsView(propaneRecordsView === 'graph' ? 'table' : 'graph')}
                  className="gap-2"
                >
                  {propaneRecordsView === 'graph' ? (
                    <>
                      <Table2 className="w-4 h-4" />
                      Table
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      Graph
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {propaneRecordsView === 'graph' ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={propaneChartData.slice(0, 15)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="machinery" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="canisters" fill="#1e40af" name="Canisters" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">Machinery</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">Date of Replacement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {propaneData.slice(-20).reverse().map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-900">{item.machinery}</td>
                            <td className="py-3 px-4 text-slate-900">{item.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Diesel Fuel Usage</CardTitle>
                  <CardDescription>Equipment and gallons pumped YTD</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDieselRecordsView(dieselRecordsView === 'graph' ? 'table' : 'graph')}
                  className="gap-2"
                >
                  {dieselRecordsView === 'graph' ? (
                    <>
                      <Table2 className="w-4 h-4" />
                      Table
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      Graph
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {dieselRecordsView === 'graph' ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dieselChartData.slice(0, 15)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="machinery" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                      <Bar dataKey="gallons" fill="#0c4a6e" name="Gallons" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">Machinery</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">Date Fueled</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">Gallons</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dieselData.slice(-20).reverse().map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-900">{item.machinery}</td>
                            <td className="py-3 px-4 text-slate-900">{item.date}</td>
                            <td className="py-3 px-4 text-slate-900">{item.gallons}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
