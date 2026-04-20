import os
from datetime import datetime, timedelta, timezone
import firebase_admin
from firebase_admin import credentials, firestore
from supabase import create_client
import requests

INACTIVITY_DAYS = 7

db = None
supabase = None


def _init_clients() -> None:
    global db, supabase
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": os.environ["FIREBASE_PROJECT_ID"],
        "client_email": os.environ["FIREBASE_CLIENT_EMAIL"],
        "private_key": os.environ["FIREBASE_PRIVATE_KEY"].replace("\\n", "\n"),
        "token_uri": "https://oauth2.googleapis.com/token",
    })
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    supabase = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def create_clickup_task(student_name: str, student_email: str) -> str | None:
    res = requests.post(
        f"https://api.clickup.com/api/v2/list/{os.environ['CLICKUP_LIST_ID']}/task",
        headers={"Authorization": os.environ["CLICKUP_API_TOKEN"], "Content-Type": "application/json"},
        json={
            "name": f"Retenção urgente: {student_name}",
            "description": f"Aluno {student_email} inativo há mais de {INACTIVITY_DAYS} dias.",
            "priority": 1,
        },
        timeout=10,
    )
    if res.ok:
        return res.json().get("id")
    return None


def log_to_supabase(student_email: str, clickup_task_id: str | None) -> None:
    supabase.table("churn_alerts").insert({
        "clickup_task_id": clickup_task_id,
    }).execute()


def run() -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(days=INACTIVITY_DAYS)
    users = db.collection("users").stream()

    for user_doc in users:
        data = user_doc.to_dict()
        if not data.get("access_enabled"):
            continue
        last_login = data.get("last_login")
        if last_login is None or last_login > cutoff:
            continue

        print(f"Aluno inativo: {data['email']}")
        task_id = create_clickup_task(data["name"], data["email"])
        log_to_supabase(data["email"], task_id)


if __name__ == "__main__":
    _init_clients()
    run()
    print("Script de churn concluído.")
