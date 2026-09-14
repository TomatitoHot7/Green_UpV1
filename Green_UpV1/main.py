import mysql.connector

# ============================
# DATABASE CONFIGURATION & CONNECTION
# ============================

# IMPORTANT: Replace 'yourusername' and 'yourpassword' with your MySQL credentials.
DB_HOST = "localhost"
DB_USER = "yourusername"
DB_PASSWORD = "yourpassword"
DB_NAME = "accion_clima_db" # Database name

def conectar():
    """
    Establishes and returns a connection to the database.
    If the database does not exist, it attempts to create it.
    """
    try:
        # Try to connect to the specific database
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return conn
    except mysql.connector.Error as err:
        if err.errno == mysql.connector.errorcode.ER_BAD_DB_ERROR:
            # If the database does not exist, we create it
            print(f"Database '{DB_NAME}' does not exist. Creating it...")
            # Calls crear_base_de_datos, which creates tables and returns a valid connection.
            return crear_base_de_datos()
        elif err.errno == mysql.connector.errorcode.ER_ACCESS_DENIED_ERROR:
            print("Connection Error: Access denied. Check your MySQL Username and Password.")
            return None
        else:
            print(f"Database connection error: {err}")
            return None

def crear_base_de_datos():
    """
    Creates the database and initial tables if they do not exist.
    Returns a valid DB connection or None if it fails.
    """
    try:
        # Connection without specifying the database (so we can create it)
        mydb = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD
        )
        mycursor = mydb.cursor()

        # 1. Create the database
        mycursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        print(f"Database '{DB_NAME}' created or already exists.")
        
        # 2. Select the newly created/existing database to create tables
        mydb.database = DB_NAME
        
        # 3. Create the users table
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
        print("Table 'usuarios' created or already exists.")

        # 4. Create a table for home page content
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
        print("Table 'contenido_home' created or already exists.")

        mydb.commit()
        mycursor.close()
        
        # Return the open connection, now with the DB selected
        return mydb 
        
    except mysql.connector.Error as err:
        print(f"Error creating database/tables: {err}")
        return None

# ============================
# USER MANAGEMENT FUNCTIONS (REGISTRATION / LOGIN)
# ============================

def registrar_usuario():
    """Allows a new user to register on the platform."""
    print("\n--- REGISTRO DE USUARIO ---")
    nombre = input("Nombre completo: ")
    email = input("Email (será tu usuario): ")
    password = input("Contraseña: ") 
   
    conexion = conectar()
    if not conexion: return

    cursor = conexion.cursor()
    
    # 1. Prevent duplicate emails
    query_check = "SELECT email FROM usuarios WHERE email = %s"
    cursor.execute(query_check, (email,))
    if cursor.fetchone():
        print("\nERROR: Ya existe un usuario registrado con este email.")
        cursor.close()
        conexion.close()
        return

    try:
        # INSERT: Inserts the new user into the 'usuarios' table
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
    """Verifies user credentials to log in."""
    print("\n--- INICIO DE SESIÓN ---")
    email = input("Email: ")
    password = input("Contraseña: ")

    conexion = conectar()
    if not conexion: return

    cursor = conexion.cursor()
    
    # SELECT: Search for the user by email and password
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
    """Queries and displays user details by their Email."""
    print("\n--- CONSULTAR USUARIO ---")
    email = input("Email del usuario a consultar: ")
    
    conexion = conectar()
    if not conexion: return
    cursor = conexion.cursor()

    # SELECT WHERE: Gets all user fields except the password (for security)
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
    """Allows modifying a user's name based on their Email."""
    print("\n--- MODIFICAR NOMBRE DE USUARIO ---")
    email = input("Email del usuario a modificar: ")
    nuevo_nombre = input("Nuevo nombre completo: ")
    
    conexion = conectar()
    if not conexion: return
    cursor = conexion.cursor()

    try:
        # UPDATE: Updates the 'nombre' field for the user with the given 'email'
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
    """Deletes a user from the database by their Email."""
    print("\n--- ELIMINAR USUARIO ---")
    email = input("Email del usuario a ELIMINAR: ")
    confirmacion = input("¿Está seguro de que desea eliminar este usuario? (Sí/No): ").lower()

    if confirmacion != 'sí' and confirmacion != 'si':
        print("Operación cancelada.")
        return

    conexion = conectar()
    if not conexion: return
    cursor = conexion.cursor() 

    try:
        # DELETE: Removes the row from the 'usuarios' table where 'email' matches
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

# ============================
# HOME PAGE CONTENT MANAGEMENT FUNCTIONS
# ============================

def insertar_contenido_home():
    """Adds a new news item or project to the home page content."""
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
        # 1. Verify if autor_id is an existing user
        cursor.execute("SELECT id FROM usuarios WHERE id = %s", (autor_id,))
        if not cursor.fetchone():
            print(f"ERROR: No existe ningún usuario con ID {autor_id}. Cancelando inserción.")
            return
            
        # 2. INSERT: Inserts the new content
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
    """Displays all content (news and projects) from the home page."""
    print("\n--- CONTENIDO ACTUAL DEL HOME ---")
    
    conexion = conectar()
    if not conexion: return
    cursor = conexion.cursor()

    # SELECT with JOIN: Gets the content along with the author's name
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
            # Handles the case where autor_id is NULL
            autor = x[5] if x[5] else "Desconocido (Autor eliminado)" 
            print(f"ID: {x[0]} | Tipo: {x[1].upper()}")
            print(f"Título: {x[2]}")
            # Display only the first 100 characters of the summary for better readability
            print(f"Resumen: {x[3][:100]}...") 
            print(f"Publicado: {x[4]} por {autor}")
            print("-----------------------------------------------------------")
    else:
        print("No hay contenido registrado para la página de inicio.")

    cursor.close()
    conexion.close()

# ============================
# MAIN MENU
# ============================

def menu():
    """Main function that displays the option menu."""
    print("Iniciando la aplicación...")
    # Attempt an initial connection (this will create the DB and tables if necessary)
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
