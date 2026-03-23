from app.db.session import db
docs = db.collection("routines").order_by("created_at", direction="DESCENDING").limit(5).stream()
for d in docs:
    data = d.to_dict()
    print(d.id, data.get("name"), data.get("creator_id"), data.get("is_public"))

