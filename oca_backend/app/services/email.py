import os
import httpx
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_URL = "https://api.resend.com/emails"

async def send_license_email(user_email: str, license_key: str, product_name: str):
    """
    Envía un correo con la licencia generada usando Resend.
    """
    if not RESEND_API_KEY or RESEND_API_KEY == "tu_api_key_de_resend":
        print(f"MOCK EMAIL to {user_email}: Tu licencia para {product_name} es {license_key}")
        return True

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "from": "OCA Digital <notificaciones@tu-dominio.com>",
        "to": [user_email],
        "subject": "¡Tu licencia OCA está lista!",
        "html": f"""
            <h1>¡Gracias por tu compra!</h1>
            <p>Se ha activado tu servicio: <strong>{product_name}</strong></p>
            <p>Tu clave de licencia es:</p>
            <div style="background: #f4f4f4; padding: 20px; font-family: monospace; font-size: 20px; border-radius: 5px;">
                {license_key}
            </div>
            <p>Puedes empezar a usar tu producto ahora mismo.</p>
        """
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(RESEND_URL, headers=headers, json=payload)
        return response.status_code == 200 or response.status_code == 201
