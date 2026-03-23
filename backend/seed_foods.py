"""
Seed Firestore 'foods' collection with common Spanish foods.
Run once: python seed_foods.py
"""
import firebase_admin
from firebase_admin import credentials, firestore
import sys, os

KEY_PATH = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')

try:
    app = firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate(KEY_PATH)
    app = firebase_admin.initialize_app(cred)

db = firestore.client()

FOODS = [
    # Carnes
    {"name": "Pechuga de Pollo", "category": "Carnes", "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6, "serving_size": "100g"},
    {"name": "Muslo de Pollo", "category": "Carnes", "calories": 209, "protein": 26, "carbs": 0, "fat": 11, "serving_size": "100g"},
    {"name": "Ternera (filete)", "category": "Carnes", "calories": 187, "protein": 26, "carbs": 0, "fat": 9, "serving_size": "100g"},
    {"name": "Cerdo (lomo)", "category": "Carnes", "calories": 242, "protein": 27, "carbs": 0, "fat": 14, "serving_size": "100g"},
    {"name": "Jamón Serrano", "category": "Carnes", "calories": 241, "protein": 30, "carbs": 1, "fat": 13, "serving_size": "100g"},
    {"name": "Pavo (pechuga)", "category": "Carnes", "calories": 104, "protein": 22, "carbs": 0, "fat": 1.5, "serving_size": "100g"},
    {"name": "Cordero", "category": "Carnes", "calories": 282, "protein": 25, "carbs": 0, "fat": 20, "serving_size": "100g"},
    {"name": "Salchichas Frankfurt", "category": "Carnes", "calories": 290, "protein": 12, "carbs": 3, "fat": 26, "serving_size": "100g"},
    {"name": "Chorizo", "category": "Carnes", "calories": 455, "protein": 24, "carbs": 2, "fat": 40, "serving_size": "100g"},
    {"name": "Bacon", "category": "Carnes", "calories": 541, "protein": 37, "carbs": 1, "fat": 42, "serving_size": "100g"},
    # Pescados y Mariscos
    {"name": "Salmón", "category": "Pescados", "calories": 208, "protein": 20, "carbs": 0, "fat": 13, "serving_size": "100g"},
    {"name": "Atún (fresco)", "category": "Pescados", "calories": 144, "protein": 23, "carbs": 0, "fat": 5, "serving_size": "100g"},
    {"name": "Atún en lata (al natural)", "category": "Pescados", "calories": 98, "protein": 21, "carbs": 0, "fat": 1.5, "serving_size": "100g"},
    {"name": "Merluza", "category": "Pescados", "calories": 86, "protein": 18, "carbs": 0, "fat": 1.4, "serving_size": "100g"},
    {"name": "Bacalao", "category": "Pescados", "calories": 82, "protein": 18, "carbs": 0, "fat": 0.7, "serving_size": "100g"},
    {"name": "Sardinas", "category": "Pescados", "calories": 208, "protein": 25, "carbs": 0, "fat": 11, "serving_size": "100g"},
    {"name": "Gambas", "category": "Pescados", "calories": 71, "protein": 14, "carbs": 0, "fat": 1, "serving_size": "100g"},
    {"name": "Mejillones", "category": "Pescados", "calories": 86, "protein": 12, "carbs": 4, "fat": 2, "serving_size": "100g"},
    {"name": "Dorada", "category": "Pescados", "calories": 96, "protein": 17, "carbs": 0, "fat": 3, "serving_size": "100g"},
    {"name": "Sepia", "category": "Pescados", "calories": 79, "protein": 16, "carbs": 1, "fat": 1, "serving_size": "100g"},
    # Lácteos y Huevos
    {"name": "Huevo entero", "category": "Lácteos y Huevos", "calories": 143, "protein": 13, "carbs": 1, "fat": 10, "serving_size": "100g"},
    {"name": "Clara de Huevo", "category": "Lácteos y Huevos", "calories": 52, "protein": 11, "carbs": 0.7, "fat": 0.2, "serving_size": "100g"},
    {"name": "Leche Entera", "category": "Lácteos y Huevos", "calories": 61, "protein": 3.2, "carbs": 4.7, "fat": 3.3, "serving_size": "100ml"},
    {"name": "Leche Desnatada", "category": "Lácteos y Huevos", "calories": 35, "protein": 3.4, "carbs": 5, "fat": 0.1, "serving_size": "100ml"},
    {"name": "Yogur Natural", "category": "Lácteos y Huevos", "calories": 59, "protein": 3.5, "carbs": 4.7, "fat": 3.2, "serving_size": "100g"},
    {"name": "Yogur Griego", "category": "Lácteos y Huevos", "calories": 133, "protein": 5.7, "carbs": 3.6, "fat": 10, "serving_size": "100g"},
    {"name": "Queso Fresco", "category": "Lácteos y Huevos", "calories": 98, "protein": 10, "carbs": 3, "fat": 5, "serving_size": "100g"},
    {"name": "Queso Manchego", "category": "Lácteos y Huevos", "calories": 392, "protein": 22, "carbs": 2, "fat": 33, "serving_size": "100g"},
    {"name": "Requesón", "category": "Lácteos y Huevos", "calories": 98, "protein": 11, "carbs": 3.4, "fat": 4.3, "serving_size": "100g"},
    {"name": "Mozzarella", "category": "Lácteos y Huevos", "calories": 280, "protein": 22, "carbs": 2, "fat": 21, "serving_size": "100g"},
    # Legumbres y Cereales
    {"name": "Arroz Blanco (cocido)", "category": "Cereales", "calories": 130, "protein": 2.7, "carbs": 28, "fat": 0.3, "serving_size": "100g"},
    {"name": "Arroz Integral (cocido)", "category": "Cereales", "calories": 111, "protein": 2.6, "carbs": 23, "fat": 0.9, "serving_size": "100g"},
    {"name": "Pasta (cocida)", "category": "Cereales", "calories": 131, "protein": 5, "carbs": 25, "fat": 1.1, "serving_size": "100g"},
    {"name": "Pan Blanco", "category": "Cereales", "calories": 265, "protein": 9, "carbs": 49, "fat": 3.2, "serving_size": "100g"},
    {"name": "Pan Integral", "category": "Cereales", "calories": 247, "protein": 9, "carbs": 44, "fat": 3.4, "serving_size": "100g"},
    {"name": "Avena (cruda)", "category": "Cereales", "calories": 379, "protein": 13, "carbs": 67, "fat": 7, "serving_size": "100g"},
    {"name": "Lentejas (cocidas)", "category": "Legumbres", "calories": 116, "protein": 9, "carbs": 20, "fat": 0.4, "serving_size": "100g"},
    {"name": "Garbanzos (cocidos)", "category": "Legumbres", "calories": 164, "protein": 9, "carbs": 27, "fat": 2.6, "serving_size": "100g"},
    {"name": "Alubias (cocidas)", "category": "Legumbres", "calories": 127, "protein": 9, "carbs": 23, "fat": 0.5, "serving_size": "100g"},
    {"name": "Guisantes", "category": "Legumbres", "calories": 81, "protein": 5, "carbs": 14, "fat": 0.4, "serving_size": "100g"},
    {"name": "Maíz dulce", "category": "Legumbres", "calories": 86, "protein": 3.2, "carbs": 19, "fat": 1.2, "serving_size": "100g"},
    # Verduras
    {"name": "Brócoli", "category": "Verduras", "calories": 34, "protein": 2.8, "carbs": 7, "fat": 0.4, "serving_size": "100g"},
    {"name": "Espinacas", "category": "Verduras", "calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4, "serving_size": "100g"},
    {"name": "Lechuga", "category": "Verduras", "calories": 15, "protein": 1.4, "carbs": 2.9, "fat": 0.2, "serving_size": "100g"},
    {"name": "Tomate", "category": "Verduras", "calories": 18, "protein": 0.9, "carbs": 3.9, "fat": 0.2, "serving_size": "100g"},
    {"name": "Pepino", "category": "Verduras", "calories": 15, "protein": 0.7, "carbs": 3.6, "fat": 0.1, "serving_size": "100g"},
    {"name": "Zanahoria", "category": "Verduras", "calories": 41, "protein": 0.9, "carbs": 10, "fat": 0.2, "serving_size": "100g"},
    {"name": "Calabacín", "category": "Verduras", "calories": 17, "protein": 1.2, "carbs": 3.1, "fat": 0.3, "serving_size": "100g"},
    {"name": "Pimiento Rojo", "category": "Verduras", "calories": 31, "protein": 1, "carbs": 7, "fat": 0.3, "serving_size": "100g"},
    {"name": "Cebolla", "category": "Verduras", "calories": 40, "protein": 1.1, "carbs": 9, "fat": 0.1, "serving_size": "100g"},
    {"name": "Ajo", "category": "Verduras", "calories": 149, "protein": 6.4, "carbs": 33, "fat": 0.5, "serving_size": "100g"},
    {"name": "Champiñones", "category": "Verduras", "calories": 22, "protein": 3.1, "carbs": 3.3, "fat": 0.3, "serving_size": "100g"},
    {"name": "Coliflor", "category": "Verduras", "calories": 25, "protein": 1.9, "carbs": 5, "fat": 0.3, "serving_size": "100g"},
    {"name": "Espárragos", "category": "Verduras", "calories": 20, "protein": 2.2, "carbs": 3.9, "fat": 0.1, "serving_size": "100g"},
    {"name": "Alcachofa", "category": "Verduras", "calories": 47, "protein": 3.3, "carbs": 10.5, "fat": 0.2, "serving_size": "100g"},
    {"name": "Berenjena", "category": "Verduras", "calories": 25, "protein": 1, "carbs": 5.9, "fat": 0.2, "serving_size": "100g"},
    {"name": "Acelgas", "category": "Verduras", "calories": 19, "protein": 1.8, "carbs": 3.7, "fat": 0.2, "serving_size": "100g"},
    # Frutas
    {"name": "Plátano", "category": "Frutas", "calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3, "serving_size": "100g"},
    {"name": "Manzana", "category": "Frutas", "calories": 52, "protein": 0.3, "carbs": 14, "fat": 0.2, "serving_size": "100g"},
    {"name": "Naranja", "category": "Frutas", "calories": 47, "protein": 0.9, "carbs": 12, "fat": 0.1, "serving_size": "100g"},
    {"name": "Pera", "category": "Frutas", "calories": 57, "protein": 0.4, "carbs": 15, "fat": 0.1, "serving_size": "100g"},
    {"name": "Fresas", "category": "Frutas", "calories": 32, "protein": 0.7, "carbs": 7.7, "fat": 0.3, "serving_size": "100g"},
    {"name": "Uvas", "category": "Frutas", "calories": 67, "protein": 0.6, "carbs": 17, "fat": 0.4, "serving_size": "100g"},
    {"name": "Melón", "category": "Frutas", "calories": 34, "protein": 0.8, "carbs": 8, "fat": 0.2, "serving_size": "100g"},
    {"name": "Sandía", "category": "Frutas", "calories": 30, "protein": 0.6, "carbs": 7.6, "fat": 0.2, "serving_size": "100g"},
    {"name": "Kiwi", "category": "Frutas", "calories": 61, "protein": 1.1, "carbs": 15, "fat": 0.5, "serving_size": "100g"},
    {"name": "Melocotón", "category": "Frutas", "calories": 39, "protein": 0.9, "carbs": 10, "fat": 0.3, "serving_size": "100g"},
    {"name": "Mango", "category": "Frutas", "calories": 60, "protein": 0.8, "carbs": 15, "fat": 0.4, "serving_size": "100g"},
    {"name": "Piña", "category": "Frutas", "calories": 50, "protein": 0.5, "carbs": 13, "fat": 0.1, "serving_size": "100g"},
    {"name": "Cereza", "category": "Frutas", "calories": 63, "protein": 1.1, "carbs": 16, "fat": 0.2, "serving_size": "100g"},
    {"name": "Higo", "category": "Frutas", "calories": 74, "protein": 0.8, "carbs": 19, "fat": 0.3, "serving_size": "100g"},
    # Frutos secos y semillas
    {"name": "Almendras", "category": "Frutos Secos", "calories": 579, "protein": 21, "carbs": 22, "fat": 50, "serving_size": "100g"},
    {"name": "Nueces", "category": "Frutos Secos", "calories": 654, "protein": 15, "carbs": 14, "fat": 65, "serving_size": "100g"},
    {"name": "Cacahuetes", "category": "Frutos Secos", "calories": 567, "protein": 26, "carbs": 16, "fat": 49, "serving_size": "100g"},
    {"name": "Pistachos", "category": "Frutos Secos", "calories": 562, "protein": 20, "carbs": 28, "fat": 45, "serving_size": "100g"},
    {"name": "Anacardos", "category": "Frutos Secos", "calories": 553, "protein": 18, "carbs": 30, "fat": 44, "serving_size": "100g"},
    {"name": "Semillas de Chía", "category": "Frutos Secos", "calories": 486, "protein": 17, "carbs": 42, "fat": 31, "serving_size": "100g"},
    {"name": "Semillas de Girasol", "category": "Frutos Secos", "calories": 584, "protein": 20, "carbs": 20, "fat": 51, "serving_size": "100g"},
    {"name": "Mantequilla de Cacahuete", "category": "Frutos Secos", "calories": 588, "protein": 25, "carbs": 20, "fat": 50, "serving_size": "100g"},
    # Aceites y grasas
    {"name": "Aceite de Oliva", "category": "Aceites", "calories": 884, "protein": 0, "carbs": 0, "fat": 100, "serving_size": "100ml"},
    {"name": "Aceite de Girasol", "category": "Aceites", "calories": 884, "protein": 0, "carbs": 0, "fat": 100, "serving_size": "100ml"},
    {"name": "Mantequilla", "category": "Aceites", "calories": 717, "protein": 0.9, "carbs": 0.1, "fat": 81, "serving_size": "100g"},
    # Proteínas en polvo y suplementos
    {"name": "Proteína de Suero (Whey)", "category": "Suplementos", "calories": 373, "protein": 80, "carbs": 8, "fat": 5, "serving_size": "100g"},
    {"name": "Proteína Vegana", "category": "Suplementos", "calories": 360, "protein": 70, "carbs": 15, "fat": 7, "serving_size": "100g"},
    {"name": "Creatina", "category": "Suplementos", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "serving_size": "5g"},
    # Bebidas
    {"name": "Zumo de Naranja", "category": "Bebidas", "calories": 45, "protein": 0.7, "carbs": 10, "fat": 0.2, "serving_size": "100ml"},
    {"name": "Leche de Avena", "category": "Bebidas", "calories": 40, "protein": 1, "carbs": 6.7, "fat": 1.5, "serving_size": "100ml"},
    {"name": "Leche de Almendra", "category": "Bebidas", "calories": 13, "protein": 0.4, "carbs": 0.3, "fat": 1.1, "serving_size": "100ml"},
    # Preparados y platos
    {"name": "Tortilla Española", "category": "Platos", "calories": 163, "protein": 7.5, "carbs": 10, "fat": 10, "serving_size": "100g"},
    {"name": "Cocido Madrileño (porción)", "category": "Platos", "calories": 200, "protein": 14, "carbs": 18, "fat": 7, "serving_size": "100g"},
    {"name": "Paella de Pollo", "category": "Platos", "calories": 180, "protein": 12, "carbs": 20, "fat": 5, "serving_size": "100g"},
    {"name": "Gazpacho", "category": "Platos", "calories": 54, "protein": 1.3, "carbs": 6, "fat": 2.7, "serving_size": "100ml"},
    # Snacks y dulces
    {"name": "Chocolate Negro 70%", "category": "Dulces", "calories": 601, "protein": 7.8, "carbs": 46, "fat": 43, "serving_size": "100g"},
    {"name": "Gofio de Millo", "category": "Cereales", "calories": 362, "protein": 12, "carbs": 66, "fat": 5, "serving_size": "100g"},
    {"name": "Galletas María", "category": "Dulces", "calories": 445, "protein": 7, "carbs": 73, "fat": 14, "serving_size": "100g"},
]

# Create the search name (lowercase, no accents) for better searching
import unicodedata

def normalize_name(text):
    nfkd = unicodedata.normalize('NFD', text.lower())
    return ''.join(c for c in nfkd if not unicodedata.combining(c))

foods_ref = db.collection('foods')

# Check if already seeded
existing = list(foods_ref.limit(1).stream())
if existing:
    print(f"Collection 'foods' already has data. Found {len(list(foods_ref.stream()))} foods.")
    resp = input("Re-seed? (y/n): ")
    if resp.lower() != 'y':
        print("Skipping seed.")
        sys.exit(0)

print(f"Seeding {len(FOODS)} foods...")
batch = db.batch()
for i, food in enumerate(FOODS):
    food['search_name'] = normalize_name(food['name'])
    food['quantity'] = 100
    ref = foods_ref.document()
    batch.set(ref, food)
    if (i + 1) % 100 == 0:
        batch.commit()
        batch = db.batch()
        print(f"  {i+1} foods committed...")

batch.commit()
print(f"Done! {len(FOODS)} foods seeded to Firestore 'foods' collection.")
