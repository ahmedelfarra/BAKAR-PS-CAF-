import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('devices');

  const tabs = [
    { id: 'devices', name: 'الأجهزة', icon: '🎮' },
    { id: 'cafe', name: 'الكافيه', icon: '☕' },
    { id: 'inventory', name: 'المخزون', icon: '📦' },
    { id: 'withdrawals', name: 'السحوبات والخرج', icon: '💰' },
    { id: 'settings', name: 'الإعدادات', icon: '⚙️' }
  ];

  const DevicesPage = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 m-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-right">إدارة الأجهزة</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(device => (
          <div key={device} className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-center">
              <div className="text-3xl mb-2">🎮</div>
              <h3 className="text-xl font-bold mb-2">جهاز رقم {device}</h3>
              <div className="text-green-200 font-semibold">متاح</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const CafePage = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 m-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-right">إدارة الكافيه</h2>
      <div className="text-center text-gray-600 py-12">
        <div className="text-6xl mb-4">☕</div>
        <p className="text-xl">جاري تحضير واجهة الكافيه...</p>
      </div>
    </div>
  );

  const InventoryPage = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 m-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-right">إدارة المخزون</h2>
      <div className="text-center text-gray-600 py-12">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-xl">جاري تحضير واجهة المخزون...</p>
      </div>
    </div>
  );

  const WithdrawalsPage = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 m-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-right">السحوبات والمصاريف</h2>
      <div className="text-center text-gray-600 py-12">
        <div className="text-6xl mb-4">💰</div>
        <p className="text-xl">جاري تحضير واجهة السحوبات...</p>
      </div>
    </div>
  );

  const SettingsPage = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 m-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-right">الإعدادات</h2>
      <div className="text-center text-gray-600 py-12">
        <div className="text-6xl mb-4">⚙️</div>
        <p className="text-xl">جاري تحضير واجهة الإعدادات...</p>
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'devices':
        return <DevicesPage />;
      case 'cafe':
        return <CafePage />;
      case 'inventory':
        return <InventoryPage />;
      case 'withdrawals':
        return <WithdrawalsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DevicesPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative">
      {/* Watermark */}
      <div className="watermark">
        BAKAR PS & CAFÉ
      </div>
      
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                <span className="text-yellow-300">BAKAR</span>
                <span className="mx-2 text-white">PS & CAFÉ</span>
              </h1>
              <div className="flex justify-center items-center mt-2 space-x-4">
                <span className="text-2xl">🎮</span>
                <span className="text-white/80 text-lg font-medium">نظام إدارة شامل</span>
                <span className="text-2xl">☕</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-[120px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center space-x-1 py-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 mx-1 my-1 rounded-full font-semibold text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-900 shadow-lg scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20 hover:scale-102'
                }`}
              >
                <span className="ml-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-8 pt-4">
        {renderCurrentPage()}
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/70">
            © 2025 BAKAR PS & CAFÉ - نظام إدارة متكامل
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;