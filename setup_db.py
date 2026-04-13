import os
import subprocess
import sys

def run_command(command, cwd=None):
    print(f"🚀 Ejecutando: {command}")
    try:
        result = subprocess.run(command, shell=True, check=True, cwd=cwd)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Error al ejecutar: {command}")
        print(f"Detalle: {e}")
        return False

def main():
    backend_dir = os.path.join(os.getcwd(), "backend")
    
    if not os.path.exists(backend_dir):
        print("❌ No se encontró la carpeta 'backend'. Asegúrate de estar en la raíz del proyecto.")
        sys.exit(1)

    print("--- 🐄 MI HACIENDA - INSTALACIÓN AUTOMÁTICA ---")

    # 1. Instalar dependencias
    if not run_command("npm install", cwd=backend_dir):
        sys.exit(1)

    # 2. Generar cliente Prisma
    if not run_command("npx prisma generate", cwd=backend_dir):
        sys.exit(1)

    # 3. Empujar esquema y migrar (Esto crea la base de datos si no existe)
    print("⚠️  Asegúrate de que PostgreSQL esté corriendo y la URL en .env sea correcta.")
    if not run_command("npx prisma migrate dev --name init_comprehensive", cwd=backend_dir):
        sys.exit(1)

    # 4. Poblar con datos de prueba
    if not run_command("npx prisma db seed", cwd=backend_dir):
        sys.exit(1)

    print("\n✅ ¡Configuración completada con éxito!")
    print("Ahora puedes iniciar el servidor con: cd backend && npm run dev")

if __name__ == "__main__":
    main()
