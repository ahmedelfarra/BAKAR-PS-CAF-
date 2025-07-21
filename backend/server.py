from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime
import uuid

# Initialize FastAPI app
app = FastAPI(title="BAKAR PS & CAFÉ Management System")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client.bakar_ps_cafe

# Collections
devices_collection = db.devices
sessions_collection = db.sessions
cafe_orders_collection = db.cafe_orders
inventory_collection = db.inventory
withdrawals_collection = db.withdrawals
settings_collection = db.settings

# Pydantic models
class Device(BaseModel):
    id: str
    name: str
    status: str  # available, occupied, maintenance
    current_session_id: Optional[str] = None

class GameSession(BaseModel):
    id: str
    device_id: str
    customer_name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    hourly_rate: float
    total_cost: Optional[float] = None
    status: str  # active, completed

class CafeOrder(BaseModel):
    id: str
    customer_name: str
    items: List[dict]  # [{"name": "شاي", "price": 5, "quantity": 2}]
    total_amount: float
    status: str  # pending, completed, cancelled
    created_at: datetime

class InventoryItem(BaseModel):
    id: str
    name: str
    category: str  # drinks, snacks, gaming_accessories
    quantity: int
    price: float
    cost: float
    reorder_level: int

class Withdrawal(BaseModel):
    id: str
    amount: float
    description: str
    category: str  # expense, withdrawal
    date: datetime

class Settings(BaseModel):
    hourly_rate: float
    currency: str
    cafe_name: str
    tax_rate: float

# Initialize default data
@app.on_event("startup")
async def startup_event():
    # Initialize devices if they don't exist
    if devices_collection.count_documents({}) == 0:
        default_devices = []
        for i in range(1, 7):
            device = {
                "id": f"device_{i}",
                "name": f"جهاز رقم {i}",
                "status": "available",
                "current_session_id": None
            }
            default_devices.append(device)
        devices_collection.insert_many(default_devices)
    
    # Initialize settings if they don't exist
    if settings_collection.count_documents({}) == 0:
        default_settings = {
            "id": "main_settings",
            "hourly_rate": 10.0,
            "currency": "ج.م",
            "cafe_name": "BAKAR PS & CAFÉ",
            "tax_rate": 0.14
        }
        settings_collection.insert_one(default_settings)

# Device Management APIs
@app.get("/api/devices")
async def get_devices():
    devices = list(devices_collection.find({}, {"_id": 0}))
    return devices

@app.get("/api/devices/{device_id}")
async def get_device(device_id: str):
    device = devices_collection.find_one({"id": device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@app.put("/api/devices/{device_id}/status")
async def update_device_status(device_id: str, status: dict):
    result = devices_collection.update_one(
        {"id": device_id},
        {"$set": {"status": status["status"]}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"message": "Device status updated"}

# Session Management APIs
@app.post("/api/sessions")
async def create_session(session_data: dict):
    session_id = str(uuid.uuid4())
    session = {
        "id": session_id,
        "device_id": session_data["device_id"],
        "customer_name": session_data["customer_name"],
        "start_time": datetime.now(),
        "end_time": None,
        "hourly_rate": session_data.get("hourly_rate", 10.0),
        "total_cost": None,
        "status": "active"
    }
    
    # Update device status
    devices_collection.update_one(
        {"id": session_data["device_id"]},
        {"$set": {"status": "occupied", "current_session_id": session_id}}
    )
    
    sessions_collection.insert_one(session)
    return {"session_id": session_id, "message": "Session created"}

@app.get("/api/sessions")
async def get_sessions():
    sessions = list(sessions_collection.find({}, {"_id": 0}))
    return sessions

@app.get("/api/sessions/active")
async def get_active_sessions():
    sessions = list(sessions_collection.find({"status": "active"}, {"_id": 0}))
    return sessions

@app.put("/api/sessions/{session_id}/end")
async def end_session(session_id: str):
    session = sessions_collection.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    end_time = datetime.now()
    start_time = session["start_time"]
    duration_hours = (end_time - start_time).total_seconds() / 3600
    total_cost = duration_hours * session["hourly_rate"]
    
    # Update session
    sessions_collection.update_one(
        {"id": session_id},
        {"$set": {
            "end_time": end_time,
            "total_cost": round(total_cost, 2),
            "status": "completed"
        }}
    )
    
    # Update device status
    devices_collection.update_one(
        {"id": session["device_id"]},
        {"$set": {"status": "available", "current_session_id": None}}
    )
    
    return {"message": "Session ended", "total_cost": round(total_cost, 2)}

# Cafe Orders APIs
@app.post("/api/cafe-orders")
async def create_cafe_order(order_data: dict):
    order_id = str(uuid.uuid4())
    order = {
        "id": order_id,
        "customer_name": order_data["customer_name"],
        "items": order_data["items"],
        "total_amount": order_data["total_amount"],
        "status": "pending",
        "created_at": datetime.now()
    }
    cafe_orders_collection.insert_one(order)
    return {"order_id": order_id, "message": "Order created"}

@app.get("/api/cafe-orders")
async def get_cafe_orders():
    orders = list(cafe_orders_collection.find({}, {"_id": 0}))
    return orders

# Inventory APIs
@app.get("/api/inventory")
async def get_inventory():
    inventory = list(inventory_collection.find({}, {"_id": 0}))
    return inventory

@app.post("/api/inventory")
async def add_inventory_item(item_data: dict):
    item_id = str(uuid.uuid4())
    item = {
        "id": item_id,
        "name": item_data["name"],
        "category": item_data["category"],
        "quantity": item_data["quantity"],
        "price": item_data["price"],
        "cost": item_data["cost"],
        "reorder_level": item_data.get("reorder_level", 10)
    }
    inventory_collection.insert_one(item)
    return {"item_id": item_id, "message": "Inventory item added"}

# Withdrawals APIs
@app.get("/api/withdrawals")
async def get_withdrawals():
    withdrawals = list(withdrawals_collection.find({}, {"_id": 0}))
    return withdrawals

@app.post("/api/withdrawals")
async def create_withdrawal(withdrawal_data: dict):
    withdrawal_id = str(uuid.uuid4())
    withdrawal = {
        "id": withdrawal_id,
        "amount": withdrawal_data["amount"],
        "description": withdrawal_data["description"],
        "category": withdrawal_data["category"],
        "date": datetime.now()
    }
    withdrawals_collection.insert_one(withdrawal)
    return {"withdrawal_id": withdrawal_id, "message": "Withdrawal recorded"}

# Settings APIs
@app.get("/api/settings")
async def get_settings():
    settings = settings_collection.find_one({}, {"_id": 0})
    return settings

@app.put("/api/settings")
async def update_settings(settings_data: dict):
    settings_collection.update_one(
        {"id": "main_settings"},
        {"$set": settings_data},
        upsert=True
    )
    return {"message": "Settings updated"}

# Dashboard APIs
@app.get("/api/dashboard")
async def get_dashboard_stats():
    # Get device stats
    total_devices = devices_collection.count_documents({})
    available_devices = devices_collection.count_documents({"status": "available"})
    occupied_devices = devices_collection.count_documents({"status": "occupied"})
    
    # Get session stats
    active_sessions = sessions_collection.count_documents({"status": "active"})
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_sessions = sessions_collection.count_documents({"start_time": {"$gte": today}})
    
    # Get revenue stats
    today_revenue = 0
    completed_sessions_today = list(sessions_collection.find({
        "status": "completed",
        "end_time": {"$gte": today},
        "total_cost": {"$exists": True}
    }))
    today_revenue = sum(session.get("total_cost", 0) for session in completed_sessions_today)
    
    return {
        "devices": {
            "total": total_devices,
            "available": available_devices,
            "occupied": occupied_devices,
            "maintenance": total_devices - available_devices - occupied_devices
        },
        "sessions": {
            "active": active_sessions,
            "today_total": today_sessions
        },
        "revenue": {
            "today": round(today_revenue, 2)
        }
    }

@app.get("/")
async def root():
    return {"message": "BAKAR PS & CAFÉ Management System API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)