from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class TextInput(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    x: float
    y: float
    width: float
    height: float
    placeholder: str
    fontSize: int = 16
    fontFamily: str = "Arial"
    color: str = "#000000"

class Template(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    width: int
    height: int
    backgroundImage: str  # base64 encoded
    inputs: List[TextInput] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class TemplateCreate(BaseModel):
    name: str
    width: int
    height: int
    backgroundImage: str
    inputs: List[TextInput] = []

class CertificateData(BaseModel):
    templateId: str
    inputValues: Dict[str, str]

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str


# Template routes
@api_router.post("/templates", response_model=Template)
async def create_template(template: TemplateCreate):
    template_dict = template.dict()
    template_obj = Template(**template_dict)
    await db.templates.insert_one(template_obj.dict())
    return template_obj

@api_router.get("/templates", response_model=List[Template])
async def get_templates():
    templates = await db.templates.find().to_list(1000)
    return [Template(**template) for template in templates]

@api_router.get("/templates/{template_id}", response_model=Template)
async def get_template(template_id: str):
    template = await db.templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return Template(**template)

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    result = await db.templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted successfully"}

# Certificate generation route
@api_router.post("/certificates/generate")
async def generate_certificate(data: CertificateData):
    template = await db.templates.find_one({"id": data.templateId})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Return the template with filled values for PDF generation on frontend
    return {
        "template": Template(**template),
        "inputValues": data.inputValues
    }

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Certificate Generator API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()