import uuid
import hashlib
import time

def generate_license_key(user_id: str, product_id: str) -> str:
    """
    Genera una clave de licencia única basada en el usuario, producto y tiempo.
    Formato: OCA-XXXX-XXXX-XXXX
    """
    unique_str = f"{user_id}-{product_id}-{time.time()}"
    hash_obj = hashlib.sha256(unique_str.encode())
    hex_digest = hash_obj.hexdigest().upper()
    
    # Tomar partes del hash para formar la clave
    parts = [hex_digest[i:i+4] for i in range(0, 12, 4)]
    return f"OCA-{''.join(parts[0])}-{''.join(parts[1])}-{''.join(parts[2])}"

def validate_license_format(key: str) -> bool:
    return key.startswith("OCA-") and len(key) == 16
