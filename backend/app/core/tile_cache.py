"""
VIGIL-FLOOD - Backend Tile Caching & Reverse Proxy Engine
SIH 26192 — Flash Flood Early Warning System
Supports Redis In-Memory Caching with Automatic Local Disk/Memory Fallback.
"""

import os
import time
import urllib.request
from pathlib import Path
from typing import Optional, Dict, Any

# Tile cache directory for persistent offline fallback
CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "cache" / "tiles"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Provider URL Templates
TILE_PROVIDERS: Dict[str, str] = {
    "google_hybrid": "https://mt{sub}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    "google_terrain": "https://mt{sub}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    "google_satellite": "https://mt{sub}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    "google_roads": "https://mt{sub}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    "esri_satellite": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    "terrain_dem": "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
    "topo": "https://{sub_letter}.tile.opentopomap.org/{z}/{x}/{y}.png",
    "carto_dark": "https://{sub_letter}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"
}

class TileCacheManager:
    """
    High-Performance Map Tile Caching & Proxy Service.
    Eliminates WebGL CORS errors, prevents rate-limiting, and enables offline demo mode.
    """
    def __init__(self):
        self.redis_client = None
        self.is_redis_available = False
        self.memory_cache: Dict[str, bytes] = {}
        self.max_memory_items = 2000
        self.ttl_seconds = 86400 * 7  # 7-day cache persistence

        # Attempt Redis connection
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            client = redis.Redis.from_url(redis_url, socket_timeout=1, socket_connect_timeout=1)
            client.ping()
            self.redis_client = client
            self.is_redis_available = True
            print("🚀 [TileCache] Connected to Redis In-Memory Cache on localhost:6379")
        except Exception:
            self.is_redis_available = False
            self.redis_client = None
            print("⚡ [TileCache] Redis server offline. Operating in High-Speed Local In-Memory/Disk Fallback Mode.")

    def get_tile(self, provider: str, z: int, x: int, y: int) -> Optional[bytes]:
        """
        Retrieves tile bytes from Cache (Redis -> Memory -> Disk) or fetches upstream on miss.
        """
        cache_key = f"tile:{provider}:{z}:{x}:{y}"
        disk_file = CACHE_DIR / f"{provider}_{z}_{x}_{y}.png"

        # 1. Check Redis Cache
        if self.is_redis_available and self.redis_client:
            try:
                cached = self.redis_client.get(cache_key)
                if cached:
                    return cached
            except Exception:
                self.is_redis_available = False

        # 2. Check Fast In-Memory Cache
        if cache_key in self.memory_cache:
            return self.memory_cache[cache_key]

        # 3. Check Local Disk Cache (Offline demo ready)
        if disk_file.exists():
            try:
                data = disk_file.read_bytes()
                self._save_to_memory(cache_key, data)
                return data
            except Exception:
                pass

        # 4. Cache MISS -> Fetch from Upstream Server
        tile_data = self._fetch_upstream(provider, z, x, y)
        if tile_data:
            self._save_to_cache(cache_key, disk_file, tile_data)
            return tile_data

        return None

    def _save_to_memory(self, key: str, data: bytes):
        if len(self.memory_cache) >= self.max_memory_items:
            # Simple LRU eviction
            first_key = next(iter(self.memory_cache))
            del self.memory_cache[first_key]
        self.memory_cache[key] = data

    def _save_to_cache(self, cache_key: str, disk_file: Path, data: bytes):
        # Save to Memory
        self._save_to_memory(cache_key, data)

        # Save to Redis
        if self.is_redis_available and self.redis_client:
            try:
                self.redis_client.setex(cache_key, self.ttl_seconds, data)
            except Exception:
                pass

        # Save to Disk for offline stability
        try:
            disk_file.write_bytes(data)
        except Exception:
            pass

    def _fetch_upstream(self, provider: str, z: int, x: int, y: int) -> Optional[bytes]:
        template = TILE_PROVIDERS.get(provider)
        if not template:
            return None

        # Handle subdomains for Google / OpenStreetMap
        subdomain = (x + y) % 4
        sub_letter = ["a", "b", "c", "d"][subdomain]
        url = template.format(sub=subdomain, sub_letter=sub_letter, z=z, x=x, y=y)

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Referer": "https://www.google.com/"
        }

        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=4) as response:
                return response.read()
        except Exception as e:
            # Fallback for Google subdomains
            if "google" in provider:
                try:
                    alt_url = url.replace(f"mt{subdomain}", f"mt{(subdomain + 1) % 4}")
                    req = urllib.request.Request(alt_url, headers=headers)
                    with urllib.request.urlopen(req, timeout=3) as response:
                        return response.read()
                except Exception:
                    pass
            return None

# Singleton instance
tile_cache_manager = TileCacheManager()
