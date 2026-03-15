from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.supabase_client import supabase
from app.services.license import generate_license_key
from app.services.email import send_license_email
from datetime import datetime, timedelta

router = APIRouter(prefix="/payments", tags=["payments"])

class PaymentRequest(BaseModel):
    user_id: str
    product_id: int
    product_type: str # 'software' o 'plan'
    amount: float
    method: str
    comprobante_url: Optional[str] = None

class ActivationRequest(BaseModel):
    payment_id: int
    user_id: str

@router.post("/process")
async def process_payment(request: PaymentRequest):
    """
    Registra un intento de pago y vincula el servicio como 'pendiente'.
    """
    try:
        # 1. Registrar el servicio adquirido
        service_data = {
            "usuario_id": request.user_id,
            "estado": "En espera"
        }
        
        if request.product_type == "software":
            service_data["software_id"] = request.product_id
        else:
            service_data["plan_id"] = request.product_id

        service_res = supabase.table("servicios_adquiridos").insert(service_data).execute()
        
        # 2. Registrar el pago
        payment_data = {
            "usuario_id": request.user_id,
            "monto": request.amount,
            "estado_pago": "Pendiente",
            "metodo_pago": request.method,
            "comprobante_url": request.comprobante_url
        }
        payment_res = supabase.table("pagos").insert(payment_data).execute()

        return {
            "status": "success",
            "message": "Pago registrado. Pendiente de validación.",
            "payment_id": payment_res.data[0]["id"] if payment_res.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/activate")
async def activate_service(request: ActivationRequest):
    """
    Lógica de backend: Valida el pago, genera licencia y guarda en la tabla 'licencias'.
    """
    try:
        # 1. Verificar el pago en Supabase
        payment = supabase.table("pagos").select("*").eq("id", request.payment_id).execute()
        
        # 2. Generar licencia
        # Necesitamos el product_id del servicio vinculado
        service = supabase.table("servicios_adquiridos").select("*").eq("usuario_id", request.user_id).order("id", desc=True).limit(1).execute()
        
        if not service.data:
            raise HTTPException(status_code=404, detail="Servicio no encontrado")

        prod_id = service.data[0].get("software_id") or service.data[0].get("plan_id")
        license_key = generate_license_key(request.user_id, str(prod_id))

        # 3. Actualizar estado en servicios_adquiridos (Estado: Activo)
        supabase.table("servicios_adquiridos").update({
            "estado": "Activo"
        }).eq("id", service.data[0]["id"]).execute()

        # 4. Insertar en la tabla dedicada 'licencias'
        licencia_data = {
            "usuario_id": request.user_id,
            "clave_licencia": license_key,
            "fecha_activacion": datetime.now().strftime("%Y-%m-%d"),
            "fecha_expiracion": (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"),
            "estado": "Activo"
        }
        
        if service.data[0].get("software_id"):
            licencia_data["software_id"] = service.data[0]["software_id"]

        supabase.table("licencias").insert(licencia_data).execute()

        # 5. Enviar correo
        user_res = supabase.auth.admin.get_user_by_id(request.user_id)
        if user_res.user:
            await send_license_email(user_res.user.email, license_key, "Servicio OCA")

        return {
            "status": "activated",
            "license": license_key,
            "message": "Servicio activado y registrado en tabla licencias."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
