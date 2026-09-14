import mysql.connector

# ============================
# DATABASE CONNECTION
# ============================
def conectar():
    """Establishes and returns a connection to the MySQL database."""
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="1234",
        database="informacion"
    )

# ============================
# USER REGISTRATION
# ============================
def registrar_usuario():
    """Prompts the user for details and inserts a new record into the database."""
    print("\n--- REGISTRAR USUARIO ---")
    nombre = input("Nombre: ")
    apellido = input("Apellido: ")
    edad = input("Edad: ")
    ocupacion = input("Ocupación: ")
    genero = input("Género: ")

    conexion = conectar()
    cursor = conexion.cursor()

    sql = "INSERT INTO info (nombre, apellido, edad, ocupacion, genero) VALUES (%s, %s, %s, %s, %s)"
    cursor.execute(sql, (nombre, apellido, edad, ocupacion, genero))
    conexion.commit()

    print("\nUsuario registrado correctamente.\n")

    cursor.close()
    conexion.close()

# ============================
# SEARCH USER BY NAME
# ============================
def consultar_usuario():
    """Searches for users by name and prints their profile details if found."""
    print("\n--- CONSULTAR USUARIO ---")
    nombre = input("Nombre a buscar: ")

    conexion = conectar()
    cursor = conexion.cursor()

    sql = "SELECT * FROM info WHERE nombre = %s"
    cursor.execute(sql, (nombre,))
    resultado = cursor.fetchall()

    if resultado:
        for fila in resultado:
            print(f"""
ID: {fila[0]}
Nombre: {fila[1]}
Apellido: {fila[2]}
Edad: {fila[3]}
Ocupación: {fila[4]}
Género: {fila[5]}
""")
    else:
        print("\nNo se encontró ese usuario.\n")

    cursor.close()
    conexion.close()

# ============================
# USER LOGIN (Name + Last Name)
# ============================
def iniciar_sesion():
    """Authenticates a user by matching their first and last name in the database."""
    print("\n--- INICIAR SESIÓN ---")
    nombre = input("Nombre: ")
    apellido = input("Apellido: ")

    conexion = conectar()
    cursor = conexion.cursor()

    sql = "SELECT id FROM info WHERE nombre = %s AND apellido = %s"
    cursor.execute(sql, (nombre, apellido))
    resultado = cursor.fetchone()

    if resultado:
        print(f"\nBienvenido {nombre} {apellido} (ID: {resultado[0]})\n")
    else:
        print("\nUsuario no encontrado.\n")

    cursor.close()
    conexion.close()

# ============================
# UPDATE LAST NAME
# ============================
def modificar_apellido():
    """Updates a user's last name based on their unique ID."""
    print("\n--- MODIFICAR APELLIDO ---")
    id_usuario = input("ID del usuario: ")
    nuevo_apellido = input("Nuevo apellido: ")

    conexion = conectar()
    cursor = conexion.cursor()

    sql = "UPDATE info SET apellido = %s WHERE id = %s"
    cursor.execute(sql, (nuevo_apellido, id_usuario))
    conexion.commit()

    print("\nApellido actualizado correctamente.\n")

    cursor.close()
    conexion.close()

# ============================
# UPDATE OCCUPATION
# ============================
def modificar_ocupacion():
    """Updates a user's occupation based on their unique ID."""
    print("\n--- CAMBIAR OCUPACIÓN ---")
    id_usuario = input("ID del usuario: ")
    nueva_ocupacion = input("Nueva ocupación: ")

    conexion = conectar()
    cursor = conexion.cursor()

    sql = "UPDATE info SET ocupacion = %s WHERE id = %s"
    cursor.execute(sql, (nueva_ocupacion, id_usuario))
    conexion.commit()

    print("\nOcupación actualizada correctamente.\n")

    cursor.close()
    conexion.close()

# ============================
# DELETE USER
# ============================
def eliminar_usuario():
    """Deletes a user record from the database using their unique ID."""
    print("\n--- ELIMINAR USUARIO ---")
    id_usuario = input("ID del usuario a eliminar: ")

    conexion = conectar()
    cursor = conexion.cursor()

    sql = "DELETE FROM info WHERE id = %s"
    cursor.execute(sql, (id_usuario,))
    conexion.commit()

    print("\nUsuario eliminado correctamente.\n")

    cursor.close()
    conexion.close()

# ============================
# MAIN MENU LOOP
# ============================
def menu():
    """Displays the main CLI menu and handles user option selections."""
    while True:
        print("\n========= MENÚ PRINCIPAL =========")
        print("1. Registrar usuario")
        print("2. Iniciar sesión")
        print("3. Consultar usuario")
        print("4. Modificar apellido")
        print("5. Cambiar ocupación")
        print("6. Eliminar usuario")
        print("7. Salir")

        opcion = input("Seleccione una opción: ")

        if opcion == "1":
            registrar_usuario()
        elif opcion == "2":
            iniciar_sesion()
        elif opcion == "3":
            consultar_usuario()
        elif opcion == "4":
            modificar_apellido()
        elif opcion == "5":
            modificar_ocupacion()
        elif opcion == "6":
            eliminar_usuario()
        elif opcion == "7":
            print("\n¡Hasta pronto!\n")
            break
        else:
            print("\nOpción inválida, intente de nuevo.\n")

# ============================
# PROGRAM ENTRY POINT
# ============================
if __name__ == "__main__":
    menu()
