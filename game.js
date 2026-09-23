import * as THREE from "three";

const $ = (id) => document.getElementById(id);

const state = {
  mode: "title",
  mission: "ace",
  keys: {},
  kills: 0,
  ammo: 1880,
  throttle: 0.82,
  hp: 100,
  time: 0,
  cameraMode: 0,
  padlock: true,
  quotes: [
    "Check six.",
    "Stay fast. Energy is life.",
    "Don't turn with a 109 if you can boom and zoom.",
    "Talk about long odds.",
    "It's a great day for flying.",
    "Put the pipper on him and squeeze.",
    "He's breaking. Stay with him.",
    "Nice shooting.",
  ],
  quoteT: 0,
};

const QUOTES_WIN = [
  "That's how you do it. Five in one hop.",
  "You flew it like you meant it.",
  "The 109s won't forget that Mustang.",
];
const QUOTES_LOSS = [
  "You get dead, you don't get a second pass.",
  "Altitude and airspeed. You spent both.",
  "That's a long walk home from here.",
];

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#7aa0c4");
scene.fog = new THREE.Fog("#8fb0c8", 1800, 14000);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.5, 20000);
const clock = new THREE.Clock();

scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x3d4a2a, 0.85));
const sun = new THREE.DirectionalLight(0xfff1d0, 1.15);
sun.position.set(400, 800, 200);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

function makeSky() {
  const geo = new THREE.SphereGeometry(16000, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {},
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vP;
      void main(){
        float h = normalize(vP).y;
        vec3 top = vec3(0.35, 0.55, 0.78);
        vec3 hor = vec3(0.78, 0.82, 0.74);
        vec3 bot = vec3(0.55, 0.58, 0.48);
        vec3 col = mix(hor, top, smoothstep(0.0, 0.55, h));
        col = mix(bot, col, smoothstep(-0.15, 0.05, h));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(geo, mat));
}
makeSky();

function makeGround() {
  const size = 24000;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#4a5a32";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = i % 3 ? "#55673a" : "#3f4e2c";
    const x = Math.random() * 512, y = Math.random() * 512;
    ctx.fillRect(x, y, 40 + Math.random() * 80, 30 + Math.random() * 60);
  }
  for (let i = 0; i < 18; i++) {
    ctx.strokeStyle = "#6b5a3a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, Math.random() * 512);
    ctx.lineTo(Math.random() * 512, Math.random() * 512);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(48, 48);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshLambertMaterial({ map: tex })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  for (let i = 0; i < 40; i++) {
    const w = 180 + Math.random() * 320;
    const d = 140 + Math.random() * 280;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, 4, d),
      new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? "#5a6b38" : "#6a5a32" })
    );
    mesh.position.set((Math.random() - 0.5) * 9000, 2, (Math.random() - 0.5) * 9000);
    scene.add(mesh);
  }
}
makeGround();

function makeClouds() {
  const mat = new THREE.MeshLambertMaterial({ color: "#eef3f6", transparent: true, opacity: 0.55 });
  for (let i = 0; i < 28; i++) {
    const g = new THREE.Group();
    const n = 3 + (i % 4);
    for (let j = 0; j < n; j++) {
      const s = 80 + Math.random() * 160;
      const m = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), mat);
      m.position.set((j - n / 2) * 90, Math.random() * 30, (Math.random() - 0.5) * 80);
      m.scale.y = 0.45;
      g.add(m);
    }
    g.position.set((Math.random() - 0.5) * 12000, 900 + Math.random() * 900, (Math.random() - 0.5) * 12000);
    scene.add(g);
  }
}
makeClouds();

function buildFighter(kind) {
  const g = new THREE.Group();
  const isP51 = kind === "p51";
  const fuseCol = isP51 ? 0xb8a070 : 0x6b7348;
  const wingCol = isP51 ? 0x9a8a5c : 0x5c6440;
  const noseCol = isP51 ? 0xc4b48a : 0x4a5234;

  const fuse = new THREE.Mesh(
    new THREE.CapsuleGeometry(isP51 ? 1.15 : 1.05, 8.2, 4, 10),
    new THREE.MeshLambertMaterial({ color: fuseCol })
  );
  fuse.rotation.z = Math.PI / 2;
  fuse.castShadow = true;
  g.add(fuse);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(1.05, 3.2, 8),
    new THREE.MeshLambertMaterial({ color: noseCol })
  );
  nose.rotation.z = -Math.PI / 2;
  nose.position.z = 5.6;
  g.add(nose);

  const spinner = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 8, 6),
    new THREE.MeshLambertMaterial({ color: isP51 ? 0xc9a227 : 0x333 })
  );
  spinner.position.z = 7.2;
  g.add(spinner);

  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(isP51 ? 16.4 : 14.6, 0.28, 2.6),
    new THREE.MeshLambertMaterial({ color: wingCol })
  );
  wing.position.set(0, -0.15, 0.4);
  wing.castShadow = true;
  g.add(wing);

  const stab = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.2, 1.4),
    new THREE.MeshLambertMaterial({ color: wingCol })
  );
  stab.position.set(0, 0.15, -4.4);
  g.add(stab);

  const fin = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 2.4, 1.8),
    new THREE.MeshLambertMaterial({ color: fuseCol })
  );
  fin.position.set(0, 1.3, -4.5);
  g.add(fin);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x87b4d2, transparent: true, opacity: 0.55 })
  );
  canopy.position.set(0, 0.85, 1.1);
  canopy.scale.set(0.85, 0.7, 1.4);
  g.add(canopy);

  if (isP51) {
    const scoop = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.7, 2.2),
      new THREE.MeshLambertMaterial({ color: 0x8a7a50 })
    );
    scoop.position.set(0, -1.15, -0.6);
    g.add(scoop);
  }

  const prop = new THREE.Mesh(
    new THREE.CircleGeometry(3.1, 20),
    new THREE.MeshBasicMaterial({ color: 0x222, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
  );
  prop.position.z = 7.35;
  prop.name = "prop";
  g.add(prop);

  g.userData.kind = kind;
  return g;
}

function makeCraft(kind, isPlayer) {
  const mesh = buildFighter(kind);
  scene.add(mesh);
  const craft = {
    mesh,
    kind,
    isPlayer,
    pos: new THREE.Vector3(0, 2600, 0),
    quat: new THREE.Quaternion(),
    vel: new THREE.Vector3(0, 0, 140),
    speed: 140,
    throttle: isPlayer ? 0.82 : 0.78,
    hp: isPlayer ? 100 : 28,
    alive: true,
    fireCd: 0,
    ai: { target: null, mode: "engage", timer: 0, rollT: 0 },
    tracers: [],
  };
  mesh.position.copy(craft.pos);
  return craft;
}

const player = makeCraft("p51", true);
const enemies = [];
const bullets = [];
const explosions = [];

function resetWorld(mission) {
  state.mission = mission;
  state.kills = 0;
  state.ammo = 1880;
  state.hp = 100;
  state.time = 0;
  state.throttle = 0.82;
  player.hp = 100;
  player.alive = true;
  player.pos.set(0, 2600, 0);
  player.quat.identity();
  player.speed = 145;
  player.throttle = 0.82;
  player.vel.set(0, 0, 145);
  player.mesh.visible = true;

  enemies.forEach((e) => scene.remove(e.mesh));
  enemies.length = 0;
  bullets.forEach((b) => scene.remove(b.mesh));
  bullets.length = 0;

  const count = mission === "free" ? 0 : 5;
  for (let i = 0; i < count; i++) {
    const e = makeCraft("bf109", false);
    const a = (i / count) * Math.PI * 2;
    e.pos.set(Math.cos(a) * (700 + i * 80), 2400 + Math.sin(i) * 180, 1600 + Math.sin(a) * 700);
    e.speed = 125 + Math.random() * 20;
    e.quat.setFromEuler(new THREE.Euler(0, a + Math.PI, 0));
    enemies.push(e);
  }
  say(mission === "free" ? "It's a great day for flying." : "Bandits twelve o'clock. Stay fast.");
}

function say(text) {
  const el = $("yeager");
  el.textContent = "YEAGER — " + text;
  el.style.opacity = "1";
  state.quoteT = 3.6;
}

function feed(text) {
  const el = $("killfeed");
  const row = document.createElement("div");
  row.textContent = text;
  el.prepend(row);
  setTimeout(() => row.remove(), 4200);
}

addEventListener("keydown", (e) => {
  state.keys[e.code] = true;
  if (e.code === "Space") e.preventDefault();
  if (e.code === "KeyC") state.cameraMode = (state.cameraMode + 1) % 3;
  if (e.code === "KeyT") state.padlock = !state.padlock;
  if (e.code === "Escape" && state.mode === "flight") setMode("pause");
  else if (e.code === "Escape" && state.mode === "pause") setMode("flight");
});
addEventListener("keyup", (e) => { state.keys[e.code] = false; });
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

$("btn-brief").onclick = () => setMode("brief");
$("btn-back").onclick = () => setMode("title");
$("btn-scramble").onclick = () => start("ace");
$("btn-free").onclick = () => start("free");
$("btn-resume").onclick = () => setMode("flight");
$("btn-menu").onclick = () => setMode("title");
$("btn-again").onclick = () => start(state.mission);
$("btn-home").onclick = () => setMode("title");

function setMode(m) {
  state.mode = m;
  $("title").classList.toggle("hidden", m !== "title");
  $("brief").classList.toggle("hidden", m !== "brief");
  $("pause").classList.toggle("hidden", m !== "pause");
  $("debrief").classList.toggle("hidden", m !== "debrief");
  $("hud").style.display = m === "flight" || m === "pause" ? "block" : "none";
}

function start(mission) {
  resetWorld(mission);
  setMode("flight");
  clock.getDelta();
}

const fwd = new THREE.Vector3();
const up = new THREE.Vector3();
const right = new THREE.Vector3();
const tmp = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const euler = new THREE.Euler();

function axes(q) {
  fwd.set(0, 0, 1).applyQuaternion(q);
  up.set(0, 1, 0).applyQuaternion(q);
  right.set(1, 0, 0).applyQuaternion(q);
}

function fly(craft, dt, input) {
  if (!craft.alive) return;
  const maxSpeed = craft.kind === "p51" ? 210 : 195;
  const minSpeed = 48;

  let pitch = 0, roll = 0, yaw = 0;
  if (input) {
    if (state.keys.KeyW || state.keys.ArrowUp) pitch = 1;
    if (state.keys.KeyS || state.keys.ArrowDown) pitch = -1;
    if (state.keys.KeyA || state.keys.ArrowLeft) roll = 1;
    if (state.keys.KeyD || state.keys.ArrowRight) roll = -1;
    if (state.keys.KeyQ) yaw = 1;
    if (state.keys.KeyE) yaw = -1;
    if (state.keys.KeyR) craft.throttle = Math.min(1, craft.throttle + dt * 0.55);
    if (state.keys.KeyF) craft.throttle = Math.max(0.05, craft.throttle - dt * 0.55);
    if (input === "player") state.throttle = craft.throttle;
  }

  const rate = craft.isPlayer ? 1 : 0.72;
  tmpQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch * 1.15 * rate * dt);
  craft.quat.multiply(tmpQ);
  tmpQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll * 1.8 * rate * dt);
  craft.quat.multiply(tmpQ);
  tmpQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw * 0.7 * rate * dt);
  craft.quat.multiply(tmpQ);
  craft.quat.normalize();

  axes(craft.quat);
  const target = minSpeed + craft.throttle * (maxSpeed - minSpeed);
  const climb = fwd.y;
  const accel = (target - craft.speed) * 0.55 - climb * 38;
  craft.speed = THREE.MathUtils.clamp(craft.speed + accel * dt, 32, maxSpeed + 20);

  if (craft.speed < 70) {
    tmpQ.setFromAxisAngle(right, 0.55 * dt);
    craft.quat.multiply(tmpQ);
  }

  craft.vel.copy(fwd).multiplyScalar(craft.speed);
  craft.vel.y -= (18 * (1 - THREE.MathUtils.clamp(craft.speed / 140, 0, 1))) * dt;
  craft.pos.addScaledVector(craft.vel, dt);

  if (craft.pos.y < 12) {
    craft.pos.y = 12;
    if (craft.speed > 40) hit(craft, 80, "ground");
    craft.speed *= 0.4;
  }
  if (craft.pos.y > 4200) craft.pos.y = 4200;

  craft.mesh.position.copy(craft.pos);
  craft.mesh.quaternion.copy(craft.quat);
  const prop = craft.mesh.getObjectByName("prop");
  if (prop) prop.rotation.z += dt * (8 + craft.throttle * 28);

  craft.fireCd = Math.max(0, craft.fireCd - dt);
}

function aiThink(e, dt) {
  if (!e.alive || !player.alive) return;
  e.ai.timer -= dt;
  const toP = tmp.copy(player.pos).sub(e.pos);
  const dist = toP.length();
  axes(e.quat);
  const los = toP.normalize();
  const align = fwd.dot(los);

  const desiredFwd = los;
  const axis = tmp.copy(fwd).cross(desiredFwd);
  if (axis.lengthSq() > 1e-6) {
    axis.normalize();
    const ang = Math.acos(THREE.MathUtils.clamp(fwd.dot(desiredFwd), -1, 1));
    const step = Math.min(ang, 0.85 * dt);
    tmpQ.setFromAxisAngle(axis, step);
    e.quat.premultiply(tmpQ);
  }

  e.throttle = dist > 900 ? 0.95 : 0.72;
  if (align > 0.92 && dist < 700 && e.fireCd <= 0) {
    fire(e, false);
  }
  if (dist < 180) {
    tmpQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (Math.random() > 0.5 ? 1 : -1) * dt * 1.4);
    e.quat.multiply(tmpQ);
  }
}

function fire(craft, isPlayer) {
  if (craft.fireCd > 0) return;
  if (isPlayer) {
    if (state.ammo <= 0) return;
    state.ammo = Math.max(0, state.ammo - 8);
  }
  craft.fireCd = isPlayer ? 0.07 : 0.18;
  axes(craft.quat);
  for (let i = -1; i <= 1; i += 2) {
    const origin = craft.pos.clone().addScaledVector(right, i * 6.2).addScaledVector(fwd, 8);
    const dir = fwd.clone();
    if (!isPlayer) {
      dir.add(tmp.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.04)).normalize();
    }
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 8, 4),
      new THREE.MeshBasicMaterial({ color: isPlayer ? 0xffee88 : 0xff5533 })
    );
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    mesh.position.copy(origin);
    scene.add(mesh);
    bullets.push({
      mesh,
      pos: origin,
      dir,
      speed: craft.speed + 420,
      life: 1.15,
      fromPlayer: isPlayer,
      owner: craft,
    });
  }
}

function hit(craft, dmg, why) {
  if (!craft.alive) return;
  craft.hp -= dmg;
  if (craft.isPlayer) {
    state.hp = Math.max(0, craft.hp);
    $("damage-vignette").style.boxShadow = `inset 0 0 ${80 + (100 - state.hp)}px rgba(140,20,10,${0.15 + (100 - state.hp) / 180})`;
    if (why === "guns") say("You're taking hits. Break!");
  }
  if (craft.hp <= 0) kill(craft, why);
}

function kill(craft, why) {
  craft.alive = false;
  craft.mesh.visible = false;
  burst(craft.pos);
  if (craft.isPlayer) {
    endMission(false);
  } else {
    state.kills += 1;
    feed("Bf 109 DESTROYED");
    if (state.kills === 1) say("First one's down. Keep your energy.");
    else if (state.kills === 3) say("Three. Two more and you're an ace today.");
    else if (state.kills === 5) say("That's five. Ace in a day.");
    if (state.mission === "ace" && state.kills >= 5) endMission(true);
  }
}

function burst(pos) {
  const group = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(2 + Math.random() * 4, 6, 5),
      new THREE.MeshBasicMaterial({ color: Math.random() > 0.4 ? 0xffaa33 : 0x333 })
    );
    m.position.copy(pos);
    m.userData.v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).multiplyScalar(80);
    group.add(m);
  }
  scene.add(group);
  explosions.push({ group, t: 0 });
}

function endMission(win) {
  const t = Math.floor(state.time);
  $("debrief-kicker").textContent = win ? "12 OCTOBER 1944 · CONFIRMED" : "MISSION FAILED";
  $("debrief-title").textContent = win ? "ACE IN A DAY" : "KILLED IN ACTION";
  $("db-kills").textContent = String(state.kills);
  $("db-time").textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  $("db-ammo").textContent = String(state.ammo);
  $("db-dmg").textContent = `${Math.max(0, 100 - Math.floor(state.hp))}%`;
  const pool = win ? QUOTES_WIN : QUOTES_LOSS;
  $("debrief-quote").textContent = "\u201c" + pool[Math.floor(Math.random() * pool.length)] + "\u201d — Yeager";
  setMode("debrief");
}

const camTarget = new THREE.Vector3();
const camPos = new THREE.Vector3();

function updateCamera(dt) {
  axes(player.quat);
  if (state.cameraMode === 1) {
    camPos.copy(player.pos).addScaledVector(up, 1.2).addScaledVector(fwd, 2.2);
    camera.position.copy(camPos);
    camera.up.copy(up);
    camera.lookAt(player.pos.clone().addScaledVector(fwd, 40).addScaledVector(up, 0.2));
  } else {
    const back = state.cameraMode === 2 ? 18 : 22;
    const lift = state.cameraMode === 2 ? 4.5 : 6.5;
    camTarget.copy(player.pos).addScaledVector(fwd, -back).addScaledVector(up, lift);
    camera.position.lerp(camTarget, 1 - Math.pow(0.0008, dt));
    camera.up.lerp(up, 0.15);
    const look = player.pos.clone().addScaledVector(fwd, 18).addScaledVector(up, 1.5);
    camera.lookAt(look);
  }
}

function project(v) {
  const p = v.clone().project(camera);
  return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight, z: p.z };
}

function updateHud() {
  const ias = Math.round(player.speed * 1.72);
  const alt = Math.round(player.pos.y * 3.28);
  euler.setFromQuaternion(player.quat, "YXZ");
  let hdg = THREE.MathUtils.radToDeg(euler.y);
  hdg = (hdg + 360) % 360;
  $("ias").textContent = String(ias);
  $("alt").textContent = String(alt);
  $("hdg").textContent = String(Math.round(hdg)).padStart(3, "0");
  $("thr").textContent = Math.round(player.throttle * 100) + "%";
  $("ammo").textContent = String(state.ammo);
  $("kills").textContent = state.mission === "free" ? String(state.kills) : `${state.kills} / 5`;
  $("bandits").textContent = `BANDITS ${enemies.filter((e) => e.alive).length}`;
  $("gread").textContent = (1 + Math.abs(player.speed - 140) / 180).toFixed(1);
  if (ias < 130) $("ias").classList.add("warn"); else $("ias").classList.remove("warn");

  let nearest = null, nd = 1e9;
  for (const e of enemies) {
    if (!e.alive) continue;
    const d = e.pos.distanceTo(player.pos);
    if (d < nd) { nd = d; nearest = e; }
  }
  const lead = $("lead");
  if (nearest && nd < 2200) {
    const pred = nearest.pos.clone().addScaledVector(
      new THREE.Vector3(0, 0, 1).applyQuaternion(nearest.quat).multiplyScalar(nearest.speed * 0.35),
      1
    );
    const s = project(pred);
    if (s.z < 1) {
      lead.style.display = "block";
      lead.style.left = s.x + "px";
      lead.style.top = s.y + "px";
    } else lead.style.display = "none";
  } else lead.style.display = "none";
}

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (state.mode !== "flight") {
    if (player.mesh) renderer.render(scene, camera);
    return;
  }
  state.time += dt;
  if (state.quoteT > 0) {
    state.quoteT -= dt;
    if (state.quoteT <= 0) $("yeager").style.opacity = "0";
  } else if (Math.random() < 0.0015) {
    say(state.quotes[Math.floor(Math.random() * state.quotes.length)]);
  }

  fly(player, dt, "player");
  if (state.keys.Space) fire(player, true);

  for (const e of enemies) {
    aiThink(e, dt);
    fly(e, dt, null);
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.life -= dt;
    b.pos.addScaledVector(b.dir, b.speed * dt);
    b.mesh.position.copy(b.pos);
    if (b.life <= 0 || b.pos.y < 4) {
      scene.remove(b.mesh);
      bullets.splice(i, 1);
      continue;
    }
    const targets = b.fromPlayer ? enemies : [player];
    for (const t of targets) {
      if (!t.alive) continue;
      if (b.pos.distanceTo(t.pos) < 9) {
        hit(t, b.fromPlayer ? 7 : 6, "guns");
        scene.remove(b.mesh);
        bullets.splice(i, 1);
        break;
      }
    }
  }

  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    ex.t += dt;
    ex.group.children.forEach((c) => {
      c.position.addScaledVector(c.userData.v, dt);
      c.userData.v.y -= 30 * dt;
      c.scale.multiplyScalar(0.97);
    });
    if (ex.t > 1.2) {
      scene.remove(ex.group);
      explosions.splice(i, 1);
    }
  }

  updateCamera(dt);
  updateHud();
  renderer.render(scene, camera);
}

setMode("title");
resetWorld("ace");
camera.position.set(30, 2620, -40);
camera.lookAt(player.pos);
tick();
