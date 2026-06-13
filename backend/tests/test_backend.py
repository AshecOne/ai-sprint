"""Backend tests for the Aquarium Simulator backend (health + sprites)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://a1e9e9ba-bbbc-4135-9d24-f72b44ae12f1.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Health endpoint
class TestHealth:
    def test_health_status_ok(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"
        assert "service" in data


# Sprites listing
class TestSprites:
    def test_sprites_endpoint_returns_list(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/sprites", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "sprites" in data
        assert isinstance(data["sprites"], list)

    def test_sprites_count_is_22(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/sprites", timeout=10)
        sprites = r.json()["sprites"]
        assert len(sprites) == 22, f"Expected 22 sprites, found {len(sprites)}: {sprites}"

    def test_sprites_contain_required_files(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/sprites", timeout=10)
        sprites = set(r.json()["sprites"])
        required = {
            "bubble.png", "tank_background.png", "substrate_gravel.png",
            "fish_guppy.png", "fish_neon_tetra.png", "fish_betta.png",
            "fish_angelfish.png", "fish_goldfish.png", "fish_corydoras.png",
            "fish_discus.png",
            "plant_amazon_sword.png", "plant_anubias.png", "plant_java_fern.png",
            "plant_java_moss.png", "plant_vallisneria.png",
            "equipment_filter.png", "equipment_heater.png", "equipment_airstone.png",
            "equipment_light.png", "equipment_co2.png",
            "rock_decor_1.png", "rock_decor_2.png",
        }
        missing = required - sprites
        assert not missing, f"Missing sprites: {missing}"

    def test_sprite_png_accessible(self, api_client):
        r = api_client.get(f"{BASE_URL}/sprites/fish_guppy.png", timeout=10)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("image/")
        assert len(r.content) > 100
