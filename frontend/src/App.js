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

  // Device state management
  const [devices, setDevices] = useState({
    room1: { name: 'Room 1', isRoom: true, ...getInitialDeviceState() },
    room2: { name: 'Room 2', isRoom: true, ...getInitialDeviceState() },
    room3: { name: 'Room 3', isRoom: true, ...getInitialDeviceState() },
    ps1: { name: 'PS 1', isRoom: false, ...getInitialDeviceState() },
    ps2: { name: 'PS 2', isRoom: false, ...getInitialDeviceState() },
    ps3: { name: 'PS 3', isRoom: false, ...getInitialDeviceState() }
  });

  function getInitialDeviceState() {
    return {
      usageType: '',
      controllerType: '',
      airConditioner: 'لا',
      price: '',
      timer: { hours: 0, minutes: 0, seconds: 0 },
      isRunning: false,
      startTime: null,
      totalCost: 0,
      canCalculate: false,
      showPaymentModal: false,
      discount: '',
      paidAmount: '',
      remaining: 0
    };
  }

  // Timer functions
  const formatTime = (timer) => {
    return `${String(timer.hours).padStart(2, '0')}:${String(timer.minutes).padStart(2, '0')}:${String(timer.seconds).padStart(2, '0')}`;
  };

  const calculateCost = (timer, hourlyRate) => {
    const totalSeconds = timer.hours * 3600 + timer.minutes * 60 + timer.seconds;
    const totalHours = totalSeconds / 3600;
    return totalHours * parseFloat(hourlyRate || 0);
  };

  const startTimer = (deviceKey) => {
    if (!devices[deviceKey].price) {
      alert('يرجى إدخال السعر أولاً');
      return;
    }

    setDevices(prev => ({
      ...prev,
      [deviceKey]: {
        ...prev[deviceKey],
        isRunning: true,
        startTime: Date.now()
      }
    }));

    // Start the timer interval
    const interval = setInterval(() => {
      setDevices(prevDevices => {
        const device = prevDevices[deviceKey];
        if (!device.isRunning) {
          clearInterval(interval);
          return prevDevices;
        }

        const elapsed = Date.now() - device.startTime;
        const newSeconds = Math.floor(elapsed / 1000);
        const hours = Math.floor(newSeconds / 3600);
        const minutes = Math.floor((newSeconds % 3600) / 60);
        const seconds = newSeconds % 60;

        const newTimer = { hours, minutes, seconds };
        const newCost = calculateCost(newTimer, device.price);

        return {
          ...prevDevices,
          [deviceKey]: {
            ...device,
            timer: newTimer,
            totalCost: newCost
          }
        };
      });
    }, 1000);
  };

  const stopTimer = (deviceKey) => {
    setDevices(prev => ({
      ...prev,
      [deviceKey]: {
        ...prev[deviceKey],
        isRunning: false,
        canCalculate: true
      }
    }));
  };

  const resetTimer = (deviceKey) => {
    setDevices(prev => ({
      ...prev,
      [deviceKey]: {
        ...prev[deviceKey],
        timer: { hours: 0, minutes: 0, seconds: 0 },
        isRunning: false,
        startTime: null,
        totalCost: 0,
        canCalculate: false
      }
    }));
  };

  const updateDeviceField = (deviceKey, field, value) => {
    setDevices(prev => {
      const newState = {
        ...prev,
        [deviceKey]: {
          ...prev[deviceKey],
          [field]: value
        }
      };

      // Handle conditional fields
      if (field === 'usageType') {
        if (value !== 'PS4' && value !== 'PS5') {
          newState[deviceKey].controllerType = '';
        }
      }

      // Calculate remaining when discount or paid amount changes
      if (field === 'discount' || field === 'paidAmount') {
        const device = newState[deviceKey];
        const totalAfterDiscount = device.totalCost - parseFloat(device.discount || 0);
        const remaining = totalAfterDiscount - parseFloat(device.paidAmount || 0);
        newState[deviceKey].remaining = remaining;
      }

      return newState;
    });
  };

  const DeviceCard = ({ deviceKey, device }) => {
    const usageOptions = device.isRoom 
      ? ['PS4', 'PS5', 'فيلم', 'جلسة']
      : ['PS4', 'PS5', 'فيلم'];

    const showControllers = device.usageType === 'PS4' || device.usageType === 'PS5';

    return (
      <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200">
        {/* Device Header */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{device.name}</h3>
          <div className="text-2xl mb-2">🎮</div>
        </div>

        {/* Usage Type Dropdown */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">نوع الاستخدام</label>
          <select
            value={device.usageType}
            onChange={(e) => updateDeviceField(deviceKey, 'usageType', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-right"
          >
            <option value="">اختر نوع الاستخدام</option>
            {usageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Controller Type Dropdown (conditional) */}
        {showControllers && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">عدد الأذرع</label>
            <select
              value={device.controllerType}
              onChange={(e) => updateDeviceField(deviceKey, 'controllerType', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-right"
            >
              <option value="">اختر عدد الأذرع</option>
              <option value="فردي">فردي</option>
              <option value="زوجي">زوجي</option>
            </select>
          </div>
        )}

        {/* Air Conditioner Dropdown (only for Rooms) */}
        {device.isRoom && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">استخدام تكييف</label>
            <select
              value={device.airConditioner}
              onChange={(e) => updateDeviceField(deviceKey, 'airConditioner', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-right"
            >
              <option value="نعم">نعم</option>
              <option value="لا">لا</option>
            </select>
          </div>
        )}

        {/* Price Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">السعر (ج.م/ساعة)</label>
          <input
            type="number"
            value={device.price}
            onChange={(e) => updateDeviceField(deviceKey, 'price', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            placeholder="أدخل سعر الساعة"
          />
        </div>

        {/* Timer Display */}
        <div className="mb-4">
          <div className="bg-black text-green-400 p-3 rounded-lg text-center font-mono text-xl">
            {formatTime(device.timer)}
          </div>
          <div className="text-center mt-2">
            <span className="text-lg font-semibold text-blue-600">
              التكلفة: {device.totalCost.toFixed(2)} ج.م
            </span>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => startTimer(deviceKey)}
            disabled={device.isRunning || !device.price}
            className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            ▶ تشغيل
          </button>
          <button
            onClick={() => stopTimer(deviceKey)}
            disabled={!device.isRunning}
            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            ⏸ إيقاف
          </button>
          <button
            onClick={() => resetTimer(deviceKey)}
            disabled={device.isRunning}
            className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            ↻ استعادة
          </button>
        </div>

        {/* Calculate Customer Bill Button */}
        <button
          onClick={() => updateDeviceField(deviceKey, 'showPaymentModal', true)}
          disabled={!device.canCalculate}
          className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          🧾 حساب العميل
        </button>

        {/* Payment Modal */}
        {device.showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
              <h3 className="text-lg font-bold text-center mb-4">حساب العميل - {device.name}</h3>
              
              {/* Total */}
              <div className="mb-4 text-center">
                <span className="text-xl font-bold text-blue-600">
                  الإجمالي: {device.totalCost.toFixed(2)} ج.م
                </span>
              </div>

              {/* Discount Input */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">الخصم (ج.م)</label>
                <input
                  type="number"
                  value={device.discount}
                  onChange={(e) => updateDeviceField(deviceKey, 'discount', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-right"
                  placeholder="0"
                />
              </div>

              {/* Paid Amount Input */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">العميل دفع (ج.م)</label>
                <input
                  type="number"
                  value={device.paidAmount}
                  onChange={(e) => updateDeviceField(deviceKey, 'paidAmount', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-right"
                  placeholder="0"
                />
              </div>

              {/* Remaining Amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">الباقي</label>
                <div className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md text-right">
                  <span className={`font-semibold ${device.remaining < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {device.remaining.toFixed(2)} ج.م
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Here you would save to database/daily report
                    alert('تم تسجيل الدفع بنجاح!');
                    updateDeviceField(deviceKey, 'showPaymentModal', false);
                    // Reset device after payment
                    resetTimer(deviceKey);
                    updateDeviceField(deviceKey, 'discount', '');
                    updateDeviceField(deviceKey, 'paidAmount', '');
                    updateDeviceField(deviceKey, 'remaining', 0);
                  }}
                  className="flex-1 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-semibold"
                >
                  ✅ تأكيد الدفع
                </button>
                <button
                  onClick={() => updateDeviceField(deviceKey, 'showPaymentModal', false)}
                  className="flex-1 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const DevicesPage = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 m-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-right">إدارة الأجهزة</h2>
      
      {/* Room Devices (Top Row) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3 text-right">غرف الأفلام</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DeviceCard deviceKey="room1" device={devices.room1} />
          <DeviceCard deviceKey="room2" device={devices.room2} />
          <DeviceCard deviceKey="room3" device={devices.room3} />
        </div>
      </div>

      {/* PS Devices (Bottom Row) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3 text-right">أجهزة البلايستيشن</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DeviceCard deviceKey="ps1" device={devices.ps1} />
          <DeviceCard deviceKey="ps2" device={devices.ps2} />
          <DeviceCard deviceKey="ps3" device={devices.ps3} />
        </div>
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