"""
GREENUP - Backend Flask + MySQL
--------------------------------
Servidor actualizado con soporte para gestión de perfil, huella de carbono y misiones.
"""

import os
from flask import Flask, request, jsonify, session, send_from_directory
import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# ============================================================
# CONFIGURACIÓN DE LA BASE DE DATOS Y CARPETAS
# ============================================================
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345",   # <-- Poné tu contraseña real de MySQL
}
DB_NAME = "greenup_db"

MAX_MISIONES_POR_DIA = 3
MIN_EVIDENCIA_CARACTERES = 15

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=None)
app.secret_key = "clave-secreta-greenup-2024"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ============================================================
# CATÁLOGO DE MISIONES
# ============================================================
MISIONES = [
    {"id": 1, "categoria": "Movilidad", "descripcion": "Caminá o andá en bici en vez de auto/moto por un día.", "xp": 600},
    {"id": 2, "categoria": "Movilidad", "descripcion": "Usá transporte público en vez de auto durante una semana.", "xp": 1200},
    {"id": 3, "categoria": "Movilidad", "descripcion": "Compartí el auto (carpooling) con un compañero o familiar.", "xp": 700},
    {"id": 4, "categoria": "Movilidad", "descripcion": "Hacé un trayecto habitual caminando en vez de en vehículo.", "xp": 500},
    {"id": 5, "categoria": "Movilidad", "descripcion": "Dejá el auto estacionado un fin de semana completo.", "xp": 1000},
    {"id": 6, "categoria": "Movilidad", "descripcion": "Planificá tus recorridos de la semana para hacer menos viajes en auto.", "xp": 650},
    {"id": 7, "categoria": "Movilidad", "descripcion": "Probá una bici pública o de alquiler en vez de tu medio habitual.", "xp": 550},

    {"id": 8, "categoria": "Energía", "descripcion": "Desenchufá los aparatos que no uses durante un día completo.", "xp": 500},
    {"id": 9, "categoria": "Energía", "descripcion": "Cambiá una lámpara de tu casa por una de bajo consumo (LED).", "xp": 700},
    {"id": 10, "categoria": "Energía", "descripcion": "Apagá las luces de los ambientes vacíos durante una semana.", "xp": 600},
    {"id": 11, "categoria": "Energía", "descripcion": "Bajá un grado la calefacción o subí uno el aire acondicionado.", "xp": 650},
    {"id": 12, "categoria": "Energía", "descripcion": "Usá luz natural en vez de artificial durante el día.", "xp": 500},
    {"id": 13, "categoria": "Energía", "descripcion": "Lavá la ropa con agua fría en vez de caliente.", "xp": 600},
    {"id": 14, "categoria": "Energía", "descripcion": "Desconectá el router/wifi por la noche durante una semana.", "xp": 550},

    {"id": 15, "categoria": "Agua", "descripcion": "Cerrá la canilla mientras te cepillás los dientes durante una semana.", "xp": 500},
    {"id": 16, "categoria": "Agua", "descripcion": "Reducí el tiempo de ducha a menos de 5 minutos durante 3 días.", "xp": 700},
    {"id": 17, "categoria": "Agua", "descripcion": "Juntá agua de lluvia para regar las plantas.", "xp": 800},
    {"id": 18, "categoria": "Agua", "descripcion": "Revisá si hay alguna canilla goteando en tu casa y arreglala.", "xp": 900},
    {"id": 19, "categoria": "Agua", "descripcion": "Regá las plantas con agua reutilizada (de cocinar, por ejemplo).", "xp": 650},
    {"id": 20, "categoria": "Agua", "descripcion": "Usá un balde en vez de manguera para lavar el auto o la vereda.", "xp": 700},
    {"id": 21, "categoria": "Agua", "descripcion": "Llená la lavadora o el lavavajillas completo antes de usarlo.", "xp": 600},

    {"id": 22, "categoria": "Reciclaje", "descripcion": "Separá tus residuos en orgánicos, plásticos, papel y vidrio durante una semana.", "xp": 700},
    {"id": 23, "categoria": "Reciclaje", "descripcion": "Llevá 5 botellas o latas a un punto de reciclaje.", "xp": 800},
    {"id": 24, "categoria": "Reciclaje", "descripcion": "Reutilizá un frasco o botella para otro uso en tu casa.", "xp": 500},
    {"id": 25, "categoria": "Reciclaje", "descripcion": "Hacé compost con residuos orgánicos de tu casa.", "xp": 1000},
    {"id": 26, "categoria": "Reciclaje", "descripcion": "Fabricá algo nuevo con material reciclado (maceta, portalápices, etc).", "xp": 900},
    {"id": 27, "categoria": "Reciclaje", "descripcion": "Reemplazá una bolsa plástica por una bolsa reutilizable al comprar.", "xp": 600},
    {"id": 28, "categoria": "Reciclaje", "descripcion": "Doná ropa o cosas que ya no uses en vez de tirarlas.", "xp": 700},
    {"id": 29, "categoria": "Reciclaje", "descripcion": "Organizá una mini campaña de separación de residuos en tu casa o tu curso.", "xp": 1200},

    {"id": 30, "categoria": "Alimentación", "descripcion": "Comé al menos una comida vegetariana en la semana.", "xp": 700},
    {"id": 31, "categoria": "Alimentación", "descripcion": "Comprá frutas o verduras de estación y de productor local.", "xp": 650},
    {"id": 32, "categoria": "Alimentación", "descripcion": "Evitá desperdiciar comida durante una semana (aprovechá las sobras).", "xp": 800},
    {"id": 33, "categoria": "Alimentación", "descripcion": "Llevá tu propia botella reutilizable en vez de comprar agua embotellada.", "xp": 550},
    {"id": 34, "categoria": "Alimentación", "descripcion": "Cociná algo con ingredientes que ibas a tirar.", "xp": 700},
    {"id": 35, "categoria": "Alimentación", "descripcion": "Reducí el consumo de productos ultraprocesados durante 3 días.", "xp": 600},
    {"id": 36, "categoria": "Alimentación", "descripcion": "Armá una lista de compras antes de ir al supermercado para evitar comprar de más.", "xp": 500},

    {"id": 37, "categoria": "Consumo consciente", "descripcion": "Reparaste un objeto roto en vez de comprar uno nuevo.", "xp": 900},
    {"id": 38, "categoria": "Consumo consciente", "descripcion": "Evitá una compra impulsiva durante una semana.", "xp": 600},
    {"id": 39, "categoria": "Consumo consciente", "descripcion": "Investigá el origen o la huella de un producto que consumís seguido.", "xp": 700},
    {"id": 40, "categoria": "Consumo consciente", "descripcion": "Prestá o pedí prestado algo en vez de comprarlo.", "xp": 650},
    {"id": 41, "categoria": "Consumo consciente", "descripcion": "Elegí en el supermercado un producto con menos empaque plástico.", "xp": 550},
    {"id": 42, "categoria": "Consumo consciente", "descripcion": "Usá una app o sitio de segunda mano para vender o comprar algo.", "xp": 800},
    {"id": 43, "categoria": "Consumo consciente", "descripcion": "Calculá cuánta ropa comprás al mes y proponete un objetivo para reducirla.", "xp": 700},

    {"id": 44, "categoria": "Naturaleza y comunidad", "descripcion": "Plantá un árbol, una planta o una semilla.", "xp": 1200},
    {"id": 45, "categoria": "Naturaleza y comunidad", "descripcion": "Cuidá una planta durante una semana (regarla, revisar que crezca bien).", "xp": 700},
    {"id": 46, "categoria": "Naturaleza y comunidad", "descripcion": "Juntá basura en una plaza, playa o espacio público cercano.", "xp": 1000},
    {"id": 47, "categoria": "Naturaleza y comunidad", "descripcion": "Contale a un familiar o amigo algo que aprendiste sobre el ambiente.", "xp": 500},
    {"id": 48, "categoria": "Naturaleza y comunidad", "descripcion": "Sumate a una actividad o grupo ambiental de tu barrio o escuela.", "xp": 1100},
    {"id": 49, "categoria": "Naturaleza y comunidad", "descripcion": "Hacé un cartel o publicación sobre cuidado ambiental para compartir.", "xp": 600},
    {"id": 50, "categoria": "Reto semanal", "descripcion": "Reto semanal: combiná al menos 3 misiones de esta lista en la misma semana y contá cómo te fue.", "xp": 2500},
]

MISIONES_POR_ID = {m["id"]: m for m in MISIONES}

def calcular_progreso(nivel_actual, experiencia_actual, xp_ganado):
    experiencia = experiencia_actual + xp_ganado
    nivel = nivel_actual
    subio_nivel = False
    necesaria = 2000 * nivel
    while experiencia >= necesaria:
        subio_nivel = True
        experiencia -= necesaria
        nivel += 1
        necesaria = 2000 * nivel
    return nivel, experiencia, subio_nivel

def get_connection(with_db=True):
    config = DB_CONFIG.copy()
    if with_db:
        config["database"] = DB_NAME
    return mysql.connector.connect(**config)

def inicializar_base_datos():
    conexion = get_connection(with_db=False)
    cursor = conexion.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
    conexion.commit()
    cursor.close()
    conexion.close()

    conexion = get_connection(with_db=True)
    cursor = conexion.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(150) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            nivel INT NOT NULL DEFAULT 1,
            experiencia INT NOT NULL DEFAULT 0,
            huella FLOAT NULL,
            bio TEXT NULL,
            ubicacion VARCHAR(150) NULL,
            avatar_url VARCHAR(255) NULL,
            banner_url VARCHAR(255) NULL,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conexion.commit()

    # Actualizar columnas dinámicamente si la tabla ya existía
    columnas = [
        ("nivel", "INT NOT NULL DEFAULT 1"),
        ("experiencia", "INT NOT NULL DEFAULT 0"),
        ("huella", "FLOAT NULL"),
        ("bio", "TEXT NULL"),
        ("ubicacion", "VARCHAR(150) NULL"),
        ("avatar_url", "VARCHAR(255) NULL"),
        ("banner_url", "VARCHAR(255) NULL"),
    ]
    for columna, definicion in columnas:
        cursor.execute("SHOW COLUMNS FROM usuarios LIKE %s", (columna,))
        if not cursor.fetchone():
            cursor.execute(f"ALTER TABLE usuarios ADD COLUMN {columna} {definicion}")
            conexion.commit()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS misiones_completadas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            mision_id INT NOT NULL,
            evidencia TEXT NOT NULL,
            fecha_completada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unico_usuario_mision (usuario_id, mision_id),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    """)
    conexion.commit()
    cursor.close()
    conexion.close()
    print("Base de datos y tablas de GREENUP verificadas correctamente.")

# ============================================================
# RUTAS DE ARCHIVOS ESTÁTICOS
# ============================================================
@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")

@app.route("/uploads/<filename>")
def serve_uploads(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route("/<path:filename>")
def archivos_estaticos(filename):
    return send_from_directory(BASE_DIR, filename)

# ============================================================
# API DE AUTENTICACIÓN
# ============================================================
@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.get_json(silent=True) or {}
    nombre = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not nombre or not email or not password:
        return jsonify({"ok": False, "message": "Completá todos los campos."}), 400

    try:
        conexion = get_connection()
        cursor = conexion.cursor()
        cursor.execute("SELECT id FROM usuarios WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conexion.close()
            return jsonify({"ok": False, "message": "Ya existe una cuenta con ese email."}), 409

        password_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO usuarios (nombre, email, password_hash) VALUES (%s, %s, %s)",
            (nombre, email, password_hash)
        )
        conexion.commit()
        user_id = cursor.lastrowid
        cursor.close()
        conexion.close()

        session["user_id"] = user_id
        session["user_name"] = nombre
        return jsonify({"ok": True, "name": nombre})
    except Error as err:
        return jsonify({"ok": False, "message": f"Error de base de datos: {err}"}), 500

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    try:
        conexion = get_connection()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT id, nombre, password_hash FROM usuarios WHERE email = %s", (email,))
        usuario = cursor.fetchone()
        cursor.close()
        conexion.close()

        if not usuario or not check_password_hash(usuario["password_hash"], password):
            return jsonify({"ok": False, "message": "Email o contraseña incorrectos."}), 401

        session["user_id"] = usuario["id"]
        session["user_name"] = usuario["nombre"]
        return jsonify({"ok": True, "name": usuario["nombre"]})
    except Error as err:
        return jsonify({"ok": False, "message": f"Error de base de datos: {err}"}), 500

@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"ok": True})

@app.route("/api/session", methods=["GET"])
def api_session():
    if "user_id" in session:
        try:
            conexion = get_connection()
            cursor = conexion.cursor(dictionary=True)
            cursor.execute("SELECT nombre, nivel, experiencia, huella, avatar_url FROM usuarios WHERE id = %s", (session["user_id"],))
            usuario = cursor.fetchone()
            cursor.close()
            conexion.close()
            return jsonify({"logged_in": True, "name": session.get("user_name"), "usuario": usuario})
        except Error:
            return jsonify({"logged_in": True, "name": session.get("user_name")})
    return jsonify({"logged_in": False})

# ============================================================
# API DE HUELLA DE CARBONO
# ============================================================
@app.route("/api/huella", methods=["POST"])
def api_guardar_huella():
    if "user_id" not in session:
        return jsonify({"ok": False, "message": "No autenticado"}), 401

    data = request.get_json(silent=True) or {}
    total_huella = data.get("total")

    if total_huella is None:
        return jsonify({"ok": False, "message": "Falta el valor de la huella."}), 400

    try:
        conexion = get_connection()
        cursor = conexion.cursor()
        cursor.execute("UPDATE usuarios SET huella = %s WHERE id = %s", (total_huella, session["user_id"]))
        conexion.commit()
        cursor.close()
        conexion.close()

        return jsonify({"ok": True, "message": "Huella guardada correctamente", "huella": total_huella})
    except Error as err:
        return jsonify({"ok": False, "message": f"Error de base de datos: {err}"}), 500

# ============================================================
# API DE PERFIL (CONSULTA Y EDICIÓN COMPLETA)
# ============================================================
@app.route("/api/perfil", methods=["GET"])
def api_get_perfil():
    if "user_id" not in session:
        return jsonify({"ok": False, "message": "No autenticado"}), 401

    try:
        conexion = get_connection()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, nombre, email, bio, ubicacion, avatar_url, banner_url, nivel, experiencia, huella, fecha_registro "
            "FROM usuarios WHERE id = %s",
            (session["user_id"],)
        )
        u = cursor.fetchone()

        if not u:
            cursor.close()
            conexion.close()
            return jsonify({"ok": False, "message": "Usuario no encontrado"}), 404

        cursor.execute(
            "SELECT COUNT(*) AS total FROM misiones_completadas WHERE usuario_id = %s",
            (session["user_id"],)
        )
        u["misiones_completadas"] = cursor.fetchone()["total"]
        
        if u["fecha_registro"]:
            u["fecha_registro"] = u["fecha_registro"].strftime("%Y-%m-%d")

        cursor.close()
        conexion.close()
        return jsonify({"ok": True, "usuario": u})
    except Error as err:
        return jsonify({"ok": False, "message": f"Error de base de datos: {err}"}), 500

@app.route("/api/perfil/actualizar", methods=["POST"])
def api_actualizar_perfil():
    if "user_id" not in session:
        return jsonify({"ok": False, "message": "No autenticado"}), 401

    data = request.get_json(silent=True) or {}
    nombre = (data.get("nombre") or "").strip()
    ubicacion = (data.get("ubicacion") or "").strip()
    bio = (data.get("bio") or "").strip()

    if not nombre:
        return jsonify({"ok": False, "message": "El nombre no puede estar vacío."}), 400

    try:
        conexion = get_connection()
        cursor = conexion.cursor()
        cursor.execute(
            "UPDATE usuarios SET nombre = %s, ubicacion = %s, bio = %s WHERE id = %s",
            (nombre, ubicacion, bio, session["user_id"])
        )
        conexion.commit()
        cursor.close()
        conexion.close()

        session["user_name"] = nombre
        return jsonify({"ok": True})
    except Error as err:
        return jsonify({"ok": False, "message": f"Error de base de datos: {err}"}), 500

@app.route("/api/perfil/avatar", methods=["POST"])
def api_subir_avatar():
    if "user_id" not in session:
        return jsonify({"ok": False, "message": "No autenticado"}), 401

    if 'avatar' not in request.files:
        return jsonify({"ok": False, "message": "No se envió ningún archivo."}), 400

    file = request.files['avatar']
    if file.filename == '':
        return jsonify({"ok": False, "message": "Archivo no seleccionado."}), 400

    ext = os.path.splitext(file.filename)[1]
    filename = secure_filename(f"avatar_user_{session['user_id']}{ext}")
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    avatar_url = f"/uploads/{filename}"

    try:
        conexion = get_connection()
        cursor = conexion.cursor()
        cursor.execute("UPDATE usuarios SET avatar_url = %s WHERE id = %s", (avatar_url, session["user_id"]))
        conexion.commit()
        cursor.close()
        conexion.close()
        return jsonify({"ok": True, "avatar_url": avatar_url})
    except Error as err:
        return jsonify({"ok": False, "message": f"Error de base de datos: {err}"}), 500

@app.route("/api/perfil/banner", methods=["POST"])
def api_subir_banner():
    if "user_id" not in session:
        return jsonify({"ok": False, "message": "No autenticado"}), 401

    if 'banner' not in request.files:
        return jsonify({"ok": False, "message": "No se envió ningún archivo."}), 400

    file = request.files['banner']
    if file.filename == '':
        return jsonify({"ok": False, "message": "Archivo no seleccionado."}), 400

    ext = os.path.splitext(file.filename)[1]
    filename = secure_filename(f"banner_user_{session['user_id']}{ext}")
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    banner_url = f"/uploads/{filename}"

    try:
        conexion = get_connection()
        cursor = conexion.cursor()
        cursor.execute("UPDATE usuarios SET banner_url = %s WHERE id = %s", (banner_url, session["user_id"]))
        conexion.commit()
        cursor.close()
        conexion.close()
        return jsonify({"ok": True, "banner_url": banner_url})
    except Error as err:
        return jsonify({"ok": False, "message": f"Error de base de datos: {err}"}), 500

# ============================================================
# API DE MISIONES Y RANKING
# ============================================================
@app.route("/api/misiones", methods=["GET"])
def api_misiones():
    if "user_id" not in session:
        return jsonify({"ok": False, "message": "No autenticado"}), 401

    try:
        conexion = get_connection()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT mision_id FROM misiones_completadas WHERE usuario_id = %s", (session["user_id"],))
        completadas = {fila["mision_id"] for fila in cursor.fetchall()}

        cursor.execute(
            "SELECT COUNT(*) AS total FROM misiones_completadas "
            "WHERE usuario_id = %s AND DATE(fecha_completada) = CURDATE()",
            (session["user_id"],)
        )
        misiones_hoy = cursor.fetchone()["total"]
        cursor.close()
        conexion.close()

        catalogo = []
        for m in MISIONES:
            catalogo.append({
                "id": m["id"],
                "categoria": m["categoria"],
                "descripcion": m["descripcion"],
                "xp": m["xp"],
                "completada": m["id"] in completadas
            })

        return jsonify({
            "ok": True,
            "misiones": catalogo,
            "misiones_hoy": misiones_hoy,
            "max_diario": MAX_MISIONES_POR_DIA,
            "limite_alcanzado": misiones_hoy >= MAX_MISIONES_POR_DIA
        })
    except Error as err:
        return jsonify({"ok": False, "message": f"Error de base de datos: {err}"}), 500

@app.route("/api/completar_mision", methods=["POST"])
def api_completar_mision():
    if "user_id" not in session:
        return jsonify({"ok": False, "message": "No autenticado"}), 401

    data = request.get_json(silent=True) or {}
    mision_id = data.get("mision_id")
    evidencia = (data.get("evidencia") or "").strip()

    mision = MISIONES_POR_ID.get(mision_id)
    if not mision:
        return jsonify({"ok": False, "message": "Esa misión no existe."}), 404

    if len(evidencia) < MIN_EVIDENCIA_CARACTERES:
        return jsonify({
            "ok": False,
            "message": f"Escribí al menos {MIN_EVIDENCIA_CARACTERES} caracteres detallando tu evidencia."
        }), 400

    usuario_id = session["user_id"]

    try:
        conexion = get_connection()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("SELECT id FROM misiones_completadas WHERE usuario_id = %s AND mision_id = %s", (usuario_id, mision_id))
        if cursor.fetchone():
            cursor.close()
            conexion.close()
            return jsonify({"ok": False, "message": "Ya completaste esta misión antes."}), 409

        cursor.execute(
            "SELECT COUNT(*) AS total FROM misiones_completadas "
            "WHERE usuario_id = %s AND DATE(fecha_completada) = CURDATE()",
            (usuario_id,)
        )
        misiones_hoy = cursor.fetchone()["total"]
        if misiones_hoy >= MAX_MISIONES_POR_DIA:
            cursor.close()
            conexion.close()
            return jsonify({"ok": False, "message": f"Llegaste al límite diario ({MAX_MISIONES_POR_DIA}). ¡Volvé mañana!"}), 429

        cursor.execute(
            "INSERT INTO misiones_completadas (usuario_id, mision_id, evidencia) VALUES (%s, %s, %s)",
            (usuario_id, mision_id, evidencia)
        )

        cursor.execute("SELECT nivel, experiencia FROM usuarios WHERE id = %s", (usuario_id,))
        actual = cursor.fetchone()
        nuevo_nivel, nueva_exp, subio_nivel = calcular_progreso(actual["nivel"], actual["experiencia"], mision["xp"])

        cursor.execute(
            "UPDATE usuarios SET nivel = %s, experiencia = %s WHERE id = %s",
            (nuevo_nivel, nueva_exp, usuario_id)
        )

        conexion.commit()
        cursor.close()
        conexion.close()

        return jsonify({
            "ok": True,
            "nivel": nuevo_nivel,
            "experiencia": nueva_exp,
            "subio_nivel": subio_nivel,
            "misiones_hoy": misiones_hoy + 1
        })
    except Error as err:
        return jsonify({"ok": False, "message": f"Error de base de datos: {err}"}), 500

@app.route("/api/ranking", methods=["GET"])
def api_ranking():
    try:
        conexion = get_connection()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT nombre, nivel, experiencia FROM usuarios ORDER BY nivel DESC, experiencia DESC")
        filas = cursor.fetchall()
        cursor.close()
        conexion.close()
        return jsonify({"ok": True, "ranking": filas})
    except Error as err:
        return jsonify({"ok": False, "message": f"Error de base de datos: {err}"}), 500

if __name__ == "__main__":
    inicializar_base_datos()
    app.run(debug=True)