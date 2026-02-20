#!/usr/bin/env python3
"""
Firebase Database Seeding Script
Populates Firestore with initial data: users, exercises, routines, foods, and diets
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from app.core.security import get_password_hash

# Initialize Firebase
cred = credentials.Certificate("serviceAccountKey.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

def clear_collection(collection_name):
    """Clear all documents in a collection (use with caution!)"""
    print(f"Clearing {collection_name} collection...")
    docs = db.collection(collection_name).stream()
    count = 0
    for doc in docs:
        doc.reference.delete()
        count += 1
    print(f"  Deleted {count} documents")

def seed_users():
    """Create sample users"""
    print("\n=== Seeding Users ===")
    
    users_data = [
        {
            "username": "adrian",
            "email": "adrian@gymtrack.com",
            "password": "adrian123",  # Will be hashed
            "profile_picture": "https://api.dicebear.com/7.x/avataaars/svg?seed=adrian",
            "reputation_score": 4.5
        },
        {
            "username": "maria",
            "email": "maria@gymtrack.com",
            "password": "maria123",
            "profile_picture": "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
            "reputation_score": 4.2
        },
        {
            "username": "carlos",
            "email": "carlos@gymtrack.com",
            "password": "carlos123",
            "profile_picture": "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
            "reputation_score": 3.8
        },
        {
            "username": "test",
            "email": "test@test.com",
            "password": "test123",
            "profile_picture": "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
            "reputation_score": 5.0
        }
    ]
    
    user_ids = {}
    for user_data in users_data:
        # Hash password
        password = user_data.pop("password")
        user_data["password_hash"] = get_password_hash(password)
        user_data["created_at"] = datetime.utcnow()
        
        # Create user
        _, doc_ref = db.collection("users").add(user_data)
        user_ids[user_data["username"]] = doc_ref.id
        print(f"  ✓ Created user: {user_data['username']} (ID: {doc_ref.id})")
        print(f"    Email: {user_data['email']} | Password: {password}")
    
    return user_ids

def seed_exercises():
    """Create exercise library"""
    print("\n=== Seeding Exercises ===")
    
    exercises_data = [
        # Pecho
        {
            "name": "Press de Banca",
            "description": "Ejercicio fundamental para el desarrollo del pecho",
            "muscle_group": "Pecho",
            "video_url": "https://www.youtube.com/watch?v=rT7DgCr-3pg"
        },
        {
            "name": "Aperturas con Mancuernas",
            "description": "Aislamiento del pecho con mancuernas",
            "muscle_group": "Pecho",
            "video_url": "https://www.youtube.com/watch?v=eozdVDA78K0"
        },
        {
            "name": "Fondos en Paralelas",
            "description": "Ejercicio de peso corporal para pecho y tríceps",
            "muscle_group": "Pecho",
            "video_url": "https://www.youtube.com/watch?v=2z8JmcrW-As"
        },
        
        # Espalda
        {
            "name": "Dominadas",
            "description": "Ejercicio fundamental para el desarrollo de la espalda",
            "muscle_group": "Espalda",
            "video_url": "https://www.youtube.com/watch?v=eGo4IYlbE5g"
        },
        {
            "name": "Remo con Barra",
            "description": "Ejercicio compuesto para espalda media",
            "muscle_group": "Espalda",
            "video_url": "https://www.youtube.com/watch?v=FWJR5Ve8bnQ"
        },
        {
            "name": "Peso Muerto",
            "description": "Ejercicio compuesto que trabaja toda la cadena posterior",
            "muscle_group": "Espalda",
            "video_url": "https://www.youtube.com/watch?v=ytGaGIn3SjE"
        },
        
        # Piernas
        {
            "name": "Sentadilla",
            "description": "El rey de los ejercicios para piernas",
            "muscle_group": "Piernas",
            "video_url": "https://www.youtube.com/watch?v=ultWZbUMPL8"
        },
        {
            "name": "Prensa de Piernas",
            "description": "Ejercicio de máquina para cuádriceps",
            "muscle_group": "Piernas",
            "video_url": "https://www.youtube.com/watch?v=IZxyjW7MPJQ"
        },
        {
            "name": "Curl Femoral",
            "description": "Aislamiento de los isquiotibiales",
            "muscle_group": "Piernas",
            "video_url": "https://www.youtube.com/watch?v=ELOCsoDSmrg"
        },
        {
            "name": "Elevación de Gemelos",
            "description": "Ejercicio para pantorrillas",
            "muscle_group": "Piernas",
            "video_url": "https://www.youtube.com/watch?v=JbyjNymZOt0"
        },
        
        # Hombros
        {
            "name": "Press Militar",
            "description": "Ejercicio fundamental para hombros",
            "muscle_group": "Hombros",
            "video_url": "https://www.youtube.com/watch?v=qEwKCR5JCog"
        },
        {
            "name": "Elevaciones Laterales",
            "description": "Aislamiento del deltoides lateral",
            "muscle_group": "Hombros",
            "video_url": "https://www.youtube.com/watch?v=3VcKaXpzqRo"
        },
        {
            "name": "Pájaros",
            "description": "Ejercicio para deltoides posterior",
            "muscle_group": "Hombros",
            "video_url": "https://www.youtube.com/watch?v=tTKY4Ry7R3E"
        },
        
        # Brazos
        {
            "name": "Curl de Bíceps con Barra",
            "description": "Ejercicio básico para bíceps",
            "muscle_group": "Brazos",
            "video_url": "https://www.youtube.com/watch?v=ykJmrZ5v0Oo"
        },
        {
            "name": "Press Francés",
            "description": "Ejercicio de aislamiento para tríceps",
            "muscle_group": "Brazos",
            "video_url": "https://www.youtube.com/watch?v=d_KZxkY_0cM"
        },
        {
            "name": "Curl Martillo",
            "description": "Variación de curl para bíceps y braquial",
            "muscle_group": "Brazos",
            "video_url": "https://www.youtube.com/watch?v=zC3nLlEvin4"
        },
        
        # Core
        {
            "name": "Plancha",
            "description": "Ejercicio isométrico para el core",
            "muscle_group": "Core",
            "video_url": "https://www.youtube.com/watch?v=ASdvN_XEl_c"
        },
        {
            "name": "Abdominales",
            "description": "Ejercicio clásico para abdominales",
            "muscle_group": "Core",
            "video_url": "https://www.youtube.com/watch?v=1fbU_MkV7NE"
        },
        {
            "name": "Elevación de Piernas",
            "description": "Ejercicio para abdomen inferior",
            "muscle_group": "Core",
            "video_url": "https://www.youtube.com/watch?v=JB2oyawG9KI"
        }
    ]
    
    exercise_ids = {}
    for exercise_data in exercises_data:
        exercise_data["created_at"] = datetime.utcnow()
        _, doc_ref = db.collection("exercises").add(exercise_data)
        exercise_ids[exercise_data["name"]] = doc_ref.id
        print(f"  ✓ Created exercise: {exercise_data['name']} ({exercise_data['muscle_group']})")
    
    return exercise_ids

def seed_routines(user_ids, exercise_ids):
    """Create sample routines"""
    print("\n=== Seeding Routines ===")
    
    routines_data = [
        {
            "name": "Rutina Full Body Principiante",
            "description": "Rutina de cuerpo completo ideal para principiantes, 3 días a la semana",
            "creator_id": user_ids.get("adrian"),
            "is_public": True,
            "average_rating": 4.5,
            "rating_count": 12,
            "exercises": [
                {"exercise": "Sentadilla", "day": 1, "sets": 3, "reps_min": 8, "reps_max": 12},
                {"exercise": "Press de Banca", "day": 1, "sets": 3, "reps_min": 8, "reps_max": 12},
                {"exercise": "Remo con Barra", "day": 1, "sets": 3, "reps_min": 8, "reps_max": 12},
                {"exercise": "Press Militar", "day": 1, "sets": 3, "reps_min": 8, "reps_max": 12},
            ]
        },
        {
            "name": "Push Pull Legs",
            "description": "Rutina avanzada dividida en empuje, tirón y piernas",
            "creator_id": user_ids.get("maria"),
            "is_public": True,
            "average_rating": 4.8,
            "rating_count": 25,
            "exercises": [
                # Push Day
                {"exercise": "Press de Banca", "day": 1, "sets": 4, "reps_min": 6, "reps_max": 10},
                {"exercise": "Press Militar", "day": 1, "sets": 3, "reps_min": 8, "reps_max": 12},
                {"exercise": "Fondos en Paralelas", "day": 1, "sets": 3, "reps_min": 8, "reps_max": 12},
                # Pull Day
                {"exercise": "Dominadas", "day": 2, "sets": 4, "reps_min": 6, "reps_max": 10},
                {"exercise": "Remo con Barra", "day": 2, "sets": 3, "reps_min": 8, "reps_max": 12},
                {"exercise": "Peso Muerto", "day": 2, "sets": 3, "reps_min": 5, "reps_max": 8},
                # Leg Day
                {"exercise": "Sentadilla", "day": 3, "sets": 4, "reps_min": 6, "reps_max": 10},
                {"exercise": "Prensa de Piernas", "day": 3, "sets": 3, "reps_min": 10, "reps_max": 15},
                {"exercise": "Curl Femoral", "day": 3, "sets": 3, "reps_min": 10, "reps_max": 15},
            ]
        },
        {
            "name": "Hipertrofia Avanzada",
            "description": "Rutina de 5 días enfocada en hipertrofia muscular",
            "creator_id": user_ids.get("carlos"),
            "is_public": True,
            "average_rating": 4.3,
            "rating_count": 8,
            "exercises": [
                {"exercise": "Press de Banca", "day": 1, "sets": 4, "reps_min": 8, "reps_max": 12},
                {"exercise": "Aperturas con Mancuernas", "day": 1, "sets": 3, "reps_min": 10, "reps_max": 15},
                {"exercise": "Dominadas", "day": 2, "sets": 4, "reps_min": 8, "reps_max": 12},
                {"exercise": "Remo con Barra", "day": 2, "sets": 4, "reps_min": 8, "reps_max": 12},
                {"exercise": "Sentadilla", "day": 3, "sets": 5, "reps_min": 6, "reps_max": 10},
                {"exercise": "Prensa de Piernas", "day": 3, "sets": 3, "reps_min": 12, "reps_max": 15},
            ]
        }
    ]
    
    routine_ids = {}
    for routine_data in routines_data:
        exercises = routine_data.pop("exercises")
        routine_data["created_at"] = datetime.utcnow()
        
        # Create routine
        _, routine_ref = db.collection("routines").add(routine_data)
        routine_ids[routine_data["name"]] = routine_ref.id
        print(f"  ✓ Created routine: {routine_data['name']} (ID: {routine_ref.id})")
        
        # Create routine exercises as subcollection
        for idx, exercise in enumerate(exercises):
            exercise_name = exercise["exercise"]
            exercise_id = exercise_ids.get(exercise_name)
            
            if exercise_id:
                routine_exercise_data = {
                    "routine_id": routine_ref.id,
                    "exercise_id": exercise_id,
                    "day_of_week": exercise.get("day", 1),
                    "order_index": idx,
                    "target_sets": exercise.get("sets", 3),
                    "target_reps_min": exercise.get("reps_min", 8),
                    "target_reps_max": exercise.get("reps_max", 12)
                }
                db.collection("routine_exercises").add(routine_exercise_data)
                print(f"    - Added exercise: {exercise_name}")
    
    return routine_ids

def seed_foods():
    """Create food library"""
    print("\n=== Seeding Foods ===")
    
    foods_data = [
        # Proteínas
        {"name": "Pechuga de Pollo", "calories_per_100g": 165, "protein_per_100g": 31, "carbs_per_100g": 0, "fat_per_100g": 3.6},
        {"name": "Huevos", "calories_per_100g": 155, "protein_per_100g": 13, "carbs_per_100g": 1.1, "fat_per_100g": 11},
        {"name": "Atún", "calories_per_100g": 132, "protein_per_100g": 28, "carbs_per_100g": 0, "fat_per_100g": 1.3},
        {"name": "Salmón", "calories_per_100g": 208, "protein_per_100g": 20, "carbs_per_100g": 0, "fat_per_100g": 13},
        
        # Carbohidratos
        {"name": "Arroz Blanco", "calories_per_100g": 130, "protein_per_100g": 2.7, "carbs_per_100g": 28, "fat_per_100g": 0.3},
        {"name": "Avena", "calories_per_100g": 389, "protein_per_100g": 17, "carbs_per_100g": 66, "fat_per_100g": 7},
        {"name": "Pasta", "calories_per_100g": 131, "protein_per_100g": 5, "carbs_per_100g": 25, "fat_per_100g": 1.1},
        {"name": "Pan Integral", "calories_per_100g": 247, "protein_per_100g": 13, "carbs_per_100g": 41, "fat_per_100g": 3.4},
        {"name": "Patata", "calories_per_100g": 77, "protein_per_100g": 2, "carbs_per_100g": 17, "fat_per_100g": 0.1},
        
        # Verduras
        {"name": "Brócoli", "calories_per_100g": 34, "protein_per_100g": 2.8, "carbs_per_100g": 7, "fat_per_100g": 0.4},
        {"name": "Espinacas", "calories_per_100g": 23, "protein_per_100g": 2.9, "carbs_per_100g": 3.6, "fat_per_100g": 0.4},
        {"name": "Tomate", "calories_per_100g": 18, "protein_per_100g": 0.9, "carbs_per_100g": 3.9, "fat_per_100g": 0.2},
        
        # Frutas
        {"name": "Plátano", "calories_per_100g": 89, "protein_per_100g": 1.1, "carbs_per_100g": 23, "fat_per_100g": 0.3},
        {"name": "Manzana", "calories_per_100g": 52, "protein_per_100g": 0.3, "carbs_per_100g": 14, "fat_per_100g": 0.2},
        
        # Grasas saludables
        {"name": "Aguacate", "calories_per_100g": 160, "protein_per_100g": 2, "carbs_per_100g": 9, "fat_per_100g": 15},
        {"name": "Almendras", "calories_per_100g": 579, "protein_per_100g": 21, "carbs_per_100g": 22, "fat_per_100g": 50},
        {"name": "Aceite de Oliva", "calories_per_100g": 884, "protein_per_100g": 0, "carbs_per_100g": 0, "fat_per_100g": 100},
    ]
    
    food_ids = {}
    for food_data in foods_data:
        food_data["created_at"] = datetime.utcnow()
        _, doc_ref = db.collection("foods").add(food_data)
        food_ids[food_data["name"]] = doc_ref.id
        print(f"  ✓ Created food: {food_data['name']} ({food_data['calories_per_100g']} kcal/100g)")
    
    return food_ids

def seed_diets(user_ids, food_ids):
    """Create sample diets"""
    print("\n=== Seeding Diets ===")
    
    diets_data = [
        {
            "name": "Dieta de Volumen 3000 kcal",
            "description": "Plan alimenticio para ganancia de masa muscular",
            "creator_id": user_ids.get("adrian"),
            "is_public": True,
            "average_rating": 4.6,
            "rating_count": 15,
            "foods": [
                {"food": "Avena", "meal": "Desayuno", "grams": 100},
                {"food": "Plátano", "meal": "Desayuno", "grams": 150},
                {"food": "Pechuga de Pollo", "meal": "Comida", "grams": 200},
                {"food": "Arroz Blanco", "meal": "Comida", "grams": 150},
                {"food": "Brócoli", "meal": "Comida", "grams": 100},
                {"food": "Atún", "meal": "Merienda", "grams": 100},
                {"food": "Pan Integral", "meal": "Merienda", "grams": 80},
                {"food": "Salmón", "meal": "Cena", "grams": 150},
                {"food": "Patata", "meal": "Cena", "grams": 200},
            ]
        },
        {
            "name": "Dieta de Definición 2000 kcal",
            "description": "Plan para pérdida de grasa manteniendo músculo",
            "creator_id": user_ids.get("maria"),
            "is_public": True,
            "average_rating": 4.4,
            "rating_count": 20,
            "foods": [
                {"food": "Huevos", "meal": "Desayuno", "grams": 150},
                {"food": "Pan Integral", "meal": "Desayuno", "grams": 50},
                {"food": "Pechuga de Pollo", "meal": "Comida", "grams": 150},
                {"food": "Arroz Blanco", "meal": "Comida", "grams": 80},
                {"food": "Espinacas", "meal": "Comida", "grams": 100},
                {"food": "Atún", "meal": "Merienda", "grams": 80},
                {"food": "Manzana", "meal": "Merienda", "grams": 100},
                {"food": "Pechuga de Pollo", "meal": "Cena", "grams": 120},
                {"food": "Brócoli", "meal": "Cena", "grams": 150},
            ]
        }
    ]
    
    diet_ids = {}
    for diet_data in diets_data:
        foods = diet_data.pop("foods")
        diet_data["created_at"] = datetime.utcnow()
        
        # Create diet
        _, diet_ref = db.collection("diets").add(diet_data)
        diet_ids[diet_data["name"]] = diet_ref.id
        print(f"  ✓ Created diet: {diet_data['name']} (ID: {diet_ref.id})")
        
        # Create diet foods
        for food in foods:
            food_name = food["food"]
            food_id = food_ids.get(food_name)
            
            if food_id:
                diet_food_data = {
                    "diet_id": diet_ref.id,
                    "food_id": food_id,
                    "meal_name": food.get("meal", "Comida"),
                    "quantity_grams": food.get("grams", 100)
                }
                db.collection("diet_foods").add(diet_food_data)
                print(f"    - Added food: {food_name} ({food['grams']}g)")
    
    return diet_ids

def main():
    """Main seeding function"""
    print("=" * 60)
    print("FIREBASE DATABASE SEEDING")
    print("=" * 60)
    
    # Optional: Clear existing data (uncomment if you want to start fresh)
    # WARNING: This will delete all existing data!
    # clear_collections = input("\n⚠️  Clear existing data? (yes/no): ")
    # if clear_collections.lower() == 'yes':
    #     clear_collection("users")
    #     clear_collection("exercises")
    #     clear_collection("routines")
    #     clear_collection("routine_exercises")
    #     clear_collection("foods")
    #     clear_collection("diets")
    #     clear_collection("diet_foods")
    
    # Seed data
    user_ids = seed_users()
    exercise_ids = seed_exercises()
    routine_ids = seed_routines(user_ids, exercise_ids)
    food_ids = seed_foods()
    diet_ids = seed_diets(user_ids, food_ids)
    
    print("\n" + "=" * 60)
    print("✅ SEEDING COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print(f"\nCreated:")
    print(f"  - {len(user_ids)} users")
    print(f"  - {len(exercise_ids)} exercises")
    print(f"  - {len(routine_ids)} routines")
    print(f"  - {len(food_ids)} foods")
    print(f"  - {len(diet_ids)} diets")
    
    print("\n📝 Test Credentials:")
    print("  Email: adrian@gymtrack.com | Password: adrian123")
    print("  Email: test@test.com | Password: test123")
    print("\n")

if __name__ == "__main__":
    main()
