from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.routes import payments

# Cargar variables de entorno
load_dotenv()

app = FastAPI(
    title="OCA Digital Solutions API",
    description="Backend para gestión de pagos, licencias y servicios",
    version="1.0.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar los dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(payments.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "OCA Backend API is running",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
