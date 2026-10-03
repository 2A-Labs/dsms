from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.common import settings
from app.database import get_db
from app.models import Course
from app.schemas import CourseResponse, HeroImageResponse

import json
from threading import Lock
from time import monotonic
from urllib.parse import urlencode
from urllib.request import Request, urlopen

SETUP_REQUIRED_MESSAGE = "Please ask your administrator to set up the application"
HERO_IMAGE_CACHE_SECONDS = 60
hero_image_cache: HeroImageResponse | None = None
hero_image_last_requested_at = 0.0
hero_image_cache_lock = Lock()

router = APIRouter()

@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


@router.get("/api/courses", response_model=list[CourseResponse])
def list_courses(db: Session = Depends(get_db)) -> list[Course]:
    return list(db.scalars(select(Course).order_by(Course.id)))


def fetch_unsplash_hero_image() -> HeroImageResponse:
    access_key = settings.unsplash_access_key
    if not access_key:
        raise HTTPException(status_code=503, detail="Unsplash is not configured")

    query = urlencode({"query": "driving lesson", "orientation": "landscape"})
    request = Request(
        f"https://api.unsplash.com/photos/random?{query}",
        headers={"Authorization": f"Client-ID {access_key}"},
    )
    try:
        with urlopen(request, timeout=5) as response:
            photo = json.loads(response.read())
    except (OSError, ValueError) as error:
        raise HTTPException(status_code=502, detail="Unable to load the Unsplash image") from error

    user = photo.get("user", {})
    links = photo.get("links", {})
    photographer_name = user.get("name")
    photographer_url = user.get("links", {}).get("html")
    image_url = photo.get("urls", {}).get("regular")
    unsplash_url = links.get("html")
    if not all((photographer_name, photographer_url, image_url, unsplash_url)):
        raise HTTPException(status_code=502, detail="Unsplash returned an incomplete image")
    return HeroImageResponse(
        image_url=image_url,
        photographer_name=photographer_name,
        photographer_url=photographer_url,
        unsplash_url=unsplash_url,
    )


@router.get("/api/branding/hero-image", response_model=HeroImageResponse)
def get_hero_image() -> HeroImageResponse:
    global hero_image_cache, hero_image_last_requested_at

    with hero_image_cache_lock:
        now = monotonic()
        if (
            hero_image_cache is not None
            and now - hero_image_last_requested_at < HERO_IMAGE_CACHE_SECONDS
        ):
            return hero_image_cache

        cached_image = hero_image_cache
        hero_image_last_requested_at = now
        try:
            hero_image_cache = fetch_unsplash_hero_image()
        except HTTPException:
            if cached_image is not None:
                return cached_image
            raise
        return hero_image_cache
