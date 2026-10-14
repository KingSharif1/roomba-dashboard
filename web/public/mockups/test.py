from playwright.sync_api import sync_playwright
import sys,os
base=sys.argv[1]; os.makedirs('/workspace/stella-mockups-shots',exist_ok=True)
errs=[]
with sync_playwright() as p:
  b=p.chromium.launch(executable_path="/usr/bin/google-chrome")
  for w,h in [(390,844),(1440,900)]:
    for d in "DF":
      for t in ["light","dark"]:
        pg=b.new_page(viewport={"width":w,"height":h})
        pg.on("pageerror",lambda e:errs.append(str(e)))
        pg.goto(f"{base}?d={d}&t={t}#home"); pg.wait_for_timeout(400)
        for v in ["home","map","camera","history","learning","settings","offline"]:
          pg.evaluate(f"go('{v}')"); pg.wait_for_timeout(250)
          if v=="home":
            pg.click("[data-d='1,0']"); pg.click("#modes button[data-v=Turbo]"); pg.click("[data-a=clean]")
          if v=="map":
            pg.click("#mapview button[data-v=Plan]"); pg.click("[data-route='0']"); pg.click("#mapview button[data-v='3D']")
          if v=="history": pg.click("[data-sel='3']")
          if v=="learning": pg.click("[data-app='1']")
          pg.screenshot(path=f"/workspace/stella-mockups-shots/{d}-{t}-{w}-{v}.png",full_page=(w==390))
        pg.click("#connbtn"); pg.wait_for_timeout(200); pg.screenshot(path=f"/workspace/stella-mockups-shots/{d}-{t}-{w}-conn.png")
        pg.keyboard.press("Escape"); pg.evaluate("openVoice()"); pg.wait_for_timeout(1500); pg.screenshot(path=f"/workspace/stella-mockups-shots/{d}-{t}-{w}-voice.png")
        pg.close()
  b.close()
print("errors:",errs)
