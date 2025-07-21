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

  // Inventory state management
  const [inventory, setInventory] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState({ show: false, action: '', item: null });
  
  // Settings state (للباسورد)
  const [settings, setSettings] = useState({
    deletePassword: '1234', // default password
    currency: 'ج.م'
  });

  // Cafe state management  
  const [customers, setCustomers] = useState([]);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [debts, setDebts] = useState([]); // شكك العملاء

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

  const CafePage = () => {
    
    // Add new customer
    const addCustomer = () => {
      if (!newCustomerName.trim()) {
        alert('يرجى إدخال اسم العميل');
        return;
      }

      const newCustomer = {
        id: Date.now().toString(),
        name: newCustomerName.trim(),
        invoice: [],
        totalAmount: 0,
        discount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        createdAt: new Date()
      };

      setCustomers(prev => [...prev, newCustomer]);
      setSelectedCustomer(newCustomer);
      setNewCustomerName('');
    };

    // Add item to customer invoice
    const addItemToInvoice = (customerId, itemId) => {
      const item = inventory.find(inv => inv.id === itemId);
      if (!item) return;

      setCustomers(prev => prev.map(customer => {
        if (customer.id === customerId) {
          const existingItemIndex = customer.invoice.findIndex(invItem => invItem.id === item.id);
          
          if (existingItemIndex >= 0) {
            // Item exists, increase quantity
            const updatedInvoice = [...customer.invoice];
            updatedInvoice[existingItemIndex].quantity += 1;
            updatedInvoice[existingItemIndex].totalPrice = updatedInvoice[existingItemIndex].quantity * item.price;
            
            const newTotalAmount = updatedInvoice.reduce((sum, invItem) => sum + invItem.totalPrice, 0);
            const newRemainingAmount = newTotalAmount - customer.discount - customer.paidAmount;
            
            return {
              ...customer,
              invoice: updatedInvoice,
              totalAmount: newTotalAmount,
              remainingAmount: newRemainingAmount
            };
          } else {
            // New item, add to invoice
            const newInvoiceItem = {
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: 1,
              totalPrice: item.price
            };
            
            const updatedInvoice = [...customer.invoice, newInvoiceItem];
            const newTotalAmount = updatedInvoice.reduce((sum, invItem) => sum + invItem.totalPrice, 0);
            const newRemainingAmount = newTotalAmount - customer.discount - customer.paidAmount;
            
            return {
              ...customer,
              invoice: updatedInvoice,
              totalAmount: newTotalAmount,
              remainingAmount: newRemainingAmount
            };
          }
        }
        return customer;
      }));

      // Update selected customer
      if (selectedCustomer && selectedCustomer.id === customerId) {
        setSelectedCustomer(prev => {
          const updated = customers.find(c => c.id === customerId);
          return updated || prev;
        });
      }
    };

    // Remove item from invoice
    const removeItemFromInvoice = (customerId, itemId) => {
      setCustomers(prev => prev.map(customer => {
        if (customer.id === customerId) {
          const updatedInvoice = customer.invoice.filter(item => item.id !== itemId);
          const newTotalAmount = updatedInvoice.reduce((sum, invItem) => sum + invItem.totalPrice, 0);
          const newRemainingAmount = newTotalAmount - customer.discount - customer.paidAmount;
          
          return {
            ...customer,
            invoice: updatedInvoice,
            totalAmount: newTotalAmount,
            remainingAmount: newRemainingAmount
          };
        }
        return customer;
      }));

      // Update selected customer
      if (selectedCustomer && selectedCustomer.id === customerId) {
        const updatedCustomer = customers.find(c => c.id === customerId);
        if (updatedCustomer) {
          setSelectedCustomer(updatedCustomer);
        }
      }
    };

    // Calculate customer bill
    const calculateCustomerBill = (customer, discount, paidAmount) => {
      const totalAfterDiscount = customer.totalAmount - parseFloat(discount || 0);
      const remaining = totalAfterDiscount - parseFloat(paidAmount || 0);
      
      const updatedCustomer = {
        ...customer,
        discount: parseFloat(discount || 0),
        paidAmount: parseFloat(paidAmount || 0),
        remainingAmount: remaining
      };

      setCustomers(prev => prev.map(c => 
        c.id === customer.id ? updatedCustomer : c
      ));

      // If fully paid, remove from customers and debts
      if (remaining <= 0) {
        setCustomers(prev => prev.filter(c => c.id !== customer.id));
        setDebts(prev => prev.filter(debt => debt.customerId !== customer.id));
        setSelectedCustomer(null);
        alert('تم تسجيل الدفع وإغلاق الفاتورة بنجاح!');
      } else {
        // Add/update debt record
        const debtRecord = {
          id: customer.id,
          customerId: customer.id,
          customerName: customer.name,
          type: 'cafe',
          amount: remaining,
          date: new Date()
        };

        setDebts(prev => {
          const existingIndex = prev.findIndex(debt => debt.customerId === customer.id && debt.type === 'cafe');
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = debtRecord;
            return updated;
          } else {
            return [...prev, debtRecord];
          }
        });

        setSelectedCustomer(updatedCustomer);
        alert(`تم تسجيل الدفع. الباقي على العميل: ${remaining.toFixed(2)} ${settings.currency}`);
      }
    };

    // Delete customer (with password protection)
    const deleteCustomer = (customerId) => {
      setShowPasswordModal({
        show: true,
        action: 'delete_customer',
        item: customerId
      });
    };

    const handleCustomerPasswordAction = (enteredPassword) => {
      if (enteredPassword !== settings.deletePassword) {
        alert('كلمة المرور غير صحيحة!');
        return;
      }

      if (showPasswordModal.action === 'delete_customer') {
        setCustomers(prev => prev.filter(customer => customer.id !== showPasswordModal.item));
        setDebts(prev => prev.filter(debt => debt.customerId !== showPasswordModal.item));
        if (selectedCustomer && selectedCustomer.id === showPasswordModal.item) {
          setSelectedCustomer(null);
        }
        alert('تم حذف العميل والفاتورة بنجاح!');
      }

      setShowPasswordModal({ show: false, action: '', item: null });
    };

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 m-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-right">إدارة الكافيه</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Right Panel - Customer Management */}
          <div className="order-1 lg:order-2">
            {/* Add New Customer */}
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 text-right">إضافة عميل جديد</h3>
              <div className="flex gap-3">
                <button
                  onClick={addCustomer}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 whitespace-nowrap"
                >
                  ➕ إضافة عميل
                </button>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md text-right"
                  placeholder="اسم العميل"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCustomer();
                    }
                  }}
                />
              </div>
            </div>

            {/* Customer Invoice Details */}
            {selectedCustomer ? (
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="px-4 py-3 bg-blue-50 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <button
                        onClick={() => setSelectedCustomer(null)}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        ← العودة
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      فاتورة العميل: {selectedCustomer.name}
                    </h3>
                  </div>
                  {selectedCustomer.remainingAmount > 0 && (
                    <div className="mt-2 text-right">
                      <span className="text-red-600 font-semibold">
                        باقي حساب سابق: {selectedCustomer.remainingAmount.toFixed(2)} {settings.currency}
                      </span>
                    </div>
                  )}
                </div>

                {/* Add Items Section */}
                <div className="p-4 border-b bg-gray-50">
                  <h4 className="font-semibold mb-3 text-right">إضافة أصناف</h4>
                  {inventory.length === 0 ? (
                    <p className="text-gray-500 text-center">لا توجد أصناف في المخزون</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {inventory.map(item => (
                        <button
                          key={item.id}
                          onClick={() => addItemToInvoice(selectedCustomer.id, item.id)}
                          className="p-3 bg-white border border-gray-300 rounded hover:bg-blue-50 text-right"
                        >
                          <div className="flex justify-between">
                            <span className="text-green-600 font-semibold">
                              {item.price.toFixed(2)} {settings.currency}
                            </span>
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invoice Items */}
                <div className="p-4">
                  <h4 className="font-semibold mb-3 text-right">الأصناف المضافة</h4>
                  {selectedCustomer.invoice.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">لم يتم إضافة أي أصناف بعد</p>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4">
                        {selectedCustomer.invoice.map(item => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <button
                              onClick={() => removeItemFromInvoice(selectedCustomer.id, item.id)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            >
                              🗑️
                            </button>
                            <div className="text-right flex-1 mx-3">
                              <div className="flex justify-between">
                                <span className="font-semibold text-green-600">
                                  {item.totalPrice.toFixed(2)} {settings.currency}
                                </span>
                                <span className="font-medium">{item.name}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                الكمية: {item.quantity} × {item.price.toFixed(2)} {settings.currency}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total and Payment */}
                      <div className="border-t pt-4">
                        <div className="text-center mb-4">
                          <span className="text-xl font-bold text-blue-600">
                            الإجمالي: {selectedCustomer.totalAmount.toFixed(2)} {settings.currency}
                          </span>
                        </div>

                        <CustomerPaymentModal 
                          customer={selectedCustomer}
                          onPayment={calculateCustomerBill}
                          currency={settings.currency}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">👤</div>
                <p className="text-lg">اختر عميل لعرض فاتورته</p>
                <p className="text-sm">أو أضف عميل جديد</p>
              </div>
            )}
          </div>

          {/* Left Panel - Customer List */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-800 text-right">قائمة الفواتير</h3>
              </div>
              
              {customers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-lg">لا توجد فواتير</p>
                  <p className="text-sm">أضف عميل جديد لبدء فاتورة</p>
                </div>
              ) : (
                <div className="divide-y">
                  {customers.map(customer => (
                    <div key={customer.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <button
                            onClick={() => deleteCustomer(customer.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          >
                            🗑️
                          </button>
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            ✏️ تعديل
                          </button>
                        </div>
                        <div className="text-right cursor-pointer flex-1" onClick={() => setSelectedCustomer(customer)}>
                          <div className="font-semibold text-gray-800">{customer.name}</div>
                          <div className="text-sm text-gray-600">
                            الإجمالي: {customer.totalAmount.toFixed(2)} {settings.currency}
                          </div>
                          {customer.remainingAmount > 0 && (
                            <div className="text-sm text-red-600 font-semibold">
                              الباقي: {customer.remainingAmount.toFixed(2)} {settings.currency}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Password Modal for Customer Actions */}
        {showPasswordModal.show && showPasswordModal.action === 'delete_customer' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-bold text-center mb-4">🔒 تأكيد حذف العميل</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">كلمة المرور</label>
                <input
                  type="password"
                  id="customerPasswordInput"
                  className="w-full p-3 border border-gray-300 rounded-md text-right"
                  placeholder="أدخل كلمة المرور"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const password = e.target.value;
                      handleCustomerPasswordAction(password);
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const password = document.getElementById('customerPasswordInput').value;
                    handleCustomerPasswordAction(password);
                    document.getElementById('customerPasswordInput').value = '';
                  }}
                  className="flex-1 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  ✅ تأكيد الحذف
                </button>
                <button
                  onClick={() => setShowPasswordModal({ show: false, action: '', item: null })}
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

  // Customer Payment Modal Component
  const CustomerPaymentModal = ({ customer, onPayment, currency }) => {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [discount, setDiscount] = useState('');
    const [paidAmount, setPaidAmount] = useState('');

    const handlePayment = () => {
      if (!paidAmount) {
        alert('يرجى إدخال المبلغ المدفوع');
        return;
      }

      onPayment(customer, discount, paidAmount);
      setShowPaymentModal(false);
      setDiscount('');
      setPaidAmount('');
    };

    const totalAfterDiscount = customer.totalAmount - parseFloat(discount || 0);
    const remaining = totalAfterDiscount - parseFloat(paidAmount || 0);

    return (
      <>
        <button
          onClick={() => setShowPaymentModal(true)}
          disabled={customer.totalAmount <= 0}
          className="w-full py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          💰 حساب العميل
        </button>

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-bold text-center mb-4">💰 حساب العميل - {customer.name}</h3>
              
              <div className="mb-4 text-center">
                <span className="text-xl font-bold text-blue-600">
                  الإجمالي: {customer.totalAmount.toFixed(2)} {currency}
                </span>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الخصم ({currency})</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-right"
                  placeholder="0"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-right">العميل دفع ({currency})</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-right"
                  placeholder="0"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الباقي</label>
                <div className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md text-right">
                  <span className={`font-semibold ${remaining < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {remaining.toFixed(2)} {currency}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePayment}
                  className="flex-1 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-semibold"
                >
                  ✅ تأكيد الدفع
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const InventoryPage = () => {
    
    // Add new inventory item
    const addInventoryItem = () => {
      if (!newItem.name.trim() || !newItem.price) {
        alert('يرجى إدخال اسم الصنف والسعر');
        return;
      }

      const newInventoryItem = {
        id: Date.now().toString(),
        name: newItem.name.trim(),
        price: parseFloat(newItem.price),
        createdAt: new Date()
      };

      setInventory(prev => [...prev, newInventoryItem]);
      setNewItem({ name: '', price: '' });
      alert('تم إضافة الصنف بنجاح!');
    };

    // Delete inventory item (with password protection)
    const deleteInventoryItem = (itemId) => {
      setShowPasswordModal({
        show: true,
        action: 'delete',
        item: itemId
      });
    };

    // Edit inventory item (with password protection)
    const editInventoryItem = (item) => {
      setShowPasswordModal({
        show: true,
        action: 'edit',
        item: item
      });
    };

    // Password verification and action execution
    const handlePasswordAction = (enteredPassword) => {
      if (enteredPassword !== settings.deletePassword) {
        alert('كلمة المرور غير صحيحة!');
        return;
      }

      if (showPasswordModal.action === 'delete') {
        setInventory(prev => prev.filter(item => item.id !== showPasswordModal.item));
        alert('تم حذف الصنف بنجاح!');
      } else if (showPasswordModal.action === 'edit') {
        setEditingItem(showPasswordModal.item);
      }

      setShowPasswordModal({ show: false, action: '', item: null });
    };

    // Update edited item
    const updateInventoryItem = () => {
      if (!editingItem.name.trim() || !editingItem.price) {
        alert('يرجى إدخال اسم الصنف والسعر');
        return;
      }

      setInventory(prev => prev.map(item => 
        item.id === editingItem.id ? editingItem : item
      ));
      setEditingItem(null);
      alert('تم تحديث الصنف بنجاح!');
    };

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 m-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-right">إدارة المخزون</h2>
        
        {/* Add New Item Section */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 text-right">إضافة صنف جديد</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Item Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">اسم الصنف</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md text-right"
                placeholder="أدخل اسم الصنف"
              />
            </div>

            {/* Price Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">السعر ({settings.currency})</label>
              <input
                type="number"
                step="0.1"
                value={newItem.price}
                onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md text-right"
                placeholder="0.00"
              />
            </div>

            {/* Add Button */}
            <div className="flex items-end">
              <button
                onClick={addInventoryItem}
                className="w-full py-3 bg-green-500 text-white rounded-md hover:bg-green-600 font-semibold"
              >
                ➕ إضافة صنف
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-800 text-right">قائمة الأصناف</h3>
          </div>

          {inventory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-lg">لا توجد أصناف مضافة بعد</p>
              <p className="text-sm">أضف أول صنف للمخزون</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">السعر</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">اسم الصنف</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">#</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => editInventoryItem(item)}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            ✏️ تعديل
                          </button>
                          <button
                            onClick={() => deleteInventoryItem(item.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-green-600">
                          {item.price.toFixed(2)} {settings.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-right text-gray-500">{index + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Password Modal */}
        {showPasswordModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-bold text-center mb-4">
                🔒 تأكيد {showPasswordModal.action === 'delete' ? 'الحذف' : 'التعديل'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">كلمة المرور</label>
                <input
                  type="password"
                  id="passwordInput"
                  className="w-full p-3 border border-gray-300 rounded-md text-right"
                  placeholder="أدخل كلمة المرور"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const password = e.target.value;
                      handlePasswordAction(password);
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const password = document.getElementById('passwordInput').value;
                    handlePasswordAction(password);
                    document.getElementById('passwordInput').value = '';
                  }}
                  className="flex-1 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  ✅ تأكيد
                </button>
                <button
                  onClick={() => setShowPasswordModal({ show: false, action: '', item: null })}
                  className="flex-1 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-bold text-center mb-4">✏️ تعديل الصنف</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">اسم الصنف</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md text-right"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">السعر ({settings.currency})</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-md text-right"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={updateInventoryItem}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  💾 حفظ التغييرات
                </button>
                <button
                  onClick={() => setEditingItem(null)}
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