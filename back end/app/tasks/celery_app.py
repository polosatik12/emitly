import os

from celery import Celery

celery_app = Celery("news_parser")

celery_app.config_from_object({
    "broker_url": os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    "result_backend": os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
    "timezone": "UTC",
    "enable_utc": True,
    "task_serializer": "json",
    "accept_content": ["json"],
    "result_serializer": "json",
    "task_track_started": True,
    "worker_prefetch_multiplier": 1,
    "beat_schedule": {
        "run-full-parse-cycle-every-minute": {
            "task": "app.tasks.parse_tasks.run_full_parse_cycle",
            "schedule": 60.0,
        },
    },
})

celery_app.autodiscover_tasks(["app.tasks"])
