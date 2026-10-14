#!/bin/bash
# Stella Pi management script
# Usage: stella [status|restart|logs|drive|api]
#
# TEMPORARY (2026-10-14): Using Arduino Uno on /dev/ttyUSB0
# because the old Mega died. When the adapter arrives, switch
# roomba.yaml back to the Mega's port and update this script.

API_PORT=8000
DRIVER_SERVICE="roomba-driver"
API_SERVICE="roomba-api"

case "${1:-status}" in
  status)
    echo "=== Stella Status ==="
    echo ""
    echo "--- Services ---"
    systemctl is-active $DRIVER_SERVICE 2>/dev/null | sed "s/^/driver: /"
    systemctl is-active $API_SERVICE 2>/dev/null | sed "s/^/api: /"
    echo ""
    echo "--- Serial Ports ---"
    ls /dev/ttyACM* /dev/ttyUSB* 2>/dev/null || echo "No serial devices found!"
    echo ""
    echo "--- Robot Status ---"
    curl -s -m 5 http://localhost:$API_PORT/status 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "API not responding on port $API_PORT"
    ;;

  restart)
    echo "Restarting Stella services..."
    sudo systemctl restart $DRIVER_SERVICE
    sudo systemctl restart $API_SERVICE
    sleep 3
    echo ""
    echo "Driver: $(systemctl is-active $DRIVER_SERVICE 2>/dev/null)"
    echo "API: $(systemctl is-active $API_SERVICE 2>/dev/null)"
    ;;

  restart-driver)
    echo "Restarting driver only..."
    sudo systemctl restart $DRIVER_SERVICE
    sleep 2
    echo "Driver: $(systemctl is-active $DRIVER_SERVICE 2>/dev/null)"
    ;;

  logs)
    echo "=== Driver logs (last 30) ==="
    journalctl -u $DRIVER_SERVICE -n 30 --no-pager
    ;;

  logs-api)
    echo "=== API logs (last 30) ==="
    journalctl -u $API_SERVICE -n 30 --no-pager
    ;;

  follow)
    echo "Following driver logs (Ctrl+C to exit)..."
    journalctl -u $DRIVER_SERVICE -f --no-pager
    ;;

  *)
    echo "Usage: stella [status|restart|restart-driver|logs|logs-api|follow]"
    echo ""
    echo "  status          Show services, serial ports, and robot status"
    echo "  restart         Restart both driver and API"
    echo "  restart-driver  Restart driver only"
    echo "  logs            Last 30 driver log lines"
    echo "  logs-api        Last 30 API log lines"
    echo "  follow          Tail driver logs live"
    ;;
esac
