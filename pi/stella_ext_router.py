"""Extra Stella endpoints used by the new dashboard (web/src/components/os).

NOT DEPLOYED / NOT TESTED ON THE PI YET. Drop next to robot_api.py and add:

    from stella_ext_router import router as ext_router
    app.include_router(ext_router)

State is kept in ~/stella_state.json so zones, settings and thermostat choices survive restarts.
`/navigate` and `/climate` are stubs until nav (Nav2) and the Nest link (Matter or Google SDM) exist; the UI shows a
friendly toast when they answer with an error.
"""
import json, time, collections
from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter()
STATE = Path.home() / "stella_state.json"
_mem = {"zones": [], "settings": {}, "climate": {"cur": None, "set": 72, "mode": "auto", "eco": True}}
LOGS = collections.deque(maxlen=400)   # call log_event() from the driver / lidar / voice code


def log_event(src: str, lv: str, m: str):
    LOGS.append({"ts": int(time.time() * 1000), "t": time.strftime("%H:%M:%S"), "src": src, "lv": lv, "m": m})


def _load():
    try:
        _mem.update(json.loads(STATE.read_text()))
    except Exception:
        pass


def _save():
    try:
        STATE.write_text(json.dumps(_mem))
    except Exception:
        pass


_load()


@router.get("/zones")
def get_zones():
    return {"zones": _mem["zones"]}


@router.post("/zones")
def set_zones(body: dict):
    _mem["zones"] = body.get("zones", [])
    _save()
    return {"success": True}


@router.get("/settings")
def get_settings():
    return _mem["settings"]


@router.post("/settings")
def set_settings(body: dict):
    _mem["settings"] = body
    _save()
    return {"success": True}


@router.get("/logs")
def get_logs(since: int = 0):
    return {"logs": [e for e in LOGS if e["ts"] > since][-120:]}


@router.get("/climate")
def get_climate():
    if _mem["climate"].get("cur") is None:
        raise HTTPException(503, "Thermostat not linked")
    return _mem["climate"]


@router.post("/climate")
def set_climate(body: dict):
    _mem["climate"].update({k: body[k] for k in ("set", "mode", "eco") if k in body})
    _save()
    raise HTTPException(503, "Thermostat not linked (settings saved, nothing sent to the Nest)")


@router.post("/navigate")
def navigate(body: dict):
    raise HTTPException(501, "Autonomous navigation is not built yet (target=%s)" % body.get("target"))
