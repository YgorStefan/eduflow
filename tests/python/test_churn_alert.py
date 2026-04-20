import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta, timezone

@pytest.fixture(autouse=True)
def mock_env(monkeypatch):
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "test-project")
    monkeypatch.setenv("FIREBASE_CLIENT_EMAIL", "test@test.com")
    monkeypatch.setenv("FIREBASE_PRIVATE_KEY", "fake-key")
    monkeypatch.setenv("CLICKUP_API_TOKEN", "test-token")
    monkeypatch.setenv("CLICKUP_LIST_ID", "test-list")
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-key")

def make_user_doc(days_ago: int, access_enabled: bool = True):
    last_login = datetime.now(timezone.utc) - timedelta(days=days_ago)
    mock = MagicMock()
    mock.id = "test@email.com"
    mock.to_dict.return_value = {
        "name": "Aluno Teste",
        "email": "test@email.com",
        "access_enabled": access_enabled,
        "last_login": last_login,
    }
    return mock

def test_detects_inactive_users():
    with patch("scripts.churn_alert.db") as mock_db, \
         patch("scripts.churn_alert.create_clickup_task") as mock_task, \
         patch("scripts.churn_alert.log_to_supabase"):

        mock_db.collection.return_value.stream.return_value = [
            make_user_doc(days_ago=8),   # inativo — deve alertar
            make_user_doc(days_ago=3),   # ativo — não deve alertar
            make_user_doc(days_ago=10, access_enabled=False),  # desabilitado — não deve alertar
        ]

        from scripts.churn_alert import run
        run()

        assert mock_task.call_count == 1
        mock_task.assert_called_once_with("Aluno Teste", "test@email.com")

def test_skips_recently_active_users():
    with patch("scripts.churn_alert.db") as mock_db, \
         patch("scripts.churn_alert.create_clickup_task") as mock_task, \
         patch("scripts.churn_alert.log_to_supabase"):

        mock_db.collection.return_value.stream.return_value = [
            make_user_doc(days_ago=2),
            make_user_doc(days_ago=6),
        ]

        from scripts.churn_alert import run
        run()

        mock_task.assert_not_called()
