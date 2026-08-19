import mysql.connector

# --- CONFIGURACIÓN DE LA BASE DE DATOS Y CONEXIÓN ---

# **IMPORTANTE:** Reemplaza 'yourusername' y 'yourpassword' con tus credenciales de MySQL.
DB_HOST = "localhost"
DB_USER = "yourusername"
DB_PASSWORD = "yourpassword"
DB_NAME = "accion_clima_db" # Nombre de la base de datos

def conectar():
    """
    Establece y devuelve una conexión a la base de datos.
    Si la DB no existe, intenta crearla.
    """
    try:
        # Intenta conectar a la base de datos específica
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return conn
    except mysql.connector.Error as err:
        if err.errno == mysql.connector.errorcode.ER_BAD_DB_ERROR:
            # Si la base de datos no existe, la creamos
            print(f"La base de datos '{DB_NAME}' no existe. Creándola...")
            # Llama a crear_base_de_datos, que crea las tablas y devuelve una conexión válida.
            return crear_base_de_datos()
        elif err.errno == mysql.connector.errorcode.ER_ACCESS_DENIED_ERROR:
            print("Error de Conexión: Acceso denegado. Revisa tu Usuario y Contraseña de MySQL.")
            return None
        else:
            print(f"Error de conexión a la base de datos: {err}")
            return None

def crear_base_de_datos():
    """
    Crea la base de datos y las tablas iniciales si no existen.
    Devuelve una conexión válida a la DB o None si falla.
    """
    try:
        # Conexión sin especificar la base de datos (para poder crearla)
        mydb = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD
        )
        mycursor = mydb.cursor()

        # 1. Crear la base de datos
        mycursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        print(f"Base de datos '{DB_NAME}' creada o ya existente.")
        
        # 2. Seleccionar la base de datos recién creada/existente para crear las tablas
        mydb.database = DB_NAME
        
        # 3. Crear la tabla de usuarios
        sql_usuarios = """
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        mycursor.execute(sql_usuarios)
        print("Tabla 'usuarios' creada o ya existente.")

        # 4. Crear una tabla para el contenido de la página de inicio
        sql_contenido_home = """
        CREATE TABLE IF NOT EXISTS contenido_home (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tipo_contenido ENUM('noticia', 'proyecto') NOT NULL,
            titulo VARCHAR(255) NOT NULL,
            resumen TEXT,
            fecha_publicacion DATE,
            autor_id INT,
            FOREIGN KEY (autor_id) REFERENCES usuarios(id)
                ON DELETE SET NULL 
                ON UPDATE CASCADE
        )
        """
        mycursor.execute(sql_contenido_home)
        print("Tabla 'contenido_home' creada o ya existente.")

        mydb.commit()
        mycursor.close()
        
        # Devolvemos la conexión abierta, ahora con la DB seleccionada
        return mydb 
        
    except mysql.connector.Error as err:
        print(f"Error al crear base de datos/tablas: {err}")
        return None

# --- FUNCIONES DE GESTIÓN DE USUARIOS (REGISTRO/LOGIN) ---

def registrar_usuario():
    """Permite a un nuevo usuario registrarse en la página."""
    print("\n--- REGISTRO DE USUARIO ---")
    nombre = input("Nombre completo: ")
    email = input("Email (será tu usuario): ")
    password = input("Contraseña: ") 
   
    conexion = conectar()
    if not conexion: return

    cursor = conexion.cursor()
    
    # 1. Prevenir duplicados de email
    query_check = "SELECT email FROM usuarios WHERE email = %s"
    cursor.execute(query_check, (email,))
    if cursor.fetchone():
        print("\nERROR: Ya existe un usuario registrado con este email.")
        cursor.close()
        conexion.close()
        return

    try:
        # INSERT: Inserta el nuevo usuario en la tabla 'usuarios'
        sql_insert = "INSERT INTO usuarios (nombre, email, password) VALUES (%s, %s, %s)"
        val = (nombre, email, password)
        cursor.execute(sql_insert, val)
        conexion.commit()
        print(f"\nUsuario '{nombre}' registrado con éxito. ID: {cursor.lastrowid}")
    except mysql.connector.Error as err:
        print(f"Error al registrar usuario: {err}")
        conexion.rollback()
    finally:
        cursor.close()
        conexion.close()

def iniciar_sesion():
    """Verifica las credenciales del usuario para iniciar sesión."""
    print("\n--- INICIO DE SESIÓN ---")
    email = input("Email: ")
    password = input("Contraseña: ")

    conexion = conectar()
    if not conexion: return

    cursor = conexion.cursor()
    
    # SELECT: Busca el usuario por email y contraseña
    query = "SELECT id, nombre FROM usuarios WHERE email = %s AND password = %s"
    cursor.execute(query, (email, password)) 
    resultado = cursor.fetchone()

    if resultado:
        user_id, user_nombre = resultado
        print(f"\nBienvenido/a, {user_nombre}! Has iniciado sesión (ID: {user_id}).")
    else:
        print("\nCredenciales incorrectas (Email o Contraseña).")

    cursor.close()
    conexion.close()

def consultar_usuario():
    """Consulta y muestra los datos de un usuario por su Email."""
    print("\n--- CONSULTAR USUARIO ---")
    email = input("Email del usuario a consultar: ")
    
    conexion = conectar()
    if not conexion: return
    cursor = conexion.cursor()

    # SELECT WHERE: Obtiene todos los campos del usuario, excepto la contraseña (por seguridad)
    query = "SELECT id, nombre, email, fecha_registro FROM usuarios WHERE email = %s"
    cursor.execute(query, (email,))
    resultado = cursor.fetchone()

    if resultado:
        print("\n--- DATOS DEL USUARIO ---")
        print(f"ID: {resultado[0]}")
        print(f"Nombre: {resultado[1]}")
        print(f"Email: {resultado[2]}")
        print(f"Fecha de Registro: {resultado[3]}")
        print("---------------------------")
    else:
        print("\nUsuario no encontrado.")

    cursor.close()
    conexion.close()

def modificar_usuario():
    """Permite modificar el nombre de un usuario por su Email."""
    print("\n--- MODIFICAR NOMBRE DE USUARIO ---")
    email = input("Email del usuario a modificar: ")
    nuevo_nombre = input("Nuevo nombre completo: ")
    
    conexion = conectar()
    if not conexion: return
    cursor = conexion.cursor()

    try:
        # UPDATE: Actualiza el campo 'nombre' para el usuario con el 'email' dado
        sql_update = "UPDATE usuarios SET nombre = %s WHERE email = %s"
        val = (nuevo_nombre, email)
        cursor.execute(sql_update, val)
        
        if cursor.rowcount > 0:
            conexion.commit()
            print(f"\nNombre del usuario con Email '{email}' actualizado a '{nuevo_nombre}'.")
        else:
            print("\nUsuario no encontrado. No se realizó ninguna modificación.")
            
    except mysql.connector.Error as err:
        print(f"Error al modificar usuario: {err}")
        conexion.rollback()
    finally:
        cursor.close()
        conexion.close()

def eliminar_usuario():
    """Elimina a un usuario de la base de datos por su Email."""
    print("\n--- ELIMINAR USUARIO ---")
    email = input("Email del usuario a ELIMINAR: ")
    confirmacion = input("¿Está seguro de que desea eliminar este usuario? (Sí/No): ").lower()

    if confirmacion != 'sí' and confirmacion != 'si':
        print("Operación cancelada.")
        return

    conexion = conectar()
    if not conexion: return
    # CORRECTO: Crea el cursor
    cursor = conexion.cursor() 

    try:
        # DELETE: Elimina la fila de la tabla 'usuarios' donde el 'email' coincide
        sql_delete = "DELETE FROM usuarios WHERE email = %s"
        cursor.execute(sql_delete, (email,))
        
        if cursor.rowcount > 0:
            conexion.commit()
            print(f"\nUsuario con Email '{email}' eliminado con éxito.")
        else:
            print("\nUsuario no encontrado. No se eliminó nada.")
            
    except mysql.connector.Error as err:
        print(f"Error al eliminar usuario: {err}")
        conexion.rollback()
    finally:
        cursor.close()
        conexion.close()

# --- FUNCIONES DE GESTIÓN DEL CONTENIDO DE LA PÁGINA DE INICIO ---

def insertar_contenido_home():
    """Agrega una nueva noticia o proyecto al contenido de la página de inicio."""
    print("\n--- INSERTAR CONTENIDO HOME ---")
    print("Tipo de contenido: 1. Noticia | 2. Proyecto")
    tipo_opcion = input("Seleccione el tipo (1 o 2): ")
    
    if tipo_opcion == '1':
        tipo = 'noticia'
    elif tipo_opcion == '2':
        tipo = 'proyecto'
    else:
        print("Tipo de contenido inválido. Cancelando.")
        return
    
    titulo = input(f"Título de la {tipo}: ")
    resumen = input(f"Resumen/Descripción de la {tipo}: ")
    autor_id = input("ID del autor (Debe ser un ID de usuario existente): ") 

    conexion = conectar()
    if not conexion: return
    cursor = conexion.cursor()

    try:
        # 1. Verificar si el autor_id es un usuario existente
        cursor.execute("SELECT id FROM usuarios WHERE id = %s", (autor_id,))
        if not cursor.fetchone():
            print(f"ERROR: No existe ningún usuario con ID {autor_id}. Cancelando inserción.")
            return
            
        # 2. INSERT: Inserta el nuevo contenido
        sql_insert = "INSERT INTO contenido_home (tipo_contenido, titulo, resumen, autor_id, fecha_publicacion) VALUES (%s, %s, %s, %s, CURDATE())"
        val = (tipo, titulo, resumen, autor_id)
        cursor.execute(sql_insert, val)
        conexion.commit()
        print(f"\n{tipo.capitalize()} '{titulo}' insertado con éxito en el Home.")
    except mysql.connector.Error as err:
        print(f"Error al insertar contenido: {err}")
        conexion.rollback()
    finally:
        cursor.close()
        conexion.close()

def ver_contenido_home():
    """Muestra todo el contenido (noticias y proyectos) de la página de inicio."""
    print("\n--- CONTENIDO ACTUAL DEL HOME ---")
    
    conexion = conectar()
    if not conexion: return
    cursor = conexion.cursor()

    # SELECT con JOIN: Obtiene el contenido junto con el nombre del autor
    query = """
    SELECT
        ch.id, ch.tipo_contenido, ch.titulo, ch.resumen, ch.fecha_publicacion, u.nombre
    FROM
        contenido_home ch
    LEFT JOIN
        usuarios u ON ch.autor_id = u.id
    ORDER BY
        ch.fecha_publicacion DESC
    """
    cursor.execute(query)
    resultados = cursor.fetchall()
    
    if resultados:
        print("\n-----------------------------------------------------------")
        for x in resultados:
            # Maneja el caso de que autor_id sea NULL
            autor = x[5] if x[5] else "Desconocido (Autor eliminado)" 
            print(f"ID: {x[0]} | Tipo: {x[1].upper()}")
            print(f"Título: {x[2]}")
            # Mostrar solo los primeros 100 caracteres del resumen para mejor visualización
            print(f"Resumen: {x[3][:100]}...") 
            print(f"Publicado: {x[4]} por {autor}")
            print("-----------------------------------------------------------")
    else:
        print("No hay contenido registrado para la página de inicio.")

    cursor.close()
    conexion.close()

# --- MENÚ PRINCIPAL ---

def menu():
    """Función principal que muestra el menú de opciones."""
    print("Iniciando la aplicación...")
    # Intenta obtener una conexión inicial (esto creará la DB y tablas si es necesario)
    conn_inicial = conectar()
    if conn_inicial:
        conn_inicial.close()
    else:
        print("\nNo se pudo establecer una conexión inicial a la base de datos. Saliendo.")
        return

    while True:
        print("\nMENÚ - ACCIÓN POR EL CLIMA")
        print("--- GESTIÓN DE USUARIOS (CRUD) ---")
        print("1. Registrar usuario (Create)")
        print("2. Iniciar sesión (Read)")
        print("3. Consultar usuario (Read)")
        print("4. Modificar nombre de usuario (Update)")
        print("5. Eliminar usuario (Delete)")
        print("--- GESTIÓN DE CONTENIDO HOME ---")
        print("6. Insertar Noticia/Proyecto")
        print("7. Ver Contenido Home")
        print("8. Salir")

        opcion = input("Seleccione una opción: ")

        if opcion == "1":
            registrar_usuario()
        elif opcion == "2":
            iniciar_sesion()
        elif opcion == "3":
            consultar_usuario()
        elif opcion == "4":
            modificar_usuario()
        elif opcion == "5":
            eliminar_usuario()
        elif opcion == "6":
            insertar_contenido_home()
        elif opcion == "7":
            ver_contenido_home()
        elif opcion == "8":
            print("Gracias por tu acción por el clima! Hasta pronto!")
            break
        else:
            print("Opción inválida. Intente de nuevo.")

if __name__ == "__main__":
    menu()
