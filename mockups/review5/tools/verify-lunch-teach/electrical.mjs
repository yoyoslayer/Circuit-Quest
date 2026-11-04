class Circuit {
  constructor(sources, leads, loads) {
    this.sources = sources;
    this.leads = leads;
    this.loads = loads;
  }
  sources;
  leads;
  loads;
  time = 0;
  events = [];
  draw = /* @__PURE__ */ new Map();
  resetBreaker(id) {
    const s = this.sources.find((s2) => s2.id === id);
    if (s) s.tripped = false;
  }
  tick(dt) {
    this.time += dt;
    this.draw.clear();
    const routes = /* @__PURE__ */ new Map();
    for (const source of this.sources) {
      if (source.tripped) continue;
      const visit = (node, path, seen) => {
        if (seen.has(node)) return;
        const next = new Set(seen).add(node);
        for (const edge of this.leads.filter((e) => e.from === node && e.closed && e.returnClosed !== false && !e.dead)) {
          if (edge.wet) {
            source.tripped = true;
            this.events.push({ time: this.time, kind: "short", id: source.id });
            return;
          }
          if (!routes.has(edge.to)) routes.set(edge.to, { source, path: [...path, edge] });
          visit(edge.to, [...path, edge], next);
        }
      };
      visit(source.id, [], /* @__PURE__ */ new Set());
    }
    const demand = /* @__PURE__ */ new Map();
    for (const load of this.loads) {
      const route = routes.get(load.id), cap = load.capacitor;
      if (cap?.node) cap.atLoad = !!route && route.path.some((e) => e.from === cap.node);
      const fed = !!cap && (cap.node ? routes.has(cap.node) : !!route);
      if (!load.enabled || !route || route.source.tripped) {
        if (cap && fed) cap.charge = Math.min(12, cap.charge + dt);
        continue;
      }
      const starting = load.state !== "on";
      if (starting) load.started = this.time;
      const kickActive = this.time - load.started < (load.kickSeconds ?? 1);
      let value = kickActive ? Math.max(load.steady, load.kick ?? 0) : load.steady;
      if (cap?.atLoad && value > load.steady) {
        const supplied = Math.min(cap.charge, (value - load.steady) * dt);
        cap.charge -= supplied;
        value -= supplied / dt;
      } else if (cap && fed) cap.charge = Math.min(12, cap.charge + dt);
      demand.set(load.id, value);
      this.draw.set(route.source.id, (this.draw.get(route.source.id) ?? 0) + value);
      for (const edge of route.path) this.draw.set(edge.id, (this.draw.get(edge.id) ?? 0) + value);
    }
    for (const source of this.sources) if (!source.tripped && (this.draw.get(source.id) ?? 0) > source.limit + 1e-6) {
      source.tripped = true;
      this.events.push({ time: this.time, kind: "trip", id: source.id });
    }
    for (const edge of this.leads) {
      const amps = this.draw.get(edge.id) ?? 0;
      edge.heat = Math.max(0, edge.heat + (amps > edge.rating ? (amps / edge.rating - 1) * dt : -dt * 0.4));
      if (edge.heat >= 2 && !edge.dead) {
        edge.dead = true;
        this.events.push({ time: this.time, kind: "scorch", id: edge.id });
      }
    }
    for (const load of this.loads) {
      const route = routes.get(load.id), was = load.state;
      load.state = !load.enabled || !route ? "off" : route.source.tripped || route.path.some((e) => e.dead) ? "brownout" : "on";
      if (was !== "on" && load.state === "on") this.events.push({ time: this.time, kind: "start", id: load.id });
      if (was === "on" && load.state !== "on") this.events.push({ time: this.time, kind: "stop", id: load.id });
    }
  }
}
export {
  Circuit
};
