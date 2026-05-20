# OpenTripPlanner 2 graph data

Drop OSM `.pbf` and GTFS `.zip` feeds into this folder, then start OTP
with the `otp` profile:

```sh
pnpm docker:up --profile otp
```

The OTP container will build the graph (`--build --save`), persist it
under `graph.obj`, and serve it on `http://localhost:8088/otp`.

The backend talks to OTP when `ROUTING_PROVIDER=otp` and
`OTP_BASE_URL=http://otp:8080/otp/v1` are set in `.env`.

Recommended feeds for a working DE / FR / TN demo (download manually):

- `germany.osm.pbf` from <https://download.geofabrik.de/europe/germany.html>
- `france.osm.pbf` from <https://download.geofabrik.de/europe/france.html>
- `tunisia.osm.pbf` from <https://download.geofabrik.de/africa/tunisia.html>
- GTFS feeds: DELFI / VBB / SNCF / SNCFT / TRANSTU (per provider terms)

Note: a full multi-country graph needs ≥8 GB RAM. For dev, start with
just one country.
